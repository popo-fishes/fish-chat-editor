/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: dom操作
 */

import { getElementAttributeKey, elementDataKeys, getText, getElementAttributeDatasetName } from ".";

import type { EditorElement } from "../types";

/**
 * @name 返回DOM节点的主机窗口
 */
export const getDefaultView = (value: any): Window | null => {
  return (value && value.ownerDocument && value.ownerDocument.defaultView) || null;
};

/** @name 检查一个值是否为DOM节点。 */
export const isDOMNode = (value: any) => {
  const window = getDefaultView(value);
  return !!window && value;
};

/** @name 检查一个值是否为元素节点。 */
export const isDOMElement = (value: any) => {
  return isDOMNode(value) && value.nodeType === 1;
};

/** @name 检查DOM节点是否为文本节点。 */
export const isDOMText = (value: any) => {
  return isDOMNode(value) && value.nodeType === 3;
};

/**
 * @name 给一个节点元素，添加子节点
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
  const nodes: HTMLElement[] = Array.from(cloneNodes(childNodes));
  const fragment = new DocumentFragment();
  for (let i = 0; i < nodes.length; i++) {
    fragment.appendChild(nodes[i]);
  }
  const parentNode = targetElement.parentNode;
  const nextSibling = targetElement.nextSibling;

  parentNode.insertBefore(fragment, nextSibling);
};

/**
 * @name 获取节点在全部子节点下面的位置
 */
export const getNodeIndex = (nodes: HTMLElement[], child: HTMLElement) => {
  let position = 0;
  for (let i = 0; i < nodes.length; i++) {
    position++;
    if (nodes[i] === child) {
      break;
    }
  }
  return position;
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

/**
 * @name 判断是否存在元素节点，或者是否文本节点不为空字符串
 * @returns boolean
 */
export const judgeDomOrNotTtxt = (nodes: HTMLElement[]): boolean => {
  if (!nodes || !nodes.length) return false;
  let isFlag = false;
  const tempNode = nodes.filter((item: any) => item?.nodeType);
  for (let i = 0; i < tempNode.length; i++) {
    const currentElement = tempNode[i];
    // 如果是文本节点,存在值
    if (isDOMText(currentElement) && currentElement.nodeValue) {
      isFlag = true;
      break;
    }
    if (isDOMElement(currentElement)) {
      isFlag = true;
      break;
    }
  }
  return isFlag;
};

/**
 * @name 当前编辑器是否只有一个节点，且节点是一个空节点
 * @returns boolean
 */
export const isEmptyEditNode = (editNode: EditorElement) => {
  if (!editNode || !editNode?.childNodes) return true;
  if (editNode?.childNodes && editNode?.childNodes.length > 1) {
    return false;
  }

  if (!getText(editNode)) return true;

  return false;
};

/**
 * @name 判断节点是不是一个富文本元素节点：element
 */
export const isEditElement = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node)) return false;
  const keys = elementDataKeys["editorNode"];
  const hasAttr = node.hasAttribute(keys["key"]);
  if (hasAttr) {
    const isValElement = node?.dataset?.[keys["value"]] || "";
    if (isValElement == "element") {
      return true;
    }
    return false;
  }
  return false;
};

/** @name 判断节点是不是一个富文本元素节点：element，如果不是找它的父级节点再查下去 */
export const findParentWithAttribute = (node: any) => {
  if (!node || !node?.parentNode) {
    return null; // 如果节点没有父节点，则返回 null
  }

  if (isEditElement(node)) return node;

  return findParentWithAttribute(node.parentNode); // 否则继续查询父节点的父节点
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

  const topElementNode = findParentWithAttribute(rangeStartContainer);

  // 如果当前节点的最顶级节点不是一个富文本内容节点：element  直接返回
  if (!topElementNode) return [behindNodeList, nextNodeList];

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

/** @name 判断富文本行节点是否 不是一个空节点，如果不是空节点，就删除它子节点的br标签 */
export const judgeEditRowNotNull = (node: HTMLElement): boolean => {
  if (!isEditElement(node)) return false;
  if (!getNodeContent(node)) return false;
  const nodes: any = Array.from(node.childNodes);
  if (!nodes || !nodes?.length) return false;
  for (const cld of nodes) {
    if ((cld as any)?.nodeName == "BR") {
      (cld as any)?.remove();
    }
  }
  return true;
};
