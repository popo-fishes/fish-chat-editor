/*
 * @Date: 2024-10-12 13:45:55
 * @Description: Modify here please
 */
import { useRef, useState } from "react";
import type { IEmojiType, IEditableProps, IEditorElement } from "../../types";

import { base, isNode, util, range, editor, IRange } from "../../core";

const { createLineElement, getElementAttributeKey, createChunkSapnElement, createChunkEmojilement } = base;
const { isEditElement, isEditTextNode } = isNode;
const { deleteTextNodeOfEmptyNode, deleteTargetNodeOfBrNode, getNodeOfEditorTextNode } = util;
const { setRangeNode, amendRangePosition, getRange } = range;
const { getText } = editor;

// 备份当前的光标位置
let currentRange: IRange = null;

export default function useEditable(props: IEditableProps) {
  const { ...restProps } = props;

  /** 用于操作聊天输入框元素 */
  const editRef = useRef<IEditorElement>(null);
  /** 是否显示提示placeholder */
  const [showTipHolder, setTipHolder] = useState<boolean>(true);

  /** @name 初始化编辑器 */
  const init = async () => {
    const editor = editRef.current;
    if (!editor) return;

    // 清空内容
    const curDom = clearEditor();
    // 设置目标
    setRangePosition(curDom, 0, true);
  };

  /** @name 清空输入框的值 */
  const clearEditor = (): HTMLParagraphElement | null => {
    const node = createLineElement();
    if (!editRef.current) return null;
    editRef.current.innerHTML = ""; // 清空所有子节点
    editRef.current?.appendChild(node);
    // 设置提示
    setTipHolder(true);
    return node;
  };

  /** @name 设置光标的位置 */
  const setRangePosition = (curDom: HTMLElement, startOffset: number, isReset?: boolean) => {
    let dom = curDom;
    if (isEditElement(curDom) && isEditTextNode((curDom as any).firstChild) && isReset) {
      dom = (curDom as any).firstChild;
    }
    // 光标位置为开头
    currentRange = {
      startContainer: dom,
      startOffset: startOffset || 0,
      endContainer: dom,
      endOffset: 0,
      anchorNode: dom
    };
  };

  /** @name 选择插入表情图片 */
  const insertEmoji = (item: IEmojiType) => {
    const editorTextNode = getNodeOfEditorTextNode(currentRange.startContainer);
    // 非常重要的逻辑
    if (!editorTextNode) {
      // 修正光标位置
      amendRangePosition(editRef.current, (node) => {
        if (node) {
          // 设置当前光标节点
          setRangePosition(node, 0);
          insertEmoji(item);
        }
      });
      return;
    }
    // 创建
    const node = createChunkEmojilement(item.url, 18, 18, item.name);
    const container = createChunkSapnElement(node);
    editor.insertNode([container], currentRange);

    // if (currentSelection.startContainer?.nodeType == 3) {
    //   /**
    //    * 如果是文本节点，拆分节点
    //    * https://developer.mozilla.org/en-US/docs/Web/API/Text/splitText
    //    * */
    //   if (currentSelection.startContainer instanceof Text) {
    //     const afterNode = currentSelection.startContainer?.splitText(currentSelection.startOffset);
    //     // 设置光标开始节点为拆分之后节点的父级节点
    //     currentSelection.startContainer = afterNode.parentNode as HTMLElement;
    //     // 在拆分后的节点之前插入图片
    //     currentSelection.startContainer.insertBefore(node, afterNode);
    //   } else {
    //     console.warn("Start container is not a text node.");
    //   }
    // } else {
    //   // 非文本节点
    //   if (currentSelection.startContainer?.childNodes.length) {
    //     // 如果光标开始节点下有子级，获取到光标位置的节点
    //     const beforeNode = currentSelection.startContainer.childNodes[currentSelection.startOffset];
    //     // 插入
    //     currentSelection.startContainer.insertBefore(node, beforeNode);
    //   } else {
    //     // 如果光标开始节点下没有子级，直接插入
    //     currentSelection.startContainer?.appendChild(node);
    //   }
    // }

    // // console.log(editorTextNode.childNodes);
    // // 删除空文本节点，主要是因为splitText分割方法会创建一个空的文本节点
    // deleteTextNodeOfEmptyNode(editorTextNode);
    // // 判断是否存在br
    // deleteTargetNodeOfBrNode(currentSelection.startContainer);

    // // 视图滚动带完全显示出来
    // node.scrollIntoView(false);
    // // 设置焦点
    // setRangeNode(node, "after", async () => {
    //   // 重新聚焦输入框
    //   editRef?.current?.focus();
    //   // 主动触发输入框值变化
    //   const val = getText(editRef.current);
    //   // 控制提示
    //   setTipHolder(val == "");
    //   restProps.onChange?.(val);
    // });
  };

  return {
    editRef,
    showTipHolder,

    setTipHolder,
    setRangePosition,

    clearEditor,
    init,

    insertEmoji
  };
}
