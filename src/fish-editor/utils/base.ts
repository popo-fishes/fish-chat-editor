/*
 * @Date: 2024-10-08 14:38:52
 * @Description: create base dom。
 */
import { helper } from ".";

/** @name 编辑器标签扩展属性配置表 */
const elementAttributeData = {
  /**
   * 编辑器节点
   * 属性值：element 代表是行节点 text 代表是块文本节点
   */
  fishNode: {
    key: "data-fish-node",
    value: "fishNode"
  },
  /**
   * 图片节点
   * 属性值：true 代表是图片节点
   */
  imageNode: {
    key: "data-fish-image",
    value: "fishImage"
  },
  /**
  /**
   * 表情节点
   * 属性值：value 代表是表情的名称
   */
  emojiNode: {
    key: "data-fish-emoji",
    value: "fishEmoji"
  }
};

/** @name 空的富文本内容 */
export const emptyEditHtmlText = "<p><br></p>";

/** @name 样式前缀名称 */
export const prefixNmae = "fb-e-";

/** @name 零宽度非换行空格 */
export const zeroWidthNoBreakSpace = "\u200B";

/** @name 获取编辑器节点属性key */
export const getElementAttributeKey = (name: keyof typeof elementAttributeData) => {
  return elementAttributeData[name]?.key || "";
};

/** @name 获取编辑器节点属性datasetName */
export const getElementAttributeDatasetName = (name: keyof typeof elementAttributeData) => {
  return elementAttributeData[name]?.value || "";
};

/**
 * @name 创建一个编辑器--行节点
 * @param isNullNode 默认为false, true代表不需要子节点，直接返回一个空的p标签
 */
export const createLineElement = (isNullNode = false): HTMLParagraphElement => {
  const dom_p = document.createElement("p");
  const id = `${prefixNmae}element-` + helper.generateRandomString();
  const key = getElementAttributeKey("fishNode");
  dom_p.setAttribute(key, "element");
  dom_p.id = id;
  /**
   * 是否需要创建子节点，代表创建一个换行文本标签
   */
  if (!isNullNode) {
    dom_p.innerHTML = "<br/>";
  }

  return dom_p;
};

/**
 * @name 创建一个编辑器--文本节点
 * @param nodeName 节点名称
 * @desc 它是属于编辑器行节点的叶子(leaf)节点
 */
export const createChunkTextElement = <K extends keyof HTMLElementTagNameMap>(nodeName: K): HTMLElementTagNameMap[K] | null => {
  if (!nodeName) return null;
  const container = document.createElement(nodeName);
  container.id = `${prefixNmae}leaf-` + helper.generateRandomString();
  // 标记为编辑器 文本节点
  const key = getElementAttributeKey("fishNode");
  container.setAttribute(key, "text");
  return container;
};

/**
 * @name 创建一个编辑器的表情（emoji）图片块容器节点
 * @param url 表情图片的路径
 * @param size 表情图片的大小
 * @param emijiName 表情的文本描述
 * @returns 块容器图片节点
 */
export const createChunkEmojiElement = (url: string, size: number, emijiName: string): HTMLSpanElement => {
  const node = new Image();
  node.src = url || null;
  node.id = `${prefixNmae}emoji-` + helper.generateRandomString();
  node.classList.add(`${prefixNmae}emoji`);
  node.setAttribute("style", `width:${size}px;height:${size}px`);
  // 表情name值
  const emojiNodeKey = getElementAttributeKey("emojiNode");
  node.setAttribute(emojiNodeKey, emijiName);
  return node;
};

/**
 * @name 创建一个编辑器的图片块容器节点
 * @param url 表情图片的路径
 */
export const createChunkImgElement = (url: string): HTMLSpanElement => {
  const node = new Image();
  node.src = url || null;
  node.id = `${prefixNmae}image-` + helper.generateRandomString();
  node.classList.add(`${prefixNmae}image`);

  // 标记为图片节点
  const imageNodeKey = getElementAttributeKey("imageNode");
  node.setAttribute(imageNodeKey, "true");

  return node;
};

/**
 * @name 创建一个编辑器--零宽度文本节点
 */
export const createZeroSpaceElement = (): Text => {
  return document.createTextNode(zeroWidthNoBreakSpace);
};
