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
      // Disable drag and drop operations. Dragging images in the editor will cause the image's address to be entered into rich text
      e.preventDefault();
    });
    this.root.addEventListener("dragover", (e) => {
      // Disable drag and drop operations. Dragging images in the editor will cause the image's address to be entered into rich text
      e.preventDefault();
    });
    this.root.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  onBlur(e: FocusEvent) {
    const rangeInfo = range.getRange();
    // console.log(rangeInfo);
    if (rangeInfo) {
      this.fishEditor.backupRangePosition(rangeInfo.startContainer as HTMLElement, rangeInfo.startOffset);
    }
    if (range.isSelected()) {
      range?.removeAllRanges();
    }
  }

  onClick(e: MouseEvent) {
    const target = e?.target as any;
    const emojiNode = util.getNodeOfEditorEmojiNode(target);
    if (emojiNode) {
      range.selectNode(emojiNode);
    }
    const imageNode = util.getNodeOfEditorImageNode(target);
    if (imageNode) {
      // range.selectNode(imageNode);
    }

    /**
     *If there is a cursor present
     *After clicking on the editor, if the cursor position node is a block node and an image node, move the cursor to its preceding sibling node.
     *1: It is necessary to ensure that the block nodes of the image cannot input content
     *When pasting images, we will insert a text input node in front of the image node.
     */

    // if (isDOMElement(target) && findNodeWithImg(target)) {

    //   if (pnode) {

    //     const selection = window.getSelection();

    //     selection?.removeAllRanges();

    //     const textNode = base.createChunkTextElement();

    //     pnode.insertAdjacentElement("afterend", textNode);

    //     range.setRangeNode(textNode, "after", () => {});
    //   }
    // }
  }
}

export default OtherEvent;
