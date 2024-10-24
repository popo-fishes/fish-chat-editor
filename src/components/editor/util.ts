/*
 * @Date: 2024-10-19 13:10:56
 * @Description: Modify here please
 */
import type { IEditorElement } from "../../types";
import { isNode, range } from "../../core";
/**
 * @name 修正光标的位置，把当前光标设置在最后一个编辑行节点下面的最后子节点
 */
export const amendRangePosition = (editNode: IEditorElement, callBack?: (node?: HTMLElement) => void) => {
  if (!editNode || !editNode.childNodes) return callBack?.();

  let lastRowElement = editNode.childNodes[editNode.childNodes.length - 1];

  if (!lastRowElement) {
    console.warn("富文本不存在节点，请排查问题");
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
           // 清空输入框
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
};

/** 获取当前编辑器中有多少个图片文件（不包含表情） */
export const getEditImageAmount = (node: IEditorElement): number => {
  let amount = 0;
  if (isNode.isDOMElement(node)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      amount += getEditImageAmount((node as any).childNodes[i]);
    }

    if (isNode.isEditInline(node) && isNode.isImageNode(node)) {
      amount += 1;
    }
  }
  return amount;
};
