/*
 * @Date: 2024-10-19 13:10:56
 * @Description: Modify here please
 */
import type { IEditorElement } from "../../types";
import { isNode, range } from "../../core";
/**
 * @name 修正光标的位置，把当前光标设置在最后一个编辑行节点下面的最后子节点
 */
export const amendRangePosition = (editNode: IEditorElement, callBack?: (node?: HTMLElement) => void) => {
  if (!editNode || !editNode.childNodes) return callBack?.();

  let lastElement = editNode.childNodes[editNode.childNodes.length - 1];

  if (!lastElement) {
    console.warn("富文本不存在节点，请排查问题");
    return;
  }
  // 是一个节点块
  if (isNode.isEditElement(lastElement as HTMLElement)) {
    const referenceElement = lastElement.lastChild;
    if (referenceElement) {
      range.setCursorPosition(referenceElement, "before");
      callBack?.(referenceElement as HTMLElement);
      return;
    }
  }
  console.warn("富文本不存在节点，请排查问题");
};

/** 获取当前编辑器中有多少个图片文件（不包含表情） */
export const getEditImageAmount = (node: IEditorElement): number => {
  let amount = 0;
  if (isNode.isDOMElement(node)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      amount += getEditImageAmount((node as any).childNodes[i]);
    }

    if (isNode.isEditInline(node) && isNode.isImageNode(node)) {
      amount += 1;
    }
  }
  return amount;
};
