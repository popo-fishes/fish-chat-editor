/*
 * @Date: 2024-10-08 14:38:52
 * @Description: Modify here please
 */
import { getRandomWord } from ".";

export const prefixNmae = "fb-e-";

/** 标签扩展属性配置表 */
export const elementDataKeys: {
  /** 节点名 */
  [key: string]: {
    /** 属性名 */
    key: string;
    /** dataset-name */
    value: string;
  };
} = {
  // 编辑器节点
  editorNode: {
    key: "data-fish-node",
    value: "fishNode"
  },
  // 编辑器节点行内块节点
  inlineNode: {
    key: "data-fish-inline",
    value: "fishInline"
  },
  // 表情节点行内块节点
  emojiNode: {
    key: "data-fish-emoji-name",
    value: "fishEmojiName"
  },
  imgNode: {
    key: "data-fish-is-img",
    value: "fishIsImg"
  }
};

/** @name 获取编辑器节点属性key */
export const getElementAttributeKey = (name: string) => {
  return elementDataKeys[name]?.key || "";
};

/** @name 获取编辑器节点属性datasetName */
export const getElementAttributeDatasetName = (name: string) => {
  return elementDataKeys[name]?.value || "";
};

/** @name 创建一个编辑器--行节点 */
export const createLineElement = (): HTMLParagraphElement => {
  const dom_p = document.createElement("p");
  const id = `${prefixNmae}element-` + getRandomWord(4);
  const key = getElementAttributeKey("editorNode");
  dom_p.setAttribute(key, "element");
  dom_p.id = id;
  //dom_p.appendChild(createChunkTextElement());
  dom_p.innerHTML = "<br>";
  return dom_p;
};

/** @name 创建一个编辑器的行内--块节点 */
export const createChunkSapnElement = (node: HTMLElement): HTMLSpanElement => {
  const dom_span = document.createElement("sapn");
  const id = `${prefixNmae}element-` + getRandomWord(4);
  // 获取属性1
  const elementAttribute = getElementAttributeKey("editorNode");
  dom_span.setAttribute(elementAttribute, "element");
  // 获取属性2
  const inlineAttribute = getElementAttributeKey("inlineNode");
  dom_span.setAttribute(inlineAttribute, "true");
  dom_span.id = id;
  dom_span.appendChild(node);
  return dom_span;
};

/** @name 创建一个编辑器的行内--文本节点 */
export const createChunkTextElement = (isEmpty = true): HTMLSpanElement => {
  const dom_span = document.createElement("sapn");
  const id = `${prefixNmae}element-` + getRandomWord(4);
  const elementAttribute = getElementAttributeKey("editorNode");
  dom_span.setAttribute(elementAttribute, "text");
  dom_span.setAttribute("data-fish-length", "0");
  dom_span.id = id;
  if (isEmpty) {
    dom_span.innerHTML = "&#xFEFF;";
  } else {
    dom_span.innerHTML = "<br>";
  }

  return dom_span;
};
