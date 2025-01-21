import throttle from "lodash/throttle";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";
import { range as fishRange, split, util, dom, base, isNode, formats } from "../utils";

class Keyboard extends Module {
  isLineFeedLock = false;
  /** throttle */
  emitThrottled = throttle(() => {
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, 300);
  constructor(fishEditor: FishEditor, options: Record<string, never>) {
    super(fishEditor, options);
    this.listen();
  }
  listen() {
    this.fishEditor.root.addEventListener("keydown", (evt: KeyboardEvent) => {
      if (evt.defaultPrevented || evt.isComposing) return;
      const keyCode = evt.keyCode;
      const rangeInfo = fishRange.getRange();

      if (evt.ctrlKey && keyCode === 13) {
        evt.preventDefault();
        evt.stopPropagation();

        if (this.isLineFeedLock) return;

        this.isLineFeedLock = true;

        handleLineFeed.call(this, (success) => {
          if (success) {
            Promise.resolve().then(() => {
              this.fishEditor.emit(Emitter.events.EDITOR_INPUT_CHANGE);
              this.emitThrottled();
            });
          }
          this.isLineFeedLock = false;
        });
        return;
      }

      if (keyCode === 13) {
        evt.preventDefault();
        evt.stopPropagation();
        this.fishEditor.emit(Emitter.events.EDITOR_ENTER_DOWN, this.fishEditor);
        return;
      }

      /**
       *Problem 1: When dealing with the ctrl+a event, if there is no content, the br node of the selected row cannot be selected
       * bug2:
       *Press the delete button: If the editor is already an empty node, block the delete button. Otherwise, the empty text nodes will be deleted, leading to bugs
       *Bottom treatment to prevent rough handling
       */
      if ((evt.ctrlKey && evt.key == "a") || evt.keyCode === 8) {
        const editor = this.fishEditor.editor;
        if (!fishRange.isSelected() && editor?.isEditorEmptyNode()) {
          event.preventDefault();
          return;
        }
      }

      /**
       * bug3:
       *Cannot input in non editing line nodes. This situation occurs when there is only one image node left in the line editing, and then deleting it will result in the row node being deleted as well.
       *Bottom treatment to prevent rough handling
       */
      if (rangeInfo && rangeInfo.startContainer) {
        const elementRowNode = util.getNodeOfEditorElementNode(rangeInfo.startContainer);
        if (!elementRowNode) {
          event.preventDefault();
          return;
        }
      }
    });
    this.fishEditor.root.addEventListener("keyup", transformsEditNodes.bind(this));
  }
}

/** @name line feed */
function handleLineFeed(callBack: (success: boolean) => void) {
  let rangeInfo = fishRange.getRange();

  if (!rangeInfo) return callBack(false);

  const rowElementNode = util.getNodeOfEditorElementNode(rangeInfo.startContainer);

  if (!rowElementNode) {
    this.fishEditor.editor.setCursorEditorLast((node) => {
      if (node) {
        handleLineFeed(callBack);
      }
    });
    return callBack(false);
  }

  const lineDom = base.createLineElement(true);

  if (!isNode.isEditElement(rowElementNode as HTMLElement)) {
    console.warn("No editing line node, cannot be inserted");
    return callBack(false);
  }

  if (util.getNodeOfEditorTextNode(rangeInfo.startContainer)) {
    const result = split.splitEditTextNode(rangeInfo);
    rangeInfo.startContainer = result.parentNode;
    rangeInfo.anchorNode = result.parentNode;
    rangeInfo.startOffset = result.startOffset;
  }

  const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(rangeInfo);
  // console.log(behindNodeList, nextNodeList);

  const clNodes = dom.cloneNodes(nextNodeList);

  if (clNodes.length) {
    dom.toTargetAddNodes(lineDom, clNodes, false);

    dom.removeNodes(nextNodeList);
  } else {
    const br = document.createElement("br");
    dom.toTargetAddNodes(lineDom, [br]);
  }

  if (behindNodeList.length == 0 && nextNodeList.length) {
    const br = document.createElement("br");
    dom.toTargetAddNodes(rowElementNode, [br]);
  }

  dom.toTargetAfterInsertNodes(rowElementNode, [lineDom]);

  if (isNode.isDOMNode(lineDom.firstChild)) {
    fishRange.setCursorPosition(lineDom.firstChild, "before");
    lineDom?.scrollIntoView({ block: "end", inline: "end" });

    callBack(true);
    return;
  }

  callBack(false);
}

function transformsEditNodes() {
  const editNode = (this as Keyboard).fishEditor.root;

  const rangeInfo = fishRange.getRange();

  if (rangeInfo && rangeInfo?.startContainer) {
    const editorRowNode = util.getNodeOfEditorElementNode(rangeInfo.startContainer);
    if (editorRowNode) {
      const nodes: any[] = Array.from(editorRowNode.childNodes);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as any;
        // 1. If it is a span tag but does not belong to the editor text block, format it
        if (node.nodeName == "SPAN" && !isNode.isEditTextNode(node)) {
          const formatNode = formats.createNodeOptimize(node);
          if (formatNode) {
            node.parentNode?.replaceChild(formatNode, node);
          }
        }

        if (node.style && node.style?.backgroundColor) {
          node.style.removeProperty("background-color");
        }

        if (node.nodeName === "BR" && nodes.length > 1) {
          node.remove();
        }
      }
    }
  }

  if (!isNode.isEditElement(editNode.firstChild as any)) {
    const lineDom = base.createLineElement();
    dom.toTargetAddNodes(editNode as any, [lineDom]);
    if (lineDom.firstChild) {
      fishRange.setCursorPosition(lineDom.firstChild, "before");
    }
  }

  if (rangeInfo && rangeInfo?.startContainer) {
    if (!util.getNodeOfEditorElementNode(rangeInfo.startContainer as any)) {
      if (editNode.childNodes?.length > 1) {
        const nodes: any[] = Array.from(editNode.childNodes);
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as any;

          if (!isNode.isEditElement(node) && node.nodeName !== "BR") {
            node?.remove();
          }
          if (node.nodeName == "BR") {
            const lineDom = base.createLineElement();
            node.parentNode?.replaceChild(lineDom, node);
            const targetRowNode = editNode.childNodes[rangeInfo.startOffset];
            if (targetRowNode?.firstChild) {
              fishRange.setCursorPosition(targetRowNode.firstChild, "before");
            }
          }
        }
      }
    }
  }
}

export default Keyboard;
