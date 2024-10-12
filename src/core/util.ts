/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */

import { helper, base, isNode } from ".";

const { getElementAttributeKey, prefixNmae } = base;

const { isNodeNotTtxt, isImgNode, isEditElement, isFishInline, isEditTextNode } = isNode;

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
 * @deprecated 废弃-改用deleteTextNodeOfBrNode
 */
export const judgeEditRowNotNull = (node: HTMLElement): boolean => {
  if (!isEditElement(node)) return false;
  if (!isEditTextNode(node)) return false;
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
 * @name 传入一个节点--获取它的编辑器文本属性节点，如果没有，找它的父级节点
 * @returns 如果是文本节点就返回，不是就返回空
 */
export const getNodeOfEditorTextNode = (node: any): HTMLElement | null => {
  if (!node) {
    return null;
  }

  if (isEditTextNode(node)) return node;

  if (isEditTextNode(node?.parentNode)) return node.parentNode;

  return null;
};

/**
 * !!! 重要
 * @name 传入一个节点--获取它的编辑器---行属性节点，如果没有，一直找父节点查询
 * @returns 找到了编辑节点块就返回，没找到就返回空
 */
export const getNodeOfEditorRowNode = (node: any): HTMLElement | null => {
  // 如果节点没有父节点，则返回 null
  if (!node || !node?.parentNode) {
    return null;
  }
  // 1： 是一个节点块， 2： 不是一个内联块属性节点
  if (isEditElement(node) && !isFishInline(node)) return node;

  // 否则继续查询父节点的父节点
  return getNodeOfEditorRowNode(node.parentNode);
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
 * @name 判断节点下面是否存在文本节点，如果没有，一直找子节点
 * @returns boolean
 */
export const findNodeWithTextNode = (node: any): boolean => {
  if (!node) {
    return false;
  }

  if (isEditTextNode(node)) return true;

  // 否则继续查询子节点
  return findNodeWithTextNode(node?.firstChild || null);
};

/** @name 判断节点是否内联元素节点，，如果不是，一直找父节点 */
export const findNodeWithInline = (node: any) => {
  if (!node || !node?.parentNode) {
    return null; // 如果节点没有父节点，则返回 null
  }

  if (isFishInline(node)) return node;

  return findNodeWithInline(node.parentNode); // 否则继续查询父节点的父节点
};

/**
 *  @name 传入一个编辑行节点块--获取下面的第一个编辑器文本属性节点
 */
export const getElementBelowTextNode = (node: HTMLElement): HTMLElement | null => {
  // 1： 如果不是一个节点块，直接返回。 2： 是一个内联块属性节点，直接返回
  if (!isEditElement(node) && isFishInline(node)) return null;
  const nodes: any = Array.from(node.childNodes);
  if (!nodes || !nodes?.length) return null;
  let dom: HTMLElement = null;
  for (const cld of nodes) {
    if (isEditTextNode(cld)) {
      dom = cld;
      break;
    }
  }
  return dom;
};

/**
 *  重写编辑器原生自动生成的标签，因为它是一个胚子
 *  @name 传入节点--如果它不是一个文本节点，就把它的全部属性删除了，更新它的属性。
 *  @desc: 1.以此满足富文本的标签格式。
 */
export const rewriteEmbryoTextNode = (node: any) => {
  if (!node) return;
  const isTextNode = getNodeOfEditorTextNode(node);
  // !! 如果它不是一个文本节点 且 不是一个span标签 直接返回
  if (!isTextNode && node.nodeName !== "SPAN") return;
  // 重写
  node.removeAttribute("style");
  const id = `${prefixNmae}element-` + helper.getRandomWord();
  const elementAttribute = getElementAttributeKey("fishNode");
  node.setAttribute(elementAttribute, "text");
  node.id = id;
  return node;
};

/**
 * @name 传入一个编辑器文本节点，获取它的子节点集合，判断存在空text标签，就删除text标签
 */
export const deleteTextNodeOfEmptyNode = (node: HTMLElement): boolean => {
  if (!isEditTextNode(node)) return false;
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
 * @name 传入一个编辑器文本节点，获取它的子节点集合，判断存在br标签，就删除br标签
 *  */
export const deleteTextNodeOfBrNode = (node: HTMLElement): boolean => {
  if (!isEditTextNode(node)) return false;
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
