/*
 * @Date: 2024-10-12 13:45:55
 * @Description: Modify here please
 */
import { useRef, useState } from "react";
import type { IEmojiType, IEditableProps, IEditorElement } from "../../types";

import { base, isNode, util, range, editor, IRange, dom } from "../../core";

const { createLineElement, getElementAttributeKey, createChunkEmojilement } = base;
const { isEditElement, isEditTextNode } = isNode;
const { deleteTextNodeOfEmptyNode, deleteTargetNodeOfBrNode } = util;
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
    dom.toTargetAddNodes(editRef.current, [node]);
    // 设置提示
    setTipHolder(true);
    return node;
  };

  /** @name 设置光标的位置 */
  const setRangePosition = (curDom: HTMLElement, startOffset: number, isReset?: boolean) => {
    let dom = curDom;
    if (isNode.isEditElement(curDom) && isReset) {
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
    const editorElementNode = util.getNodeOfEditorElementNode(currentRange.startContainer);
    // 非常重要的逻辑
    if (!editorElementNode) {
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
    const node = base.createChunkEmojilement(item.url, 18, 18, item.name);
    editor.insertNode([node], currentRange);
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
