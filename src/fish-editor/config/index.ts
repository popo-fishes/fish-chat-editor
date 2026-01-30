/*
 * @Date: 2026-01-29 11:07:10
 * @Description: Modify here please
 */
export type IEmojiType = {
  /** 表情的url地址 */
  url: string;
  /** 表情的名称，必须是“[爱心]”的格式 */
  name: string;
  /** 表情的tip提示名 */
  title: string;
};

let editorEmojiList: IEmojiType[] = [];

export const emojiSize = 28;

/**
 * @name Set emoji image data
 */
export const setEditorEmojiList = (emojiData: IEmojiType[]) => {
  editorEmojiList = [...emojiData];
};

export const getEditorEmojiList = (): IEmojiType[] => {
  return editorEmojiList || [];
};
