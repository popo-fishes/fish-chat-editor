/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from "lodash/throttle";
import { range as fishRange, dom } from "../utils";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";

interface InputOptions {
  /** 匹配词高亮的颜色 */
  highlightColor?: string;
  /** 需要匹配高亮词的文字数组 */
  matchWordsList?: string[];
  throttleTime?: number;
}

class Input extends Module<InputOptions> {
  static DEFAULTS: InputOptions = {
    highlightColor: "red",
    throttleTime: 300
  };
  /** @name 蒙层节点*/
  coverDom: HTMLElement;
  /** 节流 */
  emitThrottled = throttle(async () => {
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, this.options.throttleTime);
  constructor(fishEditor: FishEditor, options: Partial<InputOptions>) {
    super(fishEditor, options);
    this.handleComposition();

    // add cover-mask dom
    if (this.options.matchWordsList?.length && this.fishEditor.container) {
      this.coverDom = document.createElement("div");
      this.coverDom.classList.add("fb-cover-mask-box");
      this.fishEditor.container.classList.add("is-highlight");
      this.fishEditor.container.appendChild(this.coverDom);
      this.fishEditor.scrollDom.addEventListener("scroll", () => {
        const scrollTop = this.fishEditor.scrollDom.scrollTop;
        this.coverDom.scrollTop = scrollTop;
      });

      // 监听值变化时，我们主动触发文本转换
      this.fishEditor.on(Emitter.events.EDITOR_CHANGE, () => {
        // 包装成Promise异步执行
        Promise.resolve().then(() => {
          handleInputTransforms.call(this);
        });
      });

      this.fishEditor.on(Emitter.events.EDITOR_INPUT_CHANGE, () => {
        // 包装成Promise异步执行
        Promise.resolve().then(() => {
          handleInputTransforms.call(this);
        });
      });
    }

    fishEditor.root.addEventListener("beforeinput", (event: InputEvent) => {
      this.handleBeforeInput(event);
    });
    fishEditor.root.addEventListener("input", this.handleInput.bind(this, true));
  }
  private handleComposition() {
    this.fishEditor.on(Emitter.events.COMPOSITION_END, () => {
      this.handleInput(false);
    });
  }
  private handleInput(isOriginalEvent: boolean) {
    if (isOriginalEvent && this.options.matchWordsList?.length) {
      Promise.resolve().then(() => {
        handleInputTransforms.call(this);
      });
    }
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
 */
const handleInputTransforms = async function () {
  const content = this.fishEditor.getText();
  let strCont = content;
  const _this = this;

  this.options.matchWordsList.forEach((item: string) => {
    const reg = new RegExp("\\" + item, "g");
    // 替换
    strCont = strCont?.replace(reg, function () {
      return `<span style="color: ${_this.options.highlightColor};">${item}</span>`;
    });
  });

  const lines = strCont?.split(/\r\n|\r|\n/) || [];
  const nodes = [];
  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const dom_p = document.createElement("p");
    dom_p.innerHTML = lineContent == "" ? "<br>" : lineContent;
    nodes.push(dom_p);
  }
  dom.toTargetAddNodes(this.coverDom, nodes as any[]);
  return true;
};

export default Input;
