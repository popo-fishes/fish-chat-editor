/*
 * @Date: 2024-10-25 10:45:48
 * @Description: Modify here please
 */
import { isNode, range } from ".";
import type { IEditorElement } from "../types";
/**
 * @name 把光标设置在编辑器的最后一个行节点下面的最后子节点
 */
export const setCursorEditorLast = (editorNode: IEditorElement, callBack?: (node?: HTMLElement) => void) => {
  if (!editorNode || !editorNode.childNodes) return callBack?.();

  let lastRowElement = editorNode.childNodes[editorNode.childNodes.length - 1];

  if (!lastRowElement) {
    console.warn("富文本不存在节点，请排查问题");
    callBack?.();
    return;
  }
  // 最后一行编辑节点是一个节点块
  if (isNode.isEditElement(lastRowElement as HTMLElement)) {
    // 获取编辑行的最后一个子节点
    const referenceElement = lastRowElement.childNodes[lastRowElement.childNodes.length - 1];
    if (referenceElement) {
      /**
       * 解决在初始化时，当富文本中只有一个br时，光标点不能设置在BR结束位置.不然会有输入中文时，不生效
       * 特别是在清空输入内容时：然后在次获取焦点，再次输入就会有BUG
       * 比如： 发送文本消息
         const onSend = async (_) => {
           // 清空编辑器
           editorRef.current?.clear();

           editorRef.current?.focus();
          };
       */
      if (referenceElement.nodeName == "BR") {
        range.setCursorPosition(referenceElement, "before");
      } else {
        range.setCursorPosition(referenceElement, "after");
      }
      callBack?.(referenceElement as HTMLElement);
      return;
    }
  }

  console.warn("富文本不存在节点，请排查问题");
  callBack?.();

  return;
};
