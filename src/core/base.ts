/*
 * @Date: 2024-10-08 14:38:52
 * @Description: create base dom。
 */
import { helper } from ".";

export const prefixNmae = "fb-e-";

/** 零宽度非换行空格 */
export const zeroWidthNoBreakSpace = "\uFEFF";

/** 编辑器标签扩展属性配置表 */
export const elementAttributeData = {
  /**
   * 编辑器节点
   * 如果属性值为：text 代表是文本节点是，如果为element 代表是行 or 行内块节点（它是不可以编辑的）
   */
  fishNode: {
    key: "data-fish-node",
    value: "fishNode"
  },
  /**
  /**
   * 表情节点
   * 属性值：value 代表是表情
   */
  emojiNode: {
    key: "data-fish-emoji-name",
    value: "fishEmojiName"
  },

  /**
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

/**
 * @name 创建一个编辑器--行节点
 * @param isNullNode 默认为false, true代表不需要子节点，直接返回一个空的p标签
 * @returns
 */
export const createLineElement = (isNullNode = false): HTMLParagraphElement => {
  const dom_p = document.createElement("p");
  const id = `${prefixNmae}element-` + helper.getRandomWord();
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
 * @name 创建一个编辑器的表情（emoji）块容器图片节点
 * @param url 表情图片的路径
 * @param width 表情图片的宽度
 * @param height 表情图片的高度
 * @param emijiName 表情的文本描述
 * @returns 块容器图片节点
 */
export const createChunkEmojilement = (url: string, width: number, height: number, emijiName: string): HTMLSpanElement => {
  // 创建一个图片容器节点
  const container = document.createElement("span");
  container.id = `${prefixNmae}emoji-container-` + helper.getRandomWord();
  container.classList.add(`${prefixNmae}emoji-container`);
  container.setAttribute("style", `width:${width}px;height:${height}px`);

  container.setAttribute("contenteditable", "false");

  const node = new Image();
  node.src = url || null;
  const emojiNodeKey = getElementAttributeKey("emojiNode");

  node.setAttribute(emojiNodeKey, emijiName);

  container.appendChild(node);

  return container;
};
