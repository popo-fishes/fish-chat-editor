/*
 * @Date: 2024-10-08 14:38:52
 * @Description: Modify here please
 */
import { getRandomWord } from ".";

export const prefixNmae = "fb-e-";

/** 编辑器标签扩展属性配置表 */
export const elementAttributeData = {
  /**
   * 编辑器节点
   * 如果属性值为：text 代表是文本节点是，如果为element 代表是行 | 行内块节点（它是不可以编辑的）
   */
  fishNode: {
    key: "data-fish-node",
    value: "fishNode"
  },
  /**
   * 行内块节点（编辑节点中的块，比如图片）
   * 属性值: true 代表是行内块节点
   */
  fishInline: {
    key: "data-fish-inline",
    value: "fishInline"
  },

  /**
   * 表情节点
   * 属性值：value 代表是表情
   */
  emojiNode: {
    key: "data-fish-emoji-name",
    value: "fishEmojiName"
  },

  /**
   * todo
   * 图片节点
   * 属性值：true 代表是图片节点
   */
  imgNode: {
    key: "data-fish-is-img",
    value: "fishIsImg"
  }
};

/** @name 获取编辑器节点属性key */
export const getElementAttributeKey = (name: string) => {
  return elementAttributeData[name]?.key || "";
};

/** @name 获取编辑器节点属性datasetName */
export const getElementAttributeDatasetName = (name: string) => {
  return elementAttributeData[name]?.value || "";
};

/** @name 创建一个编辑器--行节点 */
export const createLineElement = (isEmpty = false): HTMLParagraphElement => {
  const dom_p = document.createElement("p");
  const id = `${prefixNmae}element-` + getRandomWord(4);
  const key = getElementAttributeKey("fishNode");
  dom_p.setAttribute(key, "element");
  dom_p.id = id;
  // 创建一个空的p标签
  if (!isEmpty) {
    dom_p.appendChild(createChunkTextElement(false));
  }
  return dom_p;
};

/** @name 创建一个编辑器的行内--块节点 */
export const createChunkSapnElement = (node: HTMLElement): HTMLSpanElement => {
  const dom_span = document.createElement("sapn");
  const id = `${prefixNmae}element-` + getRandomWord(4);
  // 获取属性1
  const key = getElementAttributeKey("fishNode");
  dom_span.setAttribute(key, "element");
  // 获取属性2
  const inlineAttribute = getElementAttributeKey("fishInline");
  dom_span.setAttribute(inlineAttribute, "true");
  dom_span.id = id;
  dom_span.appendChild(node);
  return dom_span;
};

/** @name 创建一个编辑器的行内--文本节点 */
export const createChunkTextElement = (isEmpty = true): HTMLSpanElement => {
  const dom_span = document.createElement("sapn");
  const id = `${prefixNmae}element-` + getRandomWord(4);
  const elementAttribute = getElementAttributeKey("fishNode");
  dom_span.setAttribute(elementAttribute, "text");
  dom_span.id = id;
  if (isEmpty) {
    dom_span.innerHTML = "&#xFEFF;";
  } else {
    dom_span.innerHTML = "<br>";
  }

  return dom_span;
};
