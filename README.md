<!--shell
 * @Date: 2023-12-30 11:43:31
 * @Description: Modify here please
-->

<p align="center">fish-chat-editor - 一个基于React的聊天富文本组件</p>

## 安装

```shell
 # NPM
$ npm install fish-chat-editor
# Yarn
$ yarn add fish-chat-editor
# pnpm
$ pnpm install fish-chat-editor
```

## 使用

```js
// main.tsx
import "fish-chat-editor/dist/index.css";
```

```js
import FishChatEditor from "fish-chat-editor";

<FishChatEditor />;
```

## API

### Editor props

| 参数             | 说明                                                                                                                           | 类型                                            | 默认值 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ------ |
| placeholder      | 提示占位符                                                                                                                     | string                                          | ——     |
| className        | 扩展类名                                                                                                                       | string                                          | ——     |
| emojiList        | 表情列表数据,请看下面的IEmojiType描述                                                                                          | IEmojiType[]                                    | ——     |
| toolbarRender    | 自定义工具栏内容                                                                                                               | () => ReactNode                                 | ——     |
| onSend           | 点击发送按钮事件                                                                                                               | (editor) => void                                | ——     |
| onEnterDown      | 编辑器键盘回车事件                                                                                                             | (editor) => void                                | ——     |
| onChange         | 编辑器内容变化时                                                                                                               | (editor) => void                                | ——     |
| beforePasteImage | 粘贴图片之前的钩子, 参数files为粘贴的文件,amount为富文本中已有的图片个数; 若返回为空数组则停止粘贴，若返回为文件数组则继续处理 | (files: File[], amount: number) => File[] or [] | ——     |

### Editor Methods

| 名称   | 说明                                   | 类型                   |
| ------ | -------------------------------------- | ---------------------- |
| clear  | 清空输入框值                           | () => void             |
| focus  | 获取焦点                               | () => void             |
| blur   | 失去焦点                               | () => void             |
| editor | 编辑器 API (具体看IEditorInstance描述) | obj as IEditorInstance |

### IEmojiType描述

```ts
export type IEmojiType = {
  /** 表情的url地址 */
  url: string;
  /** 表情的名称，必须是“[爱心]”的格式 */
  name: string;
  /** 表情的tip提示名 */
  title: string;
};
// 如：
export const emoji: { [key: string]: string } = {
  "[爱你]": "www.cc.com/[爱你].png"
};
```

### IEditorInstance描述

```ts
export interface IEditorInstance {
  /**
   * @name 判断编辑器是否空内容
   * @desc 仅存在换行or输入空格，都算是空内容
   */
  isEmpty: () => boolean;
  /** @name 获取编辑器的纯文本内容 */
  getText: () => string;
  /**
   * @name 获取编辑器内容的语义HTML
   * @desc 当你想提交富文本内容时，它是非常有用的，因为它会把img图片的src转换成base64。
   * @returns 返回一个html标签字符串
   */
  getSemanticHTML: () => string;
  /**
   * @name 获取编辑器内容的原始HTML，主要用于判断值场景 or 富文本内部使用
   * @desc 它不会转换img图片的src，还是blob格式
   * @returns 返回一个html标签字符串
   */
  getProtoHTML: () => string;
  /**
   * @name 在选区插入文本
   * @param contentText 内容
   * @param range 光标信息
   * @param callBack 回调（success?）=> void
   * @param showCursor 插入成功后是否需要设置光标
   */
  insertText: (contentText: string, range: IRange, callBack?: (success: boolean) => void, showCursor?: boolean) => void;
  /**
   * @name 在目标位置插入节点（目前是图片）
   * @param nodes 节点集合
   * @param range 光标信息
   * @param callBack 回调（success?）=> void
   * @returns
   */
  insertNode: (nodes: HTMLElement[], range: IRange, callBack?: (success: boolean) => void) => void;
  /** @name 获取行数 */
  getLine: () => number;
  /** @name 检索编辑器内容的长度，不包含图片 */
  getLength: () => number;
  /** @name 设置编辑器文本, 注意它不会覆盖编辑器内容，而是追加内容 */
  setText: (content: string) => void;
  /** @name 清空编辑器内容 */
  clear: () => HTMLElement | null;
  /** @name 失去焦点 */
  blur: () => void;
  /** @name 获取焦点 */
  focus: () => void;
}
```
