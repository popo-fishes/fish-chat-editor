/*
 * @Date: 2024-10-09 09:43:04
 * @Description: Modify here please
 */
import { base, editor } from ".";
import type { IEditorElement } from "../types";

const { elementAttributeData, zeroWidthNoBreakSpace } = base;

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
export const isEmptyEditNode = (editNode: IEditorElement) => {
  if (!editNode || !editNode?.childNodes) return true;
  if (editNode?.childNodes && editNode?.childNodes.length > 1) {
    return false;
  }

  if (!editor.getText(editNode)) return true;

  return false;
};

/**
 * @name 判断节点是否一个编辑器块属性节点：element
 */
export const isEditElement = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node)) return false;
  const keys = elementAttributeData["fishNode"];
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

/** @name 判断是否为一个编辑器文本属性节点：text */
export const isEditTextNode = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node)) return false;
  const keys = elementAttributeData["fishNode"];
  const hasAttr = node.hasAttribute(keys["key"]);
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[keys["value"]] || "";
    if (elementAttrVal == "text") {
      return true;
    }
    return false;
  }
  return false;
};

/** @name 判断是否为一个图片属性节点，不包含表情图 */
export const isImgNode = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node) || node.nodeName !== "IMG") return false;
  const keys = elementAttributeData["imgNode"];
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

/** @name 判断是否为一个表情图节点 */
export const isEmojiImgNode = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node) || node.nodeName !== "IMG") return false;
  const keys = elementAttributeData["emojiNode"];
  const hasAttr = node.hasAttribute(keys["key"]);
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[keys["value"]] || "";
    if (elementAttrVal) return true;
    return false;
  }
  return false;
};

/** @name 判断是否为一个编辑器行--内联块属性节点*/
export const isFishInline = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node)) return false;
  const keys = elementAttributeData["fishInline"];
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

/** @name 判断一个节点是空文本节点 */
export const isNodeNotTtxt = (node: HTMLElement): boolean => {
  if (isDOMText(node)) {
    if (node?.nodeValue == "") {
      return true;
    }
  }
  return false;
};
