import { base, dom, util, type IRange } from ".";

function getNodeIndex(node) {
  if (!node.parentNode) return -1;
  return Array.from(node.parentNode.childNodes).indexOf(node);
}

/**
 * @name 分割编辑器--文本节点
 * @returns 返回分割节点在数组中的索引
 */
export const splitEditTextNode = (range: IRange): { target: HTMLElement | null; parentNode: HTMLElement | null; startOffset: number | null } => {
  // 必须是一个可编辑的文本块节点
  const targetElementNode = util.getNodeOfEditorTextNode(range.startContainer);
  if (!targetElementNode) {
    return {
      target: null,
      parentNode: null,
      startOffset: null
    };
  }
  // 获取光标位置的元素节点 前面的节点 和 后面的节点
  const [_, nextNodeList] = dom.getRangeAroundNode(range);
  // console.log(targetElementNode, nextNodeList);
  const cNodes = dom.cloneNodes(nextNodeList);

  // 如果之前存在节点，就创建一个编辑器文本块节点包起来
  if (cNodes.length) {
    const nodeName = (targetElementNode.nodeName || "").toLowerCase();
    let container: HTMLElement | null = null;
    if (nodeName == "span") {
      const container = base.createChunkTextElement("span");
      // 原始编辑节点是否存在样式
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
    // 删除分割节点的前面节点
    dom.removeNodes(nextNodeList);
  }

  const startOffset = getNodeIndex(targetElementNode);

  return {
    target: targetElementNode,
    parentNode: targetElementNode.parentNode as HTMLElement,
    startOffset: startOffset > -1 ? startOffset + 1 : null
  };
};
