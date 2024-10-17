/*
 * @Date: 2024-10-12 16:00:15
 * @Description: Modify here please
 */
import { base, isNode, dom } from ".";

import type { IEditorElement } from "../types";

/**
 * @name 除去字符串空格换后是否为一个空文本，如果是直接赋值为空，否则用原始的
 * 常用于获取富文本值后，判断是否全部是空格 和 换行，如果是就给字符串置空
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

/** @name 复制富文本节点的文本值 */
export const getPlainText = (domNode: any) => {
  let text = "";

  if (isNode.isDOMText(domNode) && domNode.nodeValue) {
    return domNode.nodeValue;
  }

  if (isNode.isDOMElement(domNode)) {
    for (const childNode of Array.from(domNode.childNodes)) {
      text += getPlainText(childNode as Element);
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
 * @name 获取富文本输入的内容。逐行获取
 * @returns 返回一个文本数组
 */
export const handleEditNodeTransformsValue = (editNode: IEditorElement): string[] => {
  const result: string[] = [];
  if (!editNode || !editNode?.childNodes) return [];
  const nodes: any = Array.from(dom.cloneNodes((editNode as any).childNodes));
  for (const cld of Array.from(nodes)) {
    const content = getEditElementContent(cld as Element);
    result.push(content);
  }
  return result;
};
