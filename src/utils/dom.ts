/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: dom操作
 */

import { getElementAttributeKey, isDOMText, isDOMElement, isEditTextNode, isFishInline, isEditElement, isImgNode, getElementAttributeDatasetName } from ".";
import type { EditorElement } from "../types";

/**
 * @name 克隆节点
 * @param childNodes
 * @returns
 */
export const cloneNodes = (childNodes: HTMLElement[]) => {
  const nodes: any[] = [];
  for (let i = 0; i < childNodes.length; i++) {
    const clonedNode = childNodes[i].cloneNode(true); // 复制节点及其子节点
    nodes.push(clonedNode);
  }
  return nodes;
};

/**
 * @name 删除节点
 * @param childNodes
 */
export const removeNode = (childNodes: HTMLElement[]) => {
  // 必须用Array.from包裹下childNodes，不然导致for渲染不如预期的次数
  const nodes: HTMLElement[] = Array.from(childNodes);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node?.remove();
  }
};

/**
 * @name 给定一个节点，在节点的前面插入多个节点
 * https://developer.mozilla.org/zh-CN/docs/Web/API/Node/insertBefore
 */
export const insertBeforeNode = (targetElement: HTMLElement, childNodes: HTMLElement[]) => {
  if (!targetElement || !childNodes || !childNodes?.length) return;
  const fragment = new DocumentFragment();
  for (let i = 0; i < childNodes.length; i++) {
    fragment.appendChild(childNodes[i]);
  }
  const parentNode = targetElement.parentNode;
  // 获取插入节点的下一个兄弟节点
  const nextSibling = targetElement.nextSibling;

  /**
   * 在兄弟节点前面插入，
   * nextSibling 如果为 null，fragment 将被插入到parentNode的子节点列表末尾。
   */
  parentNode.insertBefore(fragment, nextSibling);
};

/**
 * @name 给目标节点，添加子节点
 * @param targetNode
 * @param childNodes
 * @param clear 是否需要清空内容，在添加节点
 * @returns
 */
export const addTargetElement = (targetNode: HTMLElement, childNodes: HTMLElement[], clear: boolean = true) => {
  if (targetNode) {
    if (childNodes && childNodes.length && clear) {
      targetNode.innerHTML = "";
    }
    for (let i = 0; i < childNodes.length; i++) {
      targetNode.appendChild(childNodes[i]);
    }
  }
  return targetNode;
};

/**
 * @name 获取当前节点的 前面全部兄弟节点 和后面全部兄弟节点
 * https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nextSibling
 * @param targetElement
 * @returns
 */
export const getDomPreviousOrnextSibling = (targetElement: HTMLElement) => {
  if (!targetElement) return [[], []];
  // 以前的节点
  const previousNodes: any = [];
  let currentElement = targetElement.previousSibling;
  while (currentElement) {
    if (currentElement.nodeType === Node.ELEMENT_NODE || currentElement.nodeType === Node.TEXT_NODE) {
      previousNodes.push(currentElement);
    }
    currentElement = currentElement.previousSibling;
  }
  // 之后的节点
  const nextNodes: any = [];
  currentElement = targetElement.nextSibling;
  while (currentElement) {
    if (currentElement.nodeType === Node.ELEMENT_NODE || currentElement.nodeType === Node.TEXT_NODE) {
      nextNodes.push(currentElement);
    }
    currentElement = currentElement.nextSibling;
  }
  return [previousNodes, nextNodes];
};

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
 * @name 判断当前给定的节点：是否为文本节点，或者它的父级节点是否为文本节点
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

/**
 * @name 获取当前光标位置的元素节点 前面的节点 和 后面的节点
 * 返回的数组中都是从近到远的 排序，距离当前光标节点越近的排在第一个
 * @return [behindNodeList:[], nextNodeList: []]
 */
export const getRangeAroundNode = () => {
  // 之后的节点
  let behindNodeList: any[] = [];
  // 以前的节点
  let nextNodeList: any[] = [];

  // 获取页面的选择区域
  const selection: any = window.getSelection();

  // 获取当前光标
  const range = selection?.getRangeAt(0);

  // 必须存在光标
  if ((selection && selection.rangeCount == 0) || !range) return [behindNodeList, nextNodeList];

  // Range.startContainer 是只读属性，返回 Range 开始的节点
  const rangeStartContainer: any = range.startContainer;

  const rangeNode = findNodeOrParentExistTextNode(rangeStartContainer);

  // 光标节点不是一个文本节点  直接返回
  if (!rangeNode) return [behindNodeList, nextNodeList];

  // console.log(rangeStartContainer, range);
  /** 处理节点类型 */
  if (isDOMElement(rangeStartContainer)) {
    //  只读属性返回选区开始位置所属的节点
    const anchorNode = selection.anchorNode;
    /**
     * 不能使用selection.anchorOffset，Safari 浏览器会不准确
     */
    // const anchorOffset = selection.anchorOffset;
    const anchorOffset = range.startOffset;
    /**
     * 获取当前节点的前后全部兄弟节点
     * https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nextSibling
     */
    const rangeNode = anchorNode?.childNodes?.[anchorOffset - 1] || null;
    // 直接吧全部子节点赋值
    if (anchorOffset == 0) {
      nextNodeList = anchorNode?.childNodes ? [...anchorNode?.childNodes] : [];
    } else {
      if (rangeNode) {
        /** 找出当前光标节点的前后兄弟节点 */
        const [pNode, nNode] = getDomPreviousOrnextSibling(rangeNode);
        behindNodeList = [rangeNode, ...pNode];
        nextNodeList = [...nNode];
      }
    }
    /**
     * 如果当前光标节点，不是一个Element元素，可能是一个span
     * 这种情况呢，我们需要获取当前元素前面的节点，这后面的节点
     */
    // console.log(rangeStartContainer, rangeNode, behindNodeList, nextNodeList);
    if (!isEditElement(rangeStartContainer)) {
      const [pNode, nNode] = getDomPreviousOrnextSibling(anchorNode);
      behindNodeList.push(...pNode);
      nextNodeList.push(...nNode);
    }
  }

  /** 处理文本类型 */
  if (isDOMText(rangeStartContainer)) {
    //  只读属性返回选区开始位置所属的节点
    const anchorNode = selection.anchorNode;
    /**
     * 不能使用selection.anchorOffset，Safari 浏览器会不准确
     */
    // const anchorOffset = selection.anchorOffset;
    const anchorOffset = range.startOffset;

    // 拆分文本节点
    const afterNode = anchorNode?.splitText(anchorOffset);
    /** 找出当前光标节点的前后兄弟节点 */
    const [pNode, nNode] = getDomPreviousOrnextSibling(afterNode);
    behindNodeList = [...pNode];

    /**
     * 当前文本节点后的节点，以及光标分割后的节点。
     * 这里判断分割后的文本节点是否为空值，比如在最后一个字符处换行，空值就不要放进数组里面
     */
    nextNodeList = afterNode?.nodeType == 3 && afterNode?.nodeValue ? [afterNode, ...nNode] : nNode;

    /**
     * 如果当前光标文本节点 父节点不是一个Element元素，可能是一个span
     * 这种情况呢，需要再找出父节点的前后 兄弟节点
     */
    const parentElement = rangeStartContainer.parentNode;

    if (!isEditElement(parentElement)) {
      const [pNode, nNode] = getDomPreviousOrnextSibling(parentElement);
      behindNodeList.push(...pNode);
      nextNodeList.push(...nNode);
    }
  }

  const tempPrev = behindNodeList?.filter((node: any) => node.nodeName !== "BR");
  const tempNext = nextNodeList?.filter((node: any) => node.nodeName !== "BR");

  return [tempPrev, tempNext];
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
export const handleEditNodeTransformsValue = (editNode: EditorElement): string[] => {
  const result: string[] = [];
  if (!editNode || !editNode?.childNodes) return [];
  const nodes: any = Array.from(cloneNodes((editNode as any).childNodes));
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

/** @name 判断文本节点是否存在多个节点，且存在br标签，就删除br标签 */
export const deleteTextNodeBrNode = (node: HTMLElement): boolean => {
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
 *  @name 获取传入节点块--下面的第一个文本节点
 */
export const getElementBelowTextNode = (node: HTMLElement): HTMLElement | null => {
  if (!isEditElement(node)) return null;
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
