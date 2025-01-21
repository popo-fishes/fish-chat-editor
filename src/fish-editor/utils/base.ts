/*
 * @Date: 2024-10-08 14:38:52
 * @Description: create base dom。
 */
import { helper } from ".";

/** @name Editor tag extension attribute configuration table */
const elementAttributeData = {
  /**
   * v：Element represents a row node, text represents a block text node
   */
  fishNode: {
    key: "data-fish-node",
    value: "fishNode"
  },
  /**
   * v：true
   */
  imageNode: {
    key: "data-fish-image",
    value: "fishImage"
  },
  emojiNode: {
    key: "data-fish-emoji",
    value: "fishEmoji"
  }
};

export const emptyEditHtmlText = "<p><br></p>";

export const prefixNmae = "fb-e-";

export const zeroWidthNoBreakSpace = "\u200B";

export const getElementAttributeKey = (name: keyof typeof elementAttributeData) => {
  return elementAttributeData[name]?.key || "";
};

export const getElementAttributeDatasetName = (name: keyof typeof elementAttributeData) => {
  return elementAttributeData[name]?.value || "";
};

export const createLineElement = (isNullNode = false): HTMLParagraphElement => {
  const dom_p = document.createElement("p");
  const id = `${prefixNmae}element-` + helper.generateRandomString();
  const key = getElementAttributeKey("fishNode");
  dom_p.setAttribute(key, "element");
  dom_p.id = id;

  if (!isNullNode) {
    dom_p.innerHTML = "<br/>";
  }

  return dom_p;
};

export const createChunkTextElement = <K extends keyof HTMLElementTagNameMap>(nodeName: K): HTMLElementTagNameMap[K] | null => {
  if (!nodeName) return null;
  const container = document.createElement(nodeName);
  container.id = `${prefixNmae}leaf-` + helper.generateRandomString();
  const key = getElementAttributeKey("fishNode");
  container.setAttribute(key, "text");
  return container;
};

/**
 *@name Create an emoji image block container node for an editor
 */
export const createChunkEmojiElement = (url: string, size: number, emijiName: string): HTMLSpanElement => {
  const node = new Image();
  node.src = url || null;
  node.id = `${prefixNmae}emoji-` + helper.generateRandomString();
  node.classList.add(`${prefixNmae}emoji`);
  node.setAttribute("style", `width:${size}px;height:${size}px`);
  const emojiNodeKey = getElementAttributeKey("emojiNode");
  node.setAttribute(emojiNodeKey, emijiName);
  return node;
};

export const createChunkImgElement = (url: string): HTMLSpanElement => {
  const node = new Image();
  node.src = url || null;
  node.id = `${prefixNmae}image-` + helper.generateRandomString();
  node.classList.add(`${prefixNmae}image`);

  const imageNodeKey = getElementAttributeKey("imageNode");
  node.setAttribute(imageNodeKey, "true");

  return node;
};

export const createZeroSpaceElement = (): Text => {
  return document.createTextNode(zeroWidthNoBreakSpace);
};
