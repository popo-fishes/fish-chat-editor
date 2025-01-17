import { base, dom, util, type IRange } from ".";

function getNodeIndex(node) {
  if (!node.parentNode) return -1;
  return Array.from(node.parentNode.childNodes).indexOf(node);
}

/**
 * @name 分割内联块节点
 * @returns 返回分割节点在数组中的索引
 */
export const splitInlineNode = (range: IRange): { target: HTMLElement | null; parentNode: HTMLElement | null; startOffset: number | null } => {
  const targetElementNode = util.getNodeOfEditorInlineNode(range.startContainer);
  if (!targetElementNode) {
    return {
      target: null,
      parentNode: null,
      startOffset: null
    };
  }

  // 获取光标位置的元素节点 前面的节点 和 后面的节点
  const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(range);

  // 如果之前存在节点，就创建一个内联节点包起来
  if (nextNodeList.length) {
    const cNodes = dom.cloneNodes(nextNodeList);
    const domSpan = base.createInlineChunkElement();
    if (targetElementNode.style.color) {
      domSpan.style.color = targetElementNode.style.color;
    }
    dom.toTargetAddNodes(domSpan, cNodes);
    dom.toTargetAfterInsertNodes(targetElementNode, [domSpan]);
    dom.removeNodes(nextNodeList);
  }
  const startOffset = getNodeIndex(targetElementNode);

  return {
    target: targetElementNode,
    parentNode: targetElementNode.parentNode as HTMLElement,
    startOffset: startOffset > -1 ? startOffset + 1 : null
  };
};
