/*
 * @Date: 2024-10-19 13:10:56
 * @Description: Modify here please
 */
import type { IEditorElement } from "../../types";
import { isNode } from "../../core";

/** 获取编辑器中有多少个图片文件（不包含表情） */
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
