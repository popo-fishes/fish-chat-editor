/*
 * @Date: 2024-10-12 13:45:55
 * @Description: Modify here please
 */
import { useRef, useState } from "react";
import type { IEmojiType, IEditableProps, IEditorElement } from "../../types";

import { base, isNode, util, range, editor } from "../../core";

const { createLineElement, getElementAttributeKey } = base;
const { isEditElement, isEditTextNode } = isNode;
const { deleteTextNodeAndEmpty, deleteTextNodeAndBrNode, getNodeOfEditorTextNode } = util;
const { setRangeNode, amendRangePosition } = range;
const { getText } = editor;

// 备份当前的光标位置
let currentSelection: {
  /** Range起始节点 */
  startContainer?: HTMLElement;
  /** range.startOffset 是一个只读属性，用于返回一个表示 Range 在 startContainer 中的起始位置的数字 */
  startOffset: number;
} = {
  startContainer: null,
  startOffset: 0
};

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
    setRangePosition(curDom);
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

  /** @name 设置光标的开始位置 */
  const setRangePosition = (curDom: HTMLElement, startOffset?: number) => {
    let dom = curDom;
    if (isEditElement(curDom) && isEditTextNode((curDom as any).firstChild)) {
      dom = (curDom as any).firstChild;
    }
    // 光标位置为开头
    currentSelection = {
      startContainer: dom,
      startOffset: startOffset || 0
    };
  };

  /** @name 备份当前光标位置 */
  const backupRangePosition = () => {
    // 用户选择的文本范围或光标的当前位置
    const selection = window.getSelection();
    // window.getSelection() 方法返回一个 Selection 对象，表示当前选中的文本范围。如果当前没有选中文本，那么 Selection 对象的 rangeCount 属性将为 0。
    if (selection && selection.rangeCount > 0) {
      // 获取当前光标
      try {
        // 获取了第一个选区
        const range = selection?.getRangeAt(0);
        /**
         * Range起始节点
         *    startContainer: range.startContainer as HTMLElement,
         * range.startOffset 是一个只读属性，用于返回一个表示 Range 在 startContainer 中的起始位置的数字。
         *    startOffset: range.startOffset
         */
        setRangePosition(range.startContainer as HTMLElement, range.startOffset);
      } catch (err) {
        console.log(err);
      }
    }
  };

  /** @name 选择插入表情图片 */
  const insertEmoji = (item: IEmojiType) => {
    const editorTextNode = getNodeOfEditorTextNode(currentSelection.startContainer);
    // 非常重要的逻辑
    if (!editorTextNode) {
      // 修正光标位置
      amendRangePosition(editRef.current, (node) => {
        if (node) {
          // 设置当前光标节点
          setRangePosition(node);
          insertEmoji(item);
        }
      });
      return;
    }
    // 创建
    const node = new Image();
    node.src = item.url;
    node.setAttribute("style", `width: ${18}px;height:${18}px`);
    // 插入表情的时候，加上唯一标识。然后再复制（onCopy事件）的时候处理图片。
    const emojiNodeKey = getElementAttributeKey("emojiNode");
    node.setAttribute(emojiNodeKey, item.name);

    if (currentSelection.startContainer?.nodeType == 3) {
      /**
       * 如果是文本节点，拆分节点
       * https://developer.mozilla.org/en-US/docs/Web/API/Text/splitText
       * */
      if (currentSelection.startContainer instanceof Text) {
        const afterNode = currentSelection.startContainer?.splitText(currentSelection.startOffset);
        // 设置光标开始节点为拆分之后节点的父级节点
        currentSelection.startContainer = afterNode.parentNode as HTMLElement;
        // 在拆分后的节点之前插入图片
        currentSelection.startContainer.insertBefore(node, afterNode);
      } else {
        console.warn("Start container is not a text node.");
      }
    } else {
      // 非文本节点
      if (currentSelection.startContainer?.childNodes.length) {
        // 如果光标开始节点下有子级，获取到光标位置的节点
        const beforeNode = currentSelection.startContainer.childNodes[currentSelection.startOffset];
        // 插入
        currentSelection.startContainer.insertBefore(node, beforeNode);
      } else {
        // 如果光标开始节点下没有子级，直接插入
        currentSelection.startContainer?.appendChild(node);
      }
    }

    // console.log(editorTextNode.childNodes);
    // 删除空文本节点，主要是因为splitText分割方法会创建一个空的文本节点
    deleteTextNodeAndEmpty(editorTextNode);
    // 判断是否存在br
    deleteTextNodeAndBrNode(currentSelection.startContainer);

    // 视图滚动带完全显示出来
    node.scrollIntoView(false);
    // 设置焦点
    setRangeNode(node, "after", async () => {
      // 重新聚焦输入框
      editRef?.current?.focus();
      // 主动触发输入框值变化
      const val = getText(editRef.current);
      // 控制提示
      setTipHolder(val == "");
      restProps.onChange?.(val);
    });
  };

  return {
    editRef,
    showTipHolder,

    setTipHolder,
    setRangePosition,
    backupRangePosition,
    clearEditor,
    init,

    insertEmoji
  };
}
