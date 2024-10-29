/*
 * @Date: 2024-5-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: file content
 */
import type { IEmojiType } from "../types";

import { transforms, dom } from "../core";

let globalEmojiList: IEmojiType[] = [];
/**
 * @name 设置表情图片数据
 */
export const setEmojiData = (emojiData: IEmojiType[]) => {
  globalEmojiList = [...emojiData];
};

export const getEmojiData = (): IEmojiType[] => {
  return globalEmojiList || [];
};

/**
 * @name 文本消息转换，批量替换方法
 * @msgText 消息字符串
 * @size 表情的大小
 */
export const replaceMsgText = (msgText?: string, size?: number): string => {
  // 把文本标签转义：如<div>[爱心]</div> 把这个文本转义为"&lt;div&lt;"
  const semanticContent = transforms.labelRep(msgText);

  /**
   * 把字符串消息内容转格式：
   * 1. 把换行符分割，转为数组
   * 3. 把插入的文本转成节点 主要是把文本转成表情节点
   * 4. 构建行（p标签）段节点
   * 5. 完成转成后，渲染消息列表会用pre标签进行渲染(<pre dangerouslySetInnerHTML={{__html: msg}}>)
   */
  // 分割换行
  const lines = semanticContent?.split("\n") || [];
  // 换行字符串转换
  const data: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const childNodes = transforms.transformTextToNodes(lineContent, size);

    const node = document.createElement("p");
    node.innerHTML = "<br/>";

    if (childNodes.length) {
      dom.toTargetAddNodes(node, childNodes as any[]);
    }
    data.push(node.outerHTML);
  }
  return data.join("");
};
