/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from "lodash/throttle";
import { range as fishRange, transforms, util, dom, base, isNode, helper } from "../utils";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";

interface InputOptions {
  /** 匹配词高亮的颜色 */
  highlightColor?: string;
  /** 需要匹配高亮词的文字数组 */
  matchWordsList?: string[];
}

class Input extends Module<InputOptions> {
  static DEFAULTS: InputOptions = {
    highlightColor: "red"
  };

  emitThrottled = throttle(async () => {
    if (this.options.matchWordsList?.length) {
      await handleInputTransforms.call(this);
    }
    // 300 毫秒的节流间隔，可以根据需要调整
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, 300);
  constructor(fishEditor: FishEditor, options: Partial<InputOptions>) {
    super(fishEditor, options);
    this.handleComposition();
    fishEditor.root.addEventListener("beforeinput", (event: InputEvent) => {
      this.handleBeforeInput(event);
    });
    fishEditor.root.addEventListener("input", this.handleInput.bind(this));
  }
  private handleComposition() {
    this.fishEditor.on(Emitter.events.COMPOSITION_END, () => {
      this.handleInput();
    });
  }
  private handleInput() {
    /***
     * 在谷歌浏览器，输入遇见编辑器先清除焦点然后调用focus方法，重新修正光标的位置，会导致，下次输入中文时 onCompositionEnd事件不会触发，导致
     * isLock变量状态有问题，这里先注释掉，不判断了，直接变化值，就去暴露值
     */
    if (this.fishEditor.composition.isComposing) return;
    this.emitThrottled();
  }
  private handleBeforeInput(event: InputEvent) {
    const rangeInfo = fishRange.getRange();
    // console.log(event, rangeInfo);
  }
}

/**
 * @name 文字转换
 * todo 限制频次
 */
const handleInputTransforms = async function () {
  const rangeInfo = fishRange.getRange();
  const rowElementNode: HTMLElement = util.getNodeOfEditorElementNode(rangeInfo.startContainer);
  if (!rowElementNode) return false;
  const content = this.fishEditor.getText();
  const original = transforms.getEditElementContent(rowElementNode as any);
  let strCont = content;
  const _this = this;

  this.options.matchWordsList.forEach((item: string) => {
    const reg = new RegExp("\\" + item, "g");
    // 替换
    strCont = strCont?.replace(reg, function () {
      const dom = base.createChunkTextElement("span");
      dom.style.color = _this.options.highlightColor;
      dom.innerText = item;
      return dom.outerHTML;
      // return `<span style="color: ${_this.options.highlightColor};">${item}</span>`;
    });
  });

  // console.log(original, strCont, original == strCont);
  if (original == strCont) return false;

  rowElementNode.innerHTML = strCont;

  const referenceElement = rowElementNode.childNodes[rowElementNode.childNodes.length - 1];

  if (referenceElement) {
    // console.log(referenceElement);
    fishRange.setCursorPosition(referenceElement, "after");
  }

  return true;
};

export default Input;
