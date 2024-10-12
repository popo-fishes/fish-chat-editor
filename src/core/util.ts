/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: dom操作
 */

import { helper, base, isNode, dom } from ".";

import type { IEditorElement } from "../types";

const { getElementAttributeKey, getElementAttributeDatasetName, prefixNmae } = base;

const { isDOMText, isNodeNotTtxt, isImgNode, isEditElement, isFishInline, isEditTextNode, isDOMElement } = isNode;

/** @name 判断节点是否富文本元素节点，如果不是找它的父节点再查下去 */
export const findNodetWithElement = (node: any) => {
  if (!node || !node?.parentNode) {
    return null; // 如果节点没有父节点，则返回 null
  }

  if (isEditElement(node)) return node;

  return findNodetWithElement(node.parentNode); // 否则继续查询父节点的父节点
};

/** @name 判断节点是否图片元素节点，如果不是找它的子节点再查下去 */
export const findNodeWithImg = (node: any) => {
  if (!node) {
    return null;
  }

  if (isImgNode(node)) return node;

  return findNodeWithImg(node?.firstChild || null); // 否则继续查询子节点
};

/** @name 判断节点下面是否存在文本节点 */
export const findNodeExistTextNode = (node: any) => {
  if (!node) {
    return null;
  }

  if (isEditTextNode(node)) return node;

  return findNodeExistTextNode(node?.firstChild || null); // 否则继续查询子节点
};

/**
 * @name 判断传入的节点：是否为文本节点，或者它的父级节点是否为文本节点
 * @returns 如果传入节点是文本节点就返回，不是就返回空
 */
export const findNodeOrParentExistTextNode = (node: any) => {
  if (!node) {
    return null;
  }

  if (isEditTextNode(node)) return node;

  if (isEditTextNode(node?.parentNode)) return node.parentNode;

  return null;
};

/** @name 判断节点是否内联元素节点，如果不是找它的父节点再查下去 */
export const findNodeWithInline = (node: any) => {
  if (!node || !node?.parentNode) {
    return null; // 如果节点没有父节点，则返回 null
  }

  if (isFishInline(node)) return node;

  return findNodeWithInline(node.parentNode); // 否则继续查询父节点的父节点
};

/** @name 复制富文本节点的文本值 */
export const getPlainText = (domNode: any) => {
  let text = "";

  if (isDOMText(domNode) && domNode.nodeValue) {
    return domNode.nodeValue;
  }

  if (isDOMElement(domNode)) {
    for (const childNode of Array.from(domNode.childNodes)) {
      text += getPlainText(childNode as Element);
    }

    const display = getComputedStyle(domNode).getPropertyValue("display");

    const emojiNodeAttrKey = getElementAttributeKey("emojiNode");
    const emojiNodeAttrName = getElementAttributeDatasetName("emojiNode");
    // 是否是一个表情图片,如果是取出
    const isEmojiVal = domNode?.dataset?.[emojiNodeAttrName] || "";
    const isEmojiNode = domNode.nodeName == "IMG" && domNode.hasAttribute(emojiNodeAttrKey);

    if (isEmojiNode && isEmojiVal) {
      text += isEmojiVal;
    }

    if (display === "block" && domNode.nodeName !== "IMG") {
      text += "\n";
    }
  }

  return text;
};

/** @name 获取一个节点的内容 */
export const getNodeContent = (node: any): string => {
  let content = "";

  if (isDOMText(node)) {
    content += node.textContent;
  }
  if (isDOMElement(node)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      content += getNodeContent(node.childNodes[i]);
    }

    const emojiNodeAttrKey = getElementAttributeKey("emojiNode");
    const emojiNodeAttrName = getElementAttributeDatasetName("emojiNode");
    // 是否是一个表情图片,如果是取出
    const isEmojiVal = node?.dataset?.[emojiNodeAttrName] || "";
    const isEmojiNode = node.nodeName == "IMG" && node.hasAttribute(emojiNodeAttrKey);

    if (isEmojiNode && isEmojiVal) {
      content += isEmojiVal;
    }
  }

  return content;
};

/**
 * @name 把符文本dom转成一个数组值
 */
export const handleEditNodeTransformsValue = (editNode: IEditorElement): string[] => {
  const result: string[] = [];
  if (!editNode || !editNode?.childNodes) return [];
  const nodes: any = Array.from(dom.cloneNodes((editNode as any).childNodes));
  for (const cld of Array.from(nodes)) {
    const content = getNodeContent(cld as Element);
    result.push(content);
  }
  return result;
};

/** @name 判断文本节点是否存在多个节点，且存在br标签，就删除br标签 */
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
 *  @name 传入一个编辑节点块--获取下面的第一个文本节点
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
 * @name 传入一个节点--获取它的编辑节点块，找它的父节点再找下去
 * @returns 找到了编辑节点块就返回，没找到就返回空
 */
export const getNodeParentElement = (node: any) => {
  // 如果节点没有父节点，则返回 null
  if (!node || !node?.parentNode) {
    return null;
  }
  // 1： 是一个节点块， 2： 不是一个内联块属性节点
  if (isEditElement(node) && !isFishInline(node)) return node;

  return getNodeParentElement(node.parentNode); // 否则继续查询父节点的父节点
};

/**
 *  复写编辑器原生自动生成的标签
 *  @name 传入节点--如果它不是一个文本节点，就把它的全部属性删除了，更新它的属性。
 *  @desc: 1.以此满足富文本的标签格式。
 */
export const duplicateTextNode = (node: any) => {
  if (!node) return;
  const isTextNode = findNodeOrParentExistTextNode(node);
  // 如果它不是一个文本节点 且 是一个span标签
  if (!isTextNode && node.nodeName !== "SPAN") return;
  node.removeAttribute("style");
  const id = `${prefixNmae}element-` + helper.getRandomWord(4);
  const elementAttribute = getElementAttributeKey("fishNode");
  node.setAttribute(elementAttribute, "text");
  node.id = id;
  return node;
};

/** @name 传入一个编辑器文本节点，获取它的子节点集合，判断存在空text标签，就删除text标签 */
export const deleteTextNodeAndEmpty = (node: HTMLElement): boolean => {
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

/** @name 传入一个编辑器文本节点，获取它的子节点集合，判断存在br标签，就删除br标签 */
export const deleteTextNodeAndBrNode = (node: HTMLElement): boolean => {
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
