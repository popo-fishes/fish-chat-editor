/*
 * @Date: 2024-10-12 14:24:28
 * @Description: dom
 */
import { isNode, util } from ".";

const { isDOMText, isDOMElement, isEditTextNode, isNodeNotTtxt } = isNode;
const { getNodeOfEditorTextNode } = util;

/**
 * @name 获取当前节点的 前面全部兄弟节点 和后面全部兄弟节点
 * https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nextSibling
 * @param targetElement
 * @returns [previousNodes, nextNodes]
 */
const getDomPreviousOrnextSibling = (targetElement: HTMLElement): [][] => {
  if (!targetElement) return [[], []];
  /** 之前的节点 */
  const previousNodes: any = [];
  let currentElement = targetElement.previousSibling;
  while (currentElement) {
    if (currentElement.nodeType === Node.ELEMENT_NODE || currentElement.nodeType === Node.TEXT_NODE) {
      previousNodes.push(currentElement);
    }
    currentElement = currentElement.previousSibling;
  }
  /** 之后的节点 */
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
 * @name 克隆节点集合
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
 * @name 删除节点集合
 * @param childNodes
 */
export const removeNodes = (childNodes: HTMLElement[]) => {
  // 必须用Array.from包裹下childNodes，不然导致for渲染不如预期的次数
  const nodes: HTMLElement[] = Array.from(childNodes);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node?.remove();
  }
};

/**
 * @name 传入目标节点，在目标节点之后插入多个节点
 * https://developer.mozilla.org/zh-CN/docs/Web/API/Node/insertBefore
 */
export const toTargetAfterInsertNode = (targetElement: HTMLElement, childNodes: HTMLElement[]) => {
  if (!targetElement || !childNodes || !childNodes?.length) return;
  const fragment = new DocumentFragment();
  for (let i = 0; i < childNodes.length; i++) {
    fragment.appendChild(childNodes[i]);
  }
  const parentNode = targetElement.parentNode;
  /**
   * !!! 获取插入节点的下一个兄弟节点（只有获取到下一个兄弟节点，才是代表插入到targetElement节点之后）
   */
  const nextSibling = targetElement.nextSibling;

  /**
   * 在兄弟节点前面插入，
   * nextSibling 如果为 null，fragment 将被插入到parentNode的子节点列表末尾。
   */
  parentNode.insertBefore(fragment, nextSibling);
};

/**
 * @name 给目标节点，添加子节点集合
 * @param targetNode 目标节点
 * @param childNodes 节点集合
 * @param clear 是否需要清空内容，在添加节点
 * @returns
 */
export const toTargetAddNodes = (targetNode: HTMLElement, childNodes: HTMLElement[], clear: boolean = true) => {
  if (isDOMElement(targetNode)) {
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
 * !!! 重要方法
 * @name 获取节点的前面的节点和后面的节点
 * @desc: 默认当前光标位置节点作为目标
 * @return 返回的都是真实的dom节点
 * 返回的数组中都是从近到远的 排序，距离当前光标节点越近的排在第一个
 * [behindNodeList:[], nextNodeList: []]
 */
export const getRangeAroundNode = () => {
  /** 之后的节点, 这里面的都是真实dom节点 */
  let behindNodeList: any[] = [];
  /** 以前的节点, 这里面的都是真实dom节点 */
  let nextNodeList: any[] = [];

  // 获取页面的选择区域
  const selection: any = window.getSelection();

  // 获取当前光标
  const range = selection?.getRangeAt(0);

  // 必须存在光标
  if ((selection && selection.rangeCount == 0) || !range) return [behindNodeList, nextNodeList];

  // Range.startContainer 是只读属性，返回 Range 开始的节点
  const targetNode: any = range.startContainer;

  // 目标节点的父节点
  const editTextNode = getNodeOfEditorTextNode(targetNode);

  // 不是编辑器文本节点  直接返回
  if (!editTextNode) {
    console.warn("不是一个编辑器文本属性节点");
    return [behindNodeList, nextNodeList];
  }

  /** 处理节点类型 */
  if (isDOMElement(targetNode)) {
    //  只读属性返回选区开始位置所属的节点
    const anchorNode = selection.anchorNode;
    /**
     * 不能使用selection.anchorOffset，Safari 浏览器会不准确
     */
    // const anchorOffset = selection.anchorOffset;
    const anchorOffset = range.startOffset;

    // 直接吧全部子节点赋值
    if (anchorOffset == 0) {
      nextNodeList = anchorNode?.childNodes ? [...anchorNode?.childNodes] : [];
    } else {
      /**
       * 获取当前节点的前后全部兄弟节点
       * https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nextSibling
       */
      const currentNode = anchorNode?.childNodes?.[anchorOffset - 1] || null;

      if (currentNode) {
        /** 找出当前光标节点的前后兄弟节点 */
        const [pNode, nNode] = getDomPreviousOrnextSibling(currentNode);
        behindNodeList = [currentNode, ...pNode];
        nextNodeList = [...nNode];
      }
    }
    /**
     * 如果当前光标节点是一个编辑文本节点
     * 这种情况呢，需要再找出父节点的前后 兄弟节点
     */
    // console.log(behindNodeList, nextNodeList);
    if (isEditTextNode(anchorNode)) {
      const [pNode, nNode] = getDomPreviousOrnextSibling(anchorNode);
      behindNodeList.push(...pNode);
      nextNodeList.push(...nNode);
    }
  }

  /** 处理文本类型 */
  if (isDOMText(targetNode)) {
    //  只读属性返回选区开始位置所属的节点
    const anchorNode = selection.anchorNode;
    /**
     * 不能使用selection.anchorOffset，Safari 浏览器会不准确
     */
    // const anchorOffset = selection.anchorOffset;
    const anchorOffset = range.startOffset;

    // 拆分文本节点--返回的是一个偏移量之后的文本
    const afterNode = anchorNode?.splitText(anchorOffset);
    /** 找出当前光标节点的前后兄弟节点 */
    const [pNode, nNode] = getDomPreviousOrnextSibling(afterNode);

    behindNodeList = [...pNode];

    // 添加后面的节点
    nextNodeList = [afterNode, ...nNode];

    // console.log(behindNodeList, nextNodeList, afterNode);
    /**
     * 如果当前光标节点是一个编辑文本节点
     * 这种情况呢，需要再找出父节点的前后 兄弟节点
     */
    const parentElement = targetNode.parentNode;

    if (isEditTextNode(parentElement)) {
      const [pNode, nNode] = getDomPreviousOrnextSibling(parentElement);
      behindNodeList.push(...pNode);
      nextNodeList.push(...nNode);
    }
  }

  /**
   * 1. 过滤Br节点
   * 2. 删除空text文本(这种情况就是出现在splitText方法分割后导致父节点新增的空节点)，所以需要删除
   */
  const tempPrev = behindNodeList?.filter((node: any) => {
    if (isNodeNotTtxt(node)) {
      node?.remove();
    }
    return node.nodeName !== "BR" && !isNodeNotTtxt(node);
  });
  const tempNext = nextNodeList?.filter((node: any) => {
    if (isNodeNotTtxt(node)) {
      node?.remove();
    }
    return node.nodeName !== "BR" && !isNodeNotTtxt(node);
  });

  // console.log("原始编辑器文本节点中的子节点：", editTextNode?.childNodes)
  // console.log(tempPrev, tempNext);

  return [tempPrev, tempNext];
};
