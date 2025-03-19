/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from "lodash/throttle";
import { range as fishRange, dom, transforms, helper } from "../utils";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";

type IMatchesType = { replaceText: string; start: number; keyId: string; end: number };
interface InputOptions {
  /** Match word highlighted color */
  highlightColor?: string;
  /** Need to match the text array of highlighted words */
  matchWordsList?: string[];
  /** Throttle duration */
  throttleTime?: number;
}

class Input extends Module<InputOptions> {
  static DEFAULTS: InputOptions = {
    highlightColor: "red",
    throttleTime: 300
  };
  /** @name highlight cover node*/
  highlightCoverDom: HTMLElement;
  /** @name Match words data */
  matchWordsList: string[];
  /** @name throttle */
  emitThrottled = throttle(async () => {
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, this.options.throttleTime);
  constructor(fishEditor: FishEditor, options: Partial<InputOptions>) {
    super(fishEditor, options);
    this.matchWordsList = this.options.matchWordsList;
    // change this direction
    this.handleInputChange = this.handleInputChange.bind(this);
    this.onScrollChange = this.onScrollChange.bind(this);

    this.handleComposition();

    // add cover-mask dom
    if (this.matchWordsList?.length && this.fishEditor.container) {
      if (this.highlightCoverDom) {
        this.removeHighlightCoverDom();
        requestAnimationFrame(() => {
          this.addHighlightCoverDom();
        });
      } else {
        this.addHighlightCoverDom();
      }
    }

    fishEditor.root.addEventListener("beforeinput", (event: InputEvent) => {
      this.handleBeforeInput(event);
    });

    fishEditor.root.addEventListener("input", this.handleInput.bind(this, true));
  }
  /** Monitor editor scrolling */
  private onScrollChange() {
    const scrollTop = this.fishEditor.scrollDom.scrollTop;
    this.highlightCoverDom.scrollTop = scrollTop;
  }

  /** trigger text conversion event listening */
  private handleInputChange() {
    // Promise asynchronous execution
    Promise.resolve().then(() => {
      handleInputTransforms.call(this);
    });
  }
  /** add matching word mask nodes */
  private addHighlightCoverDom() {
    this.highlightCoverDom = document.createElement("div");
    this.highlightCoverDom.classList.add("fb-cover-mask-box");
    this.fishEditor.container.classList.add("is-highlight");
    this.fishEditor.container.appendChild(this.highlightCoverDom);
    this.fishEditor.scrollDom.addEventListener("scroll", this.onScrollChange);

    // When the monitoring value changes, we actively trigger text conversion
    this.fishEditor.on(Emitter.events.EDITOR_CHANGE, this.handleInputChange);

    this.fishEditor.on(Emitter.events.EDITOR_INPUT_CHANGE, this.handleInputChange);
  }

  /** @name Delete matching word mask node */
  private removeHighlightCoverDom() {
    if (this.highlightCoverDom) {
      this.fishEditor.container.removeChild(this.highlightCoverDom);
    }
    this.fishEditor.container.classList.remove("is-highlight");
    this.fishEditor.scrollDom.removeEventListener("scroll", this.onScrollChange);
    this.fishEditor.off(Emitter.events.EDITOR_CHANGE, this.handleInputChange);
    this.fishEditor.off(Emitter.events.EDITOR_INPUT_CHANGE, this.handleInputChange);
    // set null
    this.matchWordsList = null;
    this.highlightCoverDom = null;
  }

  /** Set matching word data */
  public setMatchWords(list: string[], cb?: () => void) {
    if (list.length) {
      this.removeHighlightCoverDom();
      this.fishEditor.clear();
      this.matchWordsList = list;
      requestAnimationFrame(() => {
        this.addHighlightCoverDom();
        cb?.();
      });
    } else {
      this.removeHighlightCoverDom();
    }
  }

  private handleComposition() {
    this.fishEditor.on(Emitter.events.COMPOSITION_END, () => {
      this.handleInput(false);
    });
  }

  private handleInput(isOriginalEvent: boolean) {
    if (isOriginalEvent) {
      Promise.resolve().then(() => {
        // Update placeholder visibility
        const hasEmpty = this.fishEditor.editor.isEditorEmptyNode();
        this.fishEditor.container.classList.toggle("is-placeholder-visible", hasEmpty);

        if (this.matchWordsList?.length) {
          handleInputTransforms.call(this);
        }
      });
    }
    /** isComposing ?? */
    if (this.fishEditor.composition.isComposing) return;
    this.emitThrottled();
  }
  private handleBeforeInput(event: InputEvent) {
    const rangeInfo = fishRange.getRange();
    // console.log(event, rangeInfo);
  }
}

/**
 * @name Text Conver
 */
const handleInputTransforms = async function () {
  if (!this.matchWordsList.length) return false;

  const content = this.fishEditor.getText();

  // Original string
  // const strCont = '1234125627'
  // const wordsList = ['12', '23', '2'].sort((a, b) => b.length - a.length)

  const strCont = transforms.labelRep(content, true);
  // duplicate removal
  const uniqueArray = [...new Set(this.matchWordsList)] as string[];
  // sort
  const wordsList = uniqueArray.sort((a, b) => b.length - a.length);

  // Store matching info
  const matches: IMatchesType[] = [];
  const fakeMatches: IMatchesType[] = [];

  for (let i = 0; i < wordsList.length; i++) {
    const text = wordsList[i];
    let index = strCont.indexOf(text);

    while (index !== -1) {
      // 当前需要匹配的字符串的开始位置是否在历史匹配器中存在，存在代表已经匹配过了不需要匹配了
      const isFlag = matches.some((match) => match.start <= index && match.end >= index);
      const keyId = helper.generateRandomString(5);
      if (!isFlag) {
        matches.push({
          replaceText: `<span style="color: ${this.options.highlightColor};">${text}</span>`,
          keyId: `id=${keyId}`,
          start: index,
          end: index + text.length
        });
      }
      fakeMatches.push({
        replaceText: `<span style="color: ${this.options.highlightColor};">${text}</span>`,
        keyId: `id=${keyId}`,
        start: index,
        end: index + text.length
      });

      // Continue to search from the current found character position onwards
      index = strCont.indexOf(text, index + 1);
    }
  }

  // console.log(matches, fakeMatches, strCont)

  /**
    // Example usage
    const originalStr = '1234567';
    const replacements = [
      { replaceText: '<span style="color: red;">12</span>', keyId: `id=${keyId}` start: 0, end: 2 }
    ];
    const newStr = applyReplacements(originalStr, replacements);
    console.log(newStr); // Output: `id=${keyId}`34567
  */
  const strCont2 = applyReplacements(strCont, matches);

  let strCont3 = transforms.labelRep(strCont2);

  matches.forEach((item) => {
    strCont3 = strCont3?.replace(item.keyId, item.replaceText);
  });

  const lines = strCont3?.split(/\r\n|\r|\n/) || [];
  const nodes = [];
  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const dom_p = document.createElement("p");
    dom_p.innerHTML = lineContent == "" ? "<br>" : lineContent;
    nodes.push(dom_p);
  }
  dom.toTargetAddNodes(this.highlightCoverDom, nodes as any[]);
  return true;
};

function applyReplacements(original: string, replacements: IMatchesType[]) {
  // 按起始位置排序，确保顺序处理
  const sorted = [...replacements].sort((a, b) => a.start - b.start);
  let result = "";
  let currentIndex = 0;

  for (const { start, end, keyId } of sorted) {
    if (start > original.length) continue; // 忽略超出范围的替换
    // 添加当前指针到start之间的原始内容
    result += original.slice(currentIndex, start);
    // 添加替换内容为模版keyId
    result += keyId;
    // 更新指针到当前替换的结束位置
    currentIndex = Math.min(end, original.length);
  }
  // 添加剩余部分
  result += original.slice(currentIndex);
  return result;
}

export default Input;
