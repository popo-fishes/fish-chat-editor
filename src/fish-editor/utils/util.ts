/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { isNode } from ".";

const { isNodeNotTtxt, isImageNode, isEmojiImgNode, isEditInline, isEditElement } = isNode;

/**
 * @name 传入一个节点--获取行属性节点，如果没有，最多找5级父节点
 * @returns 如果是行属性节点就返回，不是就返回空
 */
export const getNodeOfEditorElementNode = (node: any, level = 0): HTMLElement | null => {
  if (!node || level >= 5) {
    return null;
  }

  if (isEditElement(node)) return node;

  return getNodeOfEditorElementNode(node.parentNode, level + 1);
};

/**
 * @name 传入一个节点--获取内联块属性节点，如果没有，最多找3级父节点
 * @returns 如果是内联块属性节点就返回，不是就返回空
 */
export const getNodeOfEditorInlineNode = (node: any, level = 0): HTMLElement | null => {
  if (!node || !node?.parentNode || level >= 3) {
    return null; // 如果节点没有父节点，则返回 null
  }

  if (isEditInline(node)) return node;

  return getNodeOfEditorInlineNode(node.parentNode, level + 1);
};

/**
 * @name 传入一个节点--获取表情属性节点，如果没有，最多找3级父节点
 * @returns 如果是表情属性节点就返回，不是就返回空
 */
export const getNodeOfEditorEmojiNode = (node: any, level = 0): HTMLElement | null => {
  if (!node || level >= 3) {
    return null;
  }

  if (isEmojiImgNode(node) && isEditInline(node)) return node;

  return getNodeOfEditorEmojiNode(node.parentNode, level + 1);
};

/**
 * @name 传入一个节点--获取图片属性节点，如果没有，最多找3级父节点
 * @returns 如果是图片属性节点就返回，不是就返回空
 */
export const getNodeOfEditorImageNode = (node: any, level = 0): HTMLElement | null => {
  if (!node || level >= 3) {
    return null;
  }

  if (isImageNode(node) && isEditInline(node)) return node;

  return getNodeOfEditorImageNode(node.parentNode, level + 1);
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
