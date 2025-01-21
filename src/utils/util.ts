/*
 * @Date: 2024-5-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: file content
 */
import type { IEmojiType } from "../types";

import { transforms, dom } from "../fish-editor/utils";

let globalEmojiList: IEmojiType[] = [];
/**
 * @name Set emoji image data
 */
export const setEmojiData = (emojiData: IEmojiType[]) => {
  globalEmojiList = [...emojiData];
};

export const getEmojiData = (): IEmojiType[] => {
  return globalEmojiList || [];
};

/**
 * @name Text message conversion, batch replacement method
 * @msgText
 * @size
 */
export const replaceMsgText = (msgText?: string, size?: number): string => {
  const semanticContent = transforms.labelRep(msgText);

  const lines = semanticContent?.split("\n") || [];

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
