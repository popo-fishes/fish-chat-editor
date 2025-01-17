/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from "lodash/throttle";
import { range as fishRange, transforms, util, dom, base, isNode } from "../utils";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";

class Input extends Module {
  emitThrottled = throttle(() => {
    // 300 毫秒的节流间隔，可以根据需要调整
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, 300);
  constructor(fishEditor: FishEditor, options: Record<string, never>) {
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

export default Input;
