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
import FbChatEditor from "fish-chat-editor";

<FbChatEditor />;
```

## API

### Editor props

| 参数          | 说明                                  | 类型             | 默认值 |
| ------------- | ------------------------------------- | ---------------- | ------ |
| placeholder   | 提示占位符                            | string           | ——     |
| className     | 扩展类名                              | string           | ——     |
| emojiList     | 表情列表数据,请看下面的IEmojiType描述 | IEmojiType[]     | ——     |
| toolbarRender | 自定义工具栏内容                      | () => ReactNode  | ——     |
| onSend        | 点击发送按钮事件                      | (editor) => void | ——     |
| onEnterDown   | 键盘回车事件                          | (editor) => void | ——     |
| onChange      | 输入框内容变化时                      | (editor) => void | ——     |

### Editor Methods

| 名称     | 说明         | 类型                  |
| -------- | ------------ | --------------------- |
| setValue | 设置输入框值 | (val: string) => void |
| clear    | 清空输入框值 | () => void            |
| focus    | 获取焦点     | () => void            |
| blur     | 失去焦点     | () => void            |
| editor   | 编辑器 API   | obj                   |

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
