/*
 * @Date: 2024-10-12 16:00:15
 * @Description: Modify here please
 */
import { base, isNode, dom } from ".";
import { getEmojiData } from "../utils";
/** @name 字符串标签转换 */
export const labelRep = (str: string, reversal?: boolean) => {
  if (!str) return "";
  // 反转回去
  if (reversal) {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  }
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

/**
 *  @name 把插入的文本转成节点
 * 主要是把文本转成表情节点
 */
export const transformTextToNodes = (content: string): Node[] | [] => {
  if (!content) return [];
  const emojiList = getEmojiData();
  const nodes: Node[] = [];

  let strCont = content;
  /**
   * 比如content为：哈哈[爱你]哈[不看]哈--->
   * 要转换为一个数组： [text节点内容为“"哈哈"，img节点， text节点内容为“"哈"，img节点， text节点内容为“"哈哈"]
   * ：：：：：
   *这里主要做字符串标记
   */
  for (const i in emojiList) {
    const item = emojiList[i];
    const reg = new RegExp("\\" + item.name, "g");
    // 替换
    strCont = strCont?.replace(reg, function () {
      const key = base.getElementAttributeKey("emojiNode");
      // 替换表情
      const strimg = `<img src="${item.url}" width="${18}px" height="${18}px" ${key}="${item.name}"/>`;
      return strimg;
    });
  }

  // 创建一个p标签, 把字符串转成一个dom节点
  const dom_p = document.createElement("p");
  dom_p.innerHTML = strCont;
  // 处理当前节点内容
  if (dom_p.childNodes?.length) {
    dom_p.childNodes.forEach((cldNode) => {
      if (isNode.isDOMText(cldNode)) {
        nodes.push(cldNode);
      } else if (isNode.isDOMElement(cldNode) && cldNode.nodeName == "IMG") {
        const attrName = base.getElementAttributeDatasetName("emojiNode");
        const elementAttrVal = (cldNode as any)?.dataset?.[attrName] || "";
        if (elementAttrVal && (cldNode as any).src) {
          const imgNode = base.createChunkEmojilement((cldNode as any).src, 18, 18, elementAttrVal);
          nodes.push(imgNode);
        }
      }
    });
  }

  return nodes;
};

/**
 * @name 除去字符串空格换后是否为一个空文本，如果是直接赋值为空，否则用原始的
 * 常用于获取节点值后，判断是否全部是空格 和 换行，如果是就给字符串置空
 */
export const editTransformSpaceText = (content: string) => {
  // 删除所有换行
  const cStr = content.replace(/\s/g, "");
  // 去掉所有的换行
  const lStr = cStr.replace(/\n/g, "");

  // 删除全部的换行和空格，得到一个 空字符，直接用空字符串作为值
  if (lStr == "") {
    content = "";
  }

  return content;
};

/** @name 复制节点的文本值 */
export const getPlainText = (domNode: HTMLElement) => {
  let text = "";

  if (isNode.isDOMText(domNode) && domNode.nodeValue) {
    return domNode.nodeValue;
  }

  if (isNode.isDOMElement(domNode)) {
    for (const childNode of Array.from(domNode.childNodes)) {
      text += getPlainText(childNode as any);
    }

    const display = getComputedStyle(domNode).getPropertyValue("display");

    const emojiNodeAttrKey = base.getElementAttributeKey("emojiNode");
    const emojiNodeAttrName = base.getElementAttributeDatasetName("emojiNode");
    // 是否是一个表情图片,如果是取出
    const isEmojiVal = domNode?.dataset?.[emojiNodeAttrName] || "";
    const isEmojiNode = domNode.nodeName == "IMG" && domNode.hasAttribute(emojiNodeAttrKey);

    if (isEmojiNode && isEmojiVal) {
      text += isEmojiVal;
    }

    if (display === "block" && domNode.nodeName !== "IMG") {
      text += "\n";
    }
  }

  return text;
};

/** @name 获取编辑行属性节点的内容 */
export const getEditElementContent = (node: any): string => {
  let content = "";

  if (isNode.isDOMText(node)) {
    content += node.textContent;
  }
  if (isNode.isDOMElement(node)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      content += getEditElementContent(node.childNodes[i]);
    }
    if (isNode.isEditInline(node)) {
      const emojiNodeAttrKey = base.getElementAttributeKey("emojiNode");
      const emojiNodeAttrName = base.getElementAttributeDatasetName("emojiNode");
      // 是否是一个表情图片,如果是取出名称
      const isEmojiVal = node?.dataset?.[emojiNodeAttrName] || "";
      const isEmojiNode = node.hasAttribute(emojiNodeAttrKey);

      if (isEmojiNode && isEmojiVal) {
        content += isEmojiVal;
      }
    }
  }

  return content;
};

/**
 * @name 获取编辑器节点输入的内容。逐行获取
 * @returns 返回一个文本数组
 */
export const handleEditNodeTransformsValue = (node: HTMLElement): string[] => {
  const result: string[] = [];
  if (!node || !node?.childNodes) return [];
  const nodes: any = Array.from(dom.cloneNodes((node as any).childNodes));
  for (const cld of Array.from(nodes)) {
    const content = getEditElementContent(cld as Element);
    result.push(content);
  }
  return result;
};
