/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from "lodash/throttle";
import { dom, transforms, helper } from "../utils";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type { IRange } from "../core/selection";
import type FishEditor from "../core/fish-editor";
import { recordCompositionStartContainer, handleMaxLengthFn } from "./utils/maximum";

const INSERT_TYPES = ["insertText", "insertReplacementText"];

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
  /** @name editor mirror node, Rolling placeholder */
  editorMirrorDom: HTMLElement;
  /** @name Match words data */
  matchWordsList: string[];
  /** @name throttle */
  emitThrottled = throttle(async () => {
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, this.options.throttleTime);
  /** @name ResizeObserver instance */
  private resizeObserver: ResizeObserver | null = null;
  constructor(fishEditor: FishEditor, options: Partial<InputOptions>) {
    super(fishEditor, options);
    this.matchWordsList = this.options.matchWordsList;
    // change this direction
    this.handleEditorChange = this.handleEditorChange.bind(this);

    // add cover-mask dom
    if (this.matchWordsList?.length && this.fishEditor.scrollDom) {
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

    // Gboard with English input on Android triggers `compositionstart` sometimes even
    // users are not going to type anything.
    if (!/Android/i.test(navigator.userAgent)) {
      fishEditor.on(Emitter.events.COMPOSITION_START, (_, contextFishEditor: any) => {
        this.handleCompositionStart(contextFishEditor);
      });
    }

    // 360 browser won't trigger, Google will
    this.fishEditor.on(Emitter.events.COMPOSITION_END, (event: CompositionEvent, contextFishEditor: any) => {
      this.handleCompositionEnd(event, contextFishEditor);
    });

    fishEditor.root.addEventListener("input", this.handleInput.bind(this));
  }

  /** @name Google - Chinese composition Start will be triggered */
  private handleCompositionStart(contextFishEditor: any) {
    const range = this.fishEditor.selection.getRange();
    if (range) {
      // replaceText
      const flag = this.replaceText(range);
      // After deleting the selection in replaceText, obtain the selection again
      const range2 = this.fishEditor.selection.getRange();
      // The CompositionStart process records the current selection area information for use when maxLength is triggered
      recordCompositionStartContainer(flag, range2, contextFishEditor);
    }
  }

  /** @name Google - Chinese composition will be triggered when it ends */
  private handleCompositionEnd(event: CompositionEvent, contextFishEditor: any) {
    /** the current composition content */
    let data = "";
    if (typeof event.data === "string") {
      data = event.data;
    }
    if (!data) return;
    // handle the maximum input length
    if (this.fishEditor.options.maxLength) {
      handleMaxLengthFn.call(this, data, contextFishEditor);
    }
    // trigger an update
    this.emitThrottled();
  }

  /**
   * @name 这个事件只有谷歌中文作曲时，才会执行
   * 1. 因为谷歌中文作曲时handleBeforeInput方法拦截不住，会触发输入框的input事件。
   * 2. 其它浏览器在handleBeforeInput方法拦截到了，并不会触发。
   * 3. 主要解决谷歌中文作曲时，触发placeholder是否显示。
   */
  private handleInput() {
    Promise.resolve().then(() => {
      // Update placeholder visibility
      const hasEmpty = this.fishEditor.editor.isEmpty();
      this.fishEditor.container.classList.toggle("is-placeholder-visible", hasEmpty);

      if (this.matchWordsList?.length) {
        handleInputTransforms.call(this);
      }
    });
    // /** isComposing ?? */
    if (this.fishEditor.composition.isComposing) return;
    this.emitThrottled();
  }

  /**
   * @name handleBeforeInput
   * @desc When event.preventDefault is executed, the input event will not trigger
   * @param event
   * @returns
   */
  private handleBeforeInput(event: InputEvent) {
    /**
     *Attention points:
     *Some browsers, such as IE 360 Extreme X, will trigger before input when composing in Chinese, and the input type will be insertText;
     *But Google inputType will be insertCompositeText, so when composing music in Google Chinese, it will directly return without executing the subsequent logic
     */

    if (this.fishEditor.composition.isComposing || event.defaultPrevented || !INSERT_TYPES.includes(event.inputType)) {
      return;
    }

    const staticRange = event.getTargetRanges ? event.getTargetRanges()[0] : null;

    /**
     * 非作曲时的输入，需要判断最大值
     * Maximum word count limit
     */
    const maxLength = this.fishEditor.options.maxLength;

    if (maxLength) {
      const length = this.fishEditor.editor.getLength() + 1;
      if (staticRange.collapsed === true && maxLength && length && length > maxLength) {
        event.preventDefault();
        this.fishEditor.emit(Emitter.events.EDITOR_MAXLENGTH);
        return;
      }
    }

    const text = getPlainTextFromInputEvent(event);
    if (text == null) {
      return;
    }

    /** no range */
    if (!staticRange || staticRange.collapsed === true) {
      event.preventDefault();
      this.fishEditor.insertTextInterceptor(text, true, (success) => {
        if (success) {
          Promise.resolve().then(() => {
            this.fishEditor.emit(Emitter.events.EDITOR_BEFORE_CHANGE);
            this.emitThrottled();
          });
          this.fishEditor.scrollSelectionIntoView();
        }
      });
      return;
    }

    // If there is a selection, delete and replace it
    const range = this.fishEditor.selection.normalizeNative(staticRange as Range);
    // 360- It will trigger the insertion after deleting the selection area here
    const flag = this.replaceText(range, text);
    if (range && flag) {
      event.preventDefault();
    }
  }

  /**
   * exist selection ? delete the selection
   * @param range
   * @param text
   * @returns
   */
  private replaceText(range: IRange, text = "") {
    if (range.collapsed) {
      return false;
    }
    if (text) {
      this.fishEditor.selection.deleteRange(range, () => {
        this.fishEditor.insertTextInterceptor(text, true, (success) => {
          if (success) {
            Promise.resolve().then(() => {
              this.fishEditor.emit(Emitter.events.EDITOR_BEFORE_CHANGE);
              this.emitThrottled();
            });
            this.fishEditor.scrollSelectionIntoView();
          }
        });
      });
    } else {
      this.fishEditor.selection.deleteRange(range);
    }
    return true;
  }

  /** @name trigger text conversion event listening */
  private handleEditorChange() {
    // Promise asynchronous execution
    Promise.resolve().then(() => {
      handleInputTransforms.call(this);
    });
  }

  /** @name add matching word mask nodes */
  private addHighlightCoverDom() {
    this.highlightCoverDom = document.createElement("div");
    this.highlightCoverDom.classList.add("fb-cover-mask-box");

    // 把滚动容器节点的Padding值获取出来赋值给遮罩层节点
    const scrollDomStyle = getScrollDomPadding(this.fishEditor.scrollDom);
    if (scrollDomStyle) {
      // add CoverDom style
      this.highlightCoverDom.style.paddingTop = scrollDomStyle.paddingTop;
      this.highlightCoverDom.style.paddingRight = scrollDomStyle.paddingRight;
      this.highlightCoverDom.style.paddingBottom = scrollDomStyle.paddingBottom;
      this.highlightCoverDom.style.paddingLeft = scrollDomStyle.paddingLeft;
      // add editorRootDom style
      this.fishEditor.root.style.paddingTop = scrollDomStyle.paddingTop;
      this.fishEditor.root.style.paddingRight = scrollDomStyle.paddingRight;
      this.fishEditor.root.style.paddingBottom = scrollDomStyle.paddingBottom;
      this.fishEditor.root.style.paddingLeft = scrollDomStyle.paddingLeft;
    }

    {
      // 添加占位符容器来撑高editor-scroll的高度
      this.editorMirrorDom = document.createElement("div");
      // 预设一个高度
      this.editorMirrorDom.style.height = `${this.fishEditor.options.maxHeight}px`;
      requestAnimationFrame(() => {
        // 使用 offsetHeight 获取布局高度
        const height = getContentHeightWithoutPadding(this.fishEditor.root);
        this.editorMirrorDom.style.height = `${height}px`;

        // console.log(height)
        // 使用 DocumentFragment 一次性添加多个子节点
        const fragment = document.createDocumentFragment();
        fragment.appendChild(this.highlightCoverDom);
        fragment.appendChild(this.editorMirrorDom);

        // add dom
        this.fishEditor.scrollDom.appendChild(fragment);

        // 添加滚动容器高亮样式
        this.fishEditor.scrollDom.classList.add("is-highlight");
      });
    }

    // When the monitoring value changes, we actively trigger text conversion
    this.fishEditor.on(Emitter.events.EDITOR_CHANGE, this.handleEditorChange);

    this.fishEditor.on(Emitter.events.EDITOR_BEFORE_CHANGE, this.handleEditorChange);

    // 初始化 ResizeObserver
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.fishEditor.root) {
          // 使用 offsetHeight 获取布局高度
          const height = getContentHeightWithoutPadding(this.fishEditor.root);
          this.editorMirrorDom.style.height = `${height}px`;
        }
      }
    });

    // 开始监听 fishEditor.root 的尺寸变化
    this.resizeObserver.observe(this.fishEditor.root);
  }

  /** @name Delete matching word mask node */
  private removeHighlightCoverDom() {
    // remove dom
    if (this.highlightCoverDom) {
      this.fishEditor.scrollDom.removeChild(this.highlightCoverDom);
      this.fishEditor.scrollDom.removeChild(this.editorMirrorDom);
    }

    // reset editorRootDom style
    this.fishEditor.scrollDom.classList.remove("is-highlight");
    this.fishEditor.root.style.paddingTop = "";
    this.fishEditor.root.style.paddingRight = "";
    this.fishEditor.root.style.paddingBottom = "";
    this.fishEditor.root.style.paddingLeft = "";

    // remove event
    this.fishEditor.off(Emitter.events.EDITOR_CHANGE, this.handleEditorChange);
    this.fishEditor.off(Emitter.events.EDITOR_BEFORE_CHANGE, this.handleEditorChange);

    // set null
    this.matchWordsList = null;
    this.highlightCoverDom = null;
    this.editorMirrorDom = null;

    // 停止监听 fishEditor.root 的尺寸变化
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /** @name Set matching word data */
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
  public destroy() {
    this.removeHighlightCoverDom();
  }
}

function getPlainTextFromInputEvent(event: InputEvent) {
  // When `inputType` is "insertText":
  // - `event.data` should be string (Safari uses `event.dataTransfer`).
  // - `event.dataTransfer` should be null.
  // When `inputType` is "insertReplacementText":
  // - `event.data` should be null.
  // - `event.dataTransfer` should contain "text/plain" data.

  if (typeof event.data === "string") {
    return event.data;
  }
  if (event.dataTransfer?.types.includes("text/plain")) {
    return event.dataTransfer.getData("text/plain");
  }
  return null;
}

function getContentHeightWithoutPadding(rootElement: HTMLDivElement) {
  if (!rootElement) return 0;
  // 获取元素的计算样式
  const computedStyle = window.getComputedStyle(rootElement);

  // 获取元素的 scrollHeight
  const rect = rootElement.getBoundingClientRect();
  const contentHeight = rect.height;

  // 获取上下 padding 值
  const paddingTop = parseFloat(computedStyle.paddingTop);
  const paddingBottom = parseFloat(computedStyle.paddingBottom);

  // 计算不包含 padding 的内容高度
  const height = contentHeight - paddingTop - paddingBottom;

  return height;
}

function getScrollDomPadding(scrollDom: HTMLDivElement) {
  if (!scrollDom) {
    console.error("scrollDom is not available");
    return null;
  }

  const style = window.getComputedStyle(scrollDom);
  const paddingTop = style.getPropertyValue("padding-top");
  const paddingRight = style.getPropertyValue("padding-right");
  const paddingBottom = style.getPropertyValue("padding-bottom");
  const paddingLeft = style.getPropertyValue("padding-left");

  return {
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft
  };
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
      const isFlag = matches.some((match) => match.start <= index && match.end > index);
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
