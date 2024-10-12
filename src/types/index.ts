/*
 * @Date: 2024-3-14 15:40:27
 * @Description: file content
 */
import type { ReactNode } from "react";

export type IEditorElement = HTMLDivElement;

export type IEmojiType = {
  url: string;
  name: string;
  title: string;
};

/** 聊天组件的ref */
export interface IChatEditorRef extends IEditableRef {}

/** 聊天组件的props */
export interface IChatEditorProps extends Pick<IEditableProps, "placeholder" | "onEnterDown" | "onChange"> {
  /** 扩展类名 */
  className?: string;
  /** 表情列表数据 */
  emojiList?: IEmojiType[];
  /** emoji cdn地址, 当你需要自定义emojiList 那么它是必须的。*/
  emojiCdn?: string;
  /** 自定义工具栏内容 */
  toolbarRender?: () => ReactNode;
  /** 点击发送按钮事件 */
  onSend?: (val: string) => void;
}

/** 编辑器输入框ref */
export interface IEditableRef {
  /**
   * @添加表情方法
   */
  insertEmoji: (item: IEmojiType) => void;
  /**
   * @获取输入框值
   */
  getValue: () => string;
  /**
   * @清空输入框值
   */
  clear: () => void;
  /**
   * @获取焦点
   */
  focus: () => void;
  /**
   * @失去焦点
   */
  blur: () => void;
  /**
   * @设置输入框值
   */
  setValue: (val: string) => void;
}

/** 编辑器输入框Props */
export interface IEditableProps {
  /** 提示占位符 */
  placeholder?: string;
  /** 输入框点击事件 */
  onClick?: () => void;
  /** 键盘回车事件 */
  onEnterDown?: (v?: string) => void;
  /** 输入框内容变化时的回调 */
  onChange?: (val: string) => void;
}
