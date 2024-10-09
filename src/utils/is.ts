/*
 * @Date: 2024-10-09 09:43:04
 * @Description: Modify here please
 */
import { elementDataKeys, getText } from ".";
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
    const elementAttrVal = node?.dataset?.[keys["value"]] || "";
    if (elementAttrVal == "element") {
      return true;
    }
    return false;
  }
  return false;
};

/** @name 判断是否为一个图片节点，不包含表情图 */
export const isImgNode = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node)) return false;
  const keys = elementDataKeys["imgNode"];
  const hasAttr = node.hasAttribute(keys["key"]);
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[keys["value"]] || "";
    if (elementAttrVal == "true") {
      return true;
    }
    return false;
  }
  return false;
};

/** @name 判断是否为一个图片节点，不包含表情图 */
export const isInlineNode = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node)) return false;
  const keys = elementDataKeys["inlineNode"];
  const hasAttr = node.hasAttribute(keys["key"]);
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[keys["value"]] || "";
    if (elementAttrVal == "true") {
      return true;
    }
    return false;
  }
  return false;
};

/**
 * @name 判断是否存在元素节点，或者是否文本节点不为空字符串
 * @returns boolean
 */
export const isDomOrNotTtxt = (nodes: HTMLElement[]): boolean => {
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
