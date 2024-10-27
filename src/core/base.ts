/*
 * @Date: 2024-10-08 14:38:52
 * @Description: create base dom。
 */
import { helper } from ".";

const specialmode = false;

/** 编辑器标签扩展属性配置表 */
const elementAttributeData = {
  /**
   * 编辑器节点
   * 属性值：element 代表是行节点
   */
  fishNode: {
    key: "data-fish-node",
    value: "fishNode"
  },
  /**
   * 内联块节点
   * 属性值为：true 代表是内联块
   */
  fishInline: {
    key: "data-fish-inline",
    value: "fishInline"
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
    key: "data-fish-emoji-name",
    value: "fishEmojiName"
  }
};

/** 空的富文本内容 */
export const emptyEditHtmlText = "<p><br></p>";

/** 样式前缀名称 */
export const prefixNmae = "fb-e-";

/** 零宽度非换行空格 */
export const zeroWidthNoBreakSpace = "\u200B";

/** 保存图片的base64 map数据 */
export const editorImageBase64Map: Map<string, string> = new Map();

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
 * @returns
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

  // const fragment = new DocumentFragment();
  // for (let i = 0; i < 200; i++) {
  //   const node = new Image();
  //   node.src = "https://static107.cdqlkj.cn/r/3a88/107/pb/p/20240628/01be10a6cd484b21b3d38a69ee6d4401.png";
  //   fragment.appendChild(node);
  // }
  // dom_p.appendChild(fragment);

  return dom_p;
};

/**
 * @name 创建一个编辑器的表情（emoji）图片块容器节点
 * @param url 表情图片的路径
 * @param size 表情图片的大小
 * @param emijiName 表情的文本描述
 * @returns 块容器图片节点
 */
export const createChunkEmojiElement = (url: string, size: number, emijiName: string): HTMLSpanElement => {
  if (specialmode) {
    // 创建一个图片容器节点，这种的方式需要自己去处理合并行时的场景太复杂了
    const container = document.createElement("span");
    container.id = `${prefixNmae}emoji-container-` + helper.generateRandomString();
    container.classList.add(`${prefixNmae}emoji-container`);
    container.setAttribute("style", `width:${size}px;height:${size}px`);
    // 不可编辑
    container.setAttribute("contenteditable", "false");
    // 标记为内联块节点
    const fishInlineKey = getElementAttributeKey("fishInline");
    container.setAttribute(fishInlineKey, "true");
    // 表情name值
    const emojiNodeKey = getElementAttributeKey("emojiNode");
    container.setAttribute(emojiNodeKey, emijiName);
    // 添加图片
    const node = new Image();
    node.src = url || null;
    container.appendChild(node);
    return container;
  } else {
    const node = new Image();
    node.src = url || null;
    node.id = `${prefixNmae}emoji-img-` + helper.generateRandomString();
    node.classList.add(`${prefixNmae}emoji-img`);
    node.setAttribute("style", `width:${size}px;height:${size}px`);

    const fishInlineKey = getElementAttributeKey("fishInline");
    node.setAttribute(fishInlineKey, "true");
    // 表情name值
    const emojiNodeKey = getElementAttributeKey("emojiNode");
    node.setAttribute(emojiNodeKey, emijiName);
    return node;
  }
};

/**
 * @name 创建一个编辑器的图片块容器节点
 * @param url 表情图片的路径
 */
export const createChunkImgElement = (url: string): HTMLSpanElement => {
  if (specialmode) {
    // 创建一个图片容器节点，这种的方式需要自己去处理合并行时的场景太复杂了
    const container = document.createElement("span");
    container.id = `${prefixNmae}image-container-` + helper.generateRandomString();
    container.classList.add(`${prefixNmae}image-container`);
    // 不可编辑
    container.setAttribute("contenteditable", "false");
    // 标记为内联块节点
    const fishInlineKey = getElementAttributeKey("fishInline");
    container.setAttribute(fishInlineKey, "true");
    // 标记为图片节点
    const imageNodeKey = getElementAttributeKey("imageNode");
    container.setAttribute(imageNodeKey, "true");
    // 添加图片
    const node = new Image();
    node.src = url || null;
    container.appendChild(node);
    return container;
  } else {
    const node = new Image();
    node.src = url || null;
    node.id = `${prefixNmae}image` + helper.generateRandomString();
    node.classList.add(`${prefixNmae}image`);

    const fishInlineKey = getElementAttributeKey("fishInline");
    node.setAttribute(fishInlineKey, "true");

    // 标记为图片节点
    const imageNodeKey = getElementAttributeKey("imageNode");
    node.setAttribute(imageNodeKey, "true");

    return node;
  }
};

/**
 * @name 创建一个编辑器--零宽度文本节点
 * 它是一个核心！！
 * @returns
 */
export const createZeroSpaceElement = (): Text => {
  return document.createTextNode(zeroWidthNoBreakSpace);
};
