/*
 * @Date: 2024-11-04 16:34:52
 * @Description: Modify here please
 */
import Module from "../core/module";
import type FishEditor from "../core/fish-editor";

import { helper, base, dom, isNode, util, range, transforms } from "../utils";

class OtherEvent extends Module {
  root: (typeof FishEditor)["prototype"]["root"];
  constructor(fishEditor: FishEditor, options: Record<string, never>) {
    super(fishEditor, options);
    this.root = this.fishEditor.root;
    this.setupListeners();
  }
  private setupListeners() {
    this.root.addEventListener("click", (e) => {
      e.preventDefault();
      this.onClick(e);
    });
    this.root.addEventListener("blur", this.onBlur.bind(this));

    this.root.addEventListener("drop", (e) => {
      // 禁用拖放操作, 如果拖动编辑器内的图片，会导致吧图片的地址输入到 富文本中
      e.preventDefault();
    });
    this.root.addEventListener("dragover", (e) => {
      // 禁用拖放操作, 如果拖动编辑器内的图片，会导致吧图片的地址输入到 富文本中
      e.preventDefault();
    });
    this.root.addEventListener("contextmenu", (e) => {
      // 禁止鼠标右键
      e.preventDefault();
    });
  }

  /** @name 失去焦点 */
  onBlur(e: FocusEvent) {
    const rangeInfo = range.getRange();
    // console.log(rangeInfo);
    if (rangeInfo) {
      this.fishEditor.backupRangePosition(rangeInfo.startContainer as HTMLElement, rangeInfo.startOffset);
    }
    // 如果有选中
    if (range.isSelected()) {
      // 清除选定对象的所有光标对象
      range?.removeAllRanges();
    }
  }

  /** @name 点击编辑器事件（点击时） */
  onClick(e: MouseEvent) {
    const target = e?.target as any;
    // 如果是表情节点
    const emojiNode = util.getNodeOfEditorEmojiNode(target);
    if (emojiNode) {
      // 选中它
      range.selectNode(emojiNode);
    }
    // 如果是图片节点
    const imageNode = util.getNodeOfEditorImageNode(target);
    if (imageNode) {
      // 选中它
      // range.selectNode(imageNode);
    }

    /**
     * 如果存在光标
     * 点击了编辑器后，如果光标位置节点是一个 块节点，且是一个图片节点，就把光标移动到它的前面的一个兄弟节点身上。
     * 1：要保证图片的块节点不可以输入内容
     * 2：粘贴图片时，我们会在图片节点前面插入了一个文本输入节点。
     */
    // 是一个DOM元素节点，并且存在图片节点
    // if (isDOMElement(target) && findNodeWithImg(target)) {

    //   if (pnode) {
    //     // 用户选择的文本范围或光标的位置
    //     const selection = window.getSelection();
    //     // 清除选定对象的所有光标对象
    //     selection?.removeAllRanges();

    //     const textNode = base.createChunkTextElement();

    //     pnode.insertAdjacentElement("afterend", textNode);

    //     range.setRangeNode(textNode, "after", () => {});
    //   }
    // }
  }
}

export default OtherEvent;
