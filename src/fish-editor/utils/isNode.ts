/*
 * @Date: 2024-10-09 09:43:04
 * @Description: Modify here please
 */
import { base } from ".";

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
 * @name 判断节点是否一个编辑器--行块属性节点：element
 */
export const isEditElement = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node)) return false;
  const key = base.getElementAttributeKey("fishNode");
  const attrName = base.getElementAttributeDatasetName("fishNode");
  const hasAttr = node.hasAttribute(key);
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[attrName] || "";
    if (elementAttrVal == "element") {
      return true;
    }
    return false;
  }
  return false;
};

/**
 * @name 判断节点是否一个编辑器--文本块属性节点：text
 */
export const isEditTextNode = (node: HTMLElement): boolean => {
  if (!node) return false;
  if (!isDOMElement(node)) return false;
  const key = base.getElementAttributeKey("fishNode");
  const attrName = base.getElementAttributeDatasetName("fishNode");
  const hasAttr = node.hasAttribute(key);
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[attrName] || "";
    if (elementAttrVal == "text") {
      return true;
    }
    return false;
  }
  return false;
};

/** @name 判断是否为一个图片属性节点，不包含表情图 */
export const isImageNode = (node: HTMLElement): boolean => {
  if (!node || !isDOMElement(node)) return false;
  const key = base.getElementAttributeKey("imageNode");
  const attrName = base.getElementAttributeDatasetName("imageNode");
  const hasAttr = node.hasAttribute(key);
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[attrName] || "";
    if (elementAttrVal == "true") {
      return true;
    }
    return false;
  }
  return false;
};

/** @name 判断是否为一个表情图节点 */
export const isEmojiImgNode = (node: HTMLElement): boolean => {
  if (!node || !isDOMElement(node)) return false;
  const key = base.getElementAttributeKey("emojiNode");
  const attrName = base.getElementAttributeDatasetName("emojiNode");
  const hasAttr = node.hasAttribute(key);
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[attrName] || "";
    if (elementAttrVal) return true;
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

/** @name 判断一个节点是零宽度文本节点 */
export const isNodeZeroSpace = (node: HTMLElement): boolean => {
  if (isDOMText(node)) {
    const tranText = node.nodeValue.replace(new RegExp(base.zeroWidthNoBreakSpace, "g"), "");
    if (tranText == "") {
      return true;
    }
  }
  return false;
};
