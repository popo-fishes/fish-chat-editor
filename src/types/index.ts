/*
 * @Date: 2024-3-14 15:40:27
 * @Description: file content
 */
import type { ReactNode } from "react";
import type { default as FishEditor } from "../fish-editor";

export type IEmojiType = {
  /** 表情的url地址 */
  url: string;
  /** 表情的名称，必须是“[爱心]”的格式 */
  name: string;
  /** 表情的tip提示名 */
  title: string;
};

/** 聊天组件的ref */
export interface IChatEditorRef {
  focus: () => void;
  clear: () => void;
  blur: () => void;
  setText: (v: string) => void;
  fishEditor: React.MutableRefObject<FishEditor>;
}

/** 聊天组件的props */
export interface IChatEditorProps {
  /** 扩展类名 */
  className?: string;
  /** 表情列表数据 */
  emojiList?: IEmojiType[];
  /** 提示占位符 */
  placeholder?: string;
  /** 自定义工具栏内容 */
  toolbarRender?: () => ReactNode;
  /** 点击发送按钮事件 */
  onSend?: (editor: FishEditor["editor"]) => void;
  /** 编辑器键盘回车事件 */
  onEnterDown?: (editor: FishEditor["editor"]) => void;
  /** 编辑器内容变化时的回调 */
  onChange?: (editor: FishEditor["editor"]) => void;
  /**
   * 粘贴图片之前的钩子, 参数为粘贴的文件，若返回为空数组则停止粘贴，若返回为文件数组则继续处理
   * @param files 粘贴的文件数组
   * @param amount 富文本中已有的图片文件数量
   */
  beforePasteImage?: (files: File[], amount: number) => (File[] | []) | Promise<File[] | []>;
}
