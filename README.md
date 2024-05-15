<!--
 * @Date: 2023-12-30 11:43:31
 * @Description: Modify here please
-->

<p align="center">fish-bubble-chat-editor - 一个基于React的聊天富文本组件</p>

## 安装

```shell
 # NPM
$ npm install fish-bubble-chat-editor
# Yarn
$ yarn add fish-bubble-chat-editor
# pnpm
$ pnpm install fish-bubble-chat-editor
```

## 使用

```js
// main.tsx
import "fish-bubble-chat-editor/dist/index.css";
```

```js
import FbChatEditor from "fish-bubble-chat-editor";

<FbChatEditor />;
```

## API

### Editor props

| 参数          | 说明             | 类型            | 默认值 |
| ------------- | ---------------- | --------------- | ------ |
| placeholder   | 提示占位符       | string          | ——     |
| className     | 扩展类名         | string          | ——     |
| toolbarRender | 自定义工具栏内容 | () => ReactNode | ——     |
| onSend        | 点击发送按钮事件 | () => ReactNode | ——     |
| onEnterDown   | 键盘回车事件     | Function        | ——     |
| onChange      | 输入框内容变化时 | Function        | ——     |

### Editor Methods

| 名称     | 说明         | 类型                  |
| -------- | ------------ | --------------------- |
| getValue | 获取输入框值 | () => string          |
| setValue | 设置输入框值 | (val: string) => void |
| clear    | 清空输入框值 | () => void            |
| focus    | 获取焦点     | () => void            |
| blur     | 失去焦点     | () => void            |

<table style="width:100%">
  <tr>
    <th>列1</th>
    <th>列2</th>
    <th>列3</th>
  </tr>
  <tr>
    <td>行1列1</td>
    <td>行1列2</td>
    <td>行1列3</td>
  </tr>
  <tr>
    <td>行2列1</td>
    <td>行2列2</td>
    <td>行2列3</td>
  </tr>
</table>
