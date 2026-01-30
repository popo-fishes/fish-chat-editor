/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { isNode } from ".";

const { isNodeNotTtxt, isImageNode, isEmojiImgNode, isEditTextNode, isEditElement } = isNode;

/**
 * @name Pass in a node - get editor line - attribute node, if not, find up to 5 levels of parent nodes
 */
export const getNodeOfEditorElementNode = (node: any, level = 0): HTMLElement | null => {
  if (!node || level >= 5) {
    return null;
  }

  if (isEditElement(node)) return node;

  return getNodeOfEditorElementNode(node.parentNode, level + 1);
};

export const getNodeOfEditorTextNode = (node: any, level = 0): HTMLElement | null => {
  if (!node || !node?.parentNode || level >= 2) {
    return null;
  }

  if (isEditTextNode(node)) return node;

  return getNodeOfEditorTextNode(node.parentNode, level + 1);
};

export const getNodeOfEditorEmojiNode = (node: any, level = 0): HTMLElement | null => {
  if (!node || level >= 3) {
    return null;
  }

  if (isEmojiImgNode(node)) return node;

  return getNodeOfEditorEmojiNode(node.parentNode, level + 1);
};

export const getNodeOfEditorImageNode = (node: any, level = 0): HTMLElement | null => {
  if (!node || level >= 3) {
    return null;
  }

  if (isImageNode(node)) return node;

  return getNodeOfEditorImageNode(node.parentNode, level + 1);
};

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
