/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */

import { isNode } from ".";

const { isNodeNotTtxt, isImgNode, isEditElement } = isNode;

/**
 * @name 判断节点是否富文本元素节点，如果不是找它的父节点再查下去
 * @deprecated 废弃-不会使用了
 */
export const findNodetWithElement = (node: any) => {
  if (!node || !node?.parentNode) {
    return null; // 如果节点没有父节点，则返回 null
  }

  if (isEditElement(node)) return node;

  return findNodetWithElement(node.parentNode); // 否则继续查询父节点的父节点
};

/**
 *  @name 判断文本节点是否存在多个节点，且存在br标签，就删除br标签
 * @deprecated 废弃-改用deleteTargetNodeOfBrNode
 */
export const judgeEditRowNotNull = (node: HTMLElement): boolean => {
  if (!isEditElement(node)) return false;
  const nodes: any[] = Array.from(node.childNodes);
  if (!nodes || !nodes?.length) return false;

  let exist = false;
  for (const cld of nodes) {
    if ((cld as any)?.nodeName == "BR") {
      (cld as any)?.remove();
      exist = true;
      break;
    }
  }
  return exist;
};

/**
 * !!! 重要
 * @name 传入一个节点--获取它的编辑器--行属性节点，如果没有，一直找父节点
 * @returns 如果是行属性节点就返回，不是就返回空
 */
export const getNodeOfEditorElementNode = (node: any): HTMLElement | null => {
  if (!node) {
    return null;
  }

  if (isEditElement(node)) return node;

  // 否则继续查询父节点的父节点
  return getNodeOfEditorElementNode(node.parentNode);
};

/**
 * @name 判断节点是否图片元素节点，如果不是，一直找子节点
 * @returns boolean
 */
export const findNodeWithImg = (node: any): boolean => {
  if (!node) {
    return false;
  }

  if (isImgNode(node)) return true;

  // 否则继续查询子节点
  return findNodeWithImg(node?.firstChild || null);
};

/**
 * @name 传入一个编辑器-行属性节点，获取它的子节点集合，判断存在空text标签，就删除text标签
 */
export const deleteTextNodeOfEmptyNode = (node: HTMLElement): boolean => {
  if (!isEditElement(node)) return false;
  const nodes: any[] = Array.from(node.childNodes);
  if (!nodes || !nodes?.length) return false;

  let num = 0;

  for (const cld of nodes) {
    if (isNodeNotTtxt(cld)) {
      (cld as any)?.remove();
      num++;
    }
  }
  return num > 0;
};

/**
 * @name 传入一个编辑器-行属性节点，获取它的子节点集合，判断存在br标签，就删除br标签
 */
export const deleteTargetNodeOfBrNode = (node: HTMLElement): boolean => {
  if (isEditElement(node)) {
    const nodes: any[] = Array.from(node.childNodes);
    if (!nodes || !nodes?.length) return false;

    let exist = false;
    for (const cld of nodes) {
      if ((cld as any)?.nodeName == "BR") {
        (cld as any)?.remove();
        exist = true;
        break;
      }
    }
    return exist;
  }
  return false;
};
