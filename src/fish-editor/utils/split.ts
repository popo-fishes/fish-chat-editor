/*
 * @Date: 2025-02-11 09:20:06
 * @Description: Modify here please
 */
import { base, dom, util } from ".";
import type { IRange } from "../core/selection";

function getNodeIndex(node) {
  if (!node.parentNode) return -1;
  return Array.from(node.parentNode.childNodes).indexOf(node);
}

/**
 * @name Split Editor - Text Nodes
 */
export const splitEditTextNode = (range: IRange): { target: HTMLElement | null; parentNode: HTMLElement | null; startOffset: number | null } => {
  const targetElementNode = util.getNodeOfEditorTextNode(range.startContainer);
  if (!targetElementNode) {
    return {
      target: null,
      parentNode: null,
      startOffset: null
    };
  }

  const [_, nextNodeList] = dom.getRangeAroundNode(range);

  const cNodes = dom.cloneNodes(nextNodeList);

  if (cNodes.length) {
    const nodeName = (targetElementNode.nodeName || "").toLowerCase();
    let container: HTMLElement | null = null;
    if (nodeName == "span") {
      const container = base.createChunkTextElement("span");
      if (targetElementNode.style.color) {
        container.style.color = targetElementNode.style.color;
        dom.toTargetAddNodes(container, cNodes);
        dom.toTargetAfterInsertNodes(targetElementNode, [container]);
      } else {
        dom.toTargetAfterInsertNodes(targetElementNode, cNodes);
      }
    } else if (nodeName == "strong") {
      container = base.createChunkTextElement("strong");
      dom.toTargetAddNodes(container, cNodes);
      dom.toTargetAfterInsertNodes(targetElementNode, [container]);
    }
    dom.removeNodes(nextNodeList);
  }

  const startOffset = getNodeIndex(targetElementNode);

  return {
    target: targetElementNode,
    parentNode: targetElementNode.parentNode as HTMLElement,
    startOffset: startOffset > -1 ? startOffset + 1 : null
  };
};
