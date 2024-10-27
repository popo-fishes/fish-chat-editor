/*
 * @Date: 2024-3-14 15:40:27
 * @Description: file content
 */
import type { ReactNode, MutableRefObject } from "react";
import type { IEditorInstance } from "../editor";

export type IEditorElement = HTMLElement;

export type IEmojiType = {
  /** 表情的url地址 */
  url: string;
  /** 表情的名称，必须是“[爱心]”的格式 */
  name: string;
  /** 表情的tip提示名 */
  title: string;
};

/** 聊天组件的ref */
export interface IChatEditorRef extends IEditableRef {}

/** 聊天组件的props */
export interface IChatEditorProps extends Omit<IEditableProps, "onClick"> {
  /** 扩展类名 */
  className?: string;
  /** 表情列表数据 */
  emojiList?: IEmojiType[];
  /** 自定义工具栏内容 */
  toolbarRender?: () => ReactNode;
  /** 点击发送按钮事件 */
  onSend?: (editor: IEditorInstance) => void;
}

/** 编辑器ref */
export interface IEditableRef {
  /**
   * editor
   */
  editor: MutableRefObject<IEditorInstance | null>;
  /**
   * @添加表情方法
   */
  insertEmoji: (item: IEmojiType) => void;
  /**
   * @清空编辑器内容
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
}

/** 编辑器Props */
export interface IEditableProps {
  /** 提示占位符 */
  placeholder?: string;
  /** 编辑器点击事件 */
  onClick?: () => void;
  /** 编辑器键盘回车事件 */
  onEnterDown?: (editor: IEditorInstance) => void;
  /** 编辑器内容变化时的回调 */
  onChange?: (editor: IEditorInstance) => void;
  /**
   * 粘贴图片之前的钩子, 参数为粘贴的文件，若返回为空数组则停止粘贴，若返回为文件数组则继续处理
   * @param files 粘贴的文件数组
   * @param amount 富文本中已有的图片文件数量
   */
  beforePasteImage?: (files: File[], amount: number) => (File[] | []) | Promise<File[] | []>;
}
