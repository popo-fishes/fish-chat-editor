import isNumber from "lodash/isNumber";
import { isNode } from ".";

import type { IEditorElement } from "../types";

export interface IRange {
  /** Range起始节点 */
  startContainer?: Node | null;
  /** range.startOffset 是一个只读属性，用于返回一个表示 Range 在 startContainer 中的起始位置的数字 */
  startOffset: number;
  /** Range终点的节点 */
  endContainer: Node | null;
  /** 只读属性 Range.endOffset 返回代表 Range 结束位置在 Range.endContainer 中的偏移值的数字 */
  endOffset: number;
  /** 只读属性返回选区开始位置所属的节点 */
  anchorNode: Node | null;
}

/**
 * @name 设置光标位置
 * @param referenceNode 参考的节点
 * @param type 把光标设置在参考节点的前面还是后面
 * @param startOffset 开始位置算起的偏移量
 * @param endOffset 结束位置算起的偏移量
 */
export const setCursorPosition = (referenceNode: Node, type?: "before" | "after", startOffset?: number, endOffset?: number): Range | null => {
  if (!isNode.isDOMNode(referenceNode)) return null;
  // 都不传递直接返回
  if (!type && !isNumber(startOffset) && !isNumber(endOffset)) return null;

  const selection = window.getSelection();
  const range = document.createRange();

  // 适用于文本
  if (isNumber(startOffset) || isNumber(endOffset)) {
    // 设置 Range
    isNumber(startOffset) && range.setStart(referenceNode, startOffset);
    isNumber(endOffset) && range.setEnd(referenceNode, endOffset);
  } else {
    if (type == "after") {
      range.setStartAfter(referenceNode);
    }
    if (type == "before") {
      range.setStartBefore(referenceNode);
    }
  }

  selection?.removeAllRanges();

  selection?.addRange(range);

  return range;
};

/**
 * @name 设置当前光标在某个节点的位置
 * @deprecated 废弃-不会使用了
 */
export const setRangeNode = (node: HTMLElement, type: "before" | "after", callBack?: () => void) => {
  if (!node) return callBack?.();
  const selection = getSelection();
  if (selection) {
    // 清除选定对象的所有光标对象
    removeAllRanges();
  }
  try {
    // 创建新的光标对象
    const range = document.createRange();
    // setStartAfter方法在指定的节点之后开始范围(指定的节点之后开始范围)
    type == "after" && range.setStartAfter(node);
    // setStartBefore方法在指定的节点之前开始范围(指定的节点之前开始范围)
    type == "before" && range.setStartBefore(node);
    // 使光标开始和光标结束重叠
    range.collapse(true);
    // 插入新的光标对象
    selection?.addRange(range);
    // 执行回调
    callBack?.();
  } catch (err) {
    console.error(err);
    callBack?.();
  }
};

/**
 * @name 修正光标的位置
 */
export const amendRangePosition = (editNode: IEditorElement, callBack?: (node?: HTMLElement) => void) => {
  // 获取页面的选择区域
  const selection: any = window.getSelection();
  if (!editNode || !editNode.childNodes) return callBack?.();

  let lastElement = editNode.childNodes[editNode.childNodes.length - 1];

  if (!lastElement) {
    console.warn("富文本不存在节点，请排查问题");
    return;
  }
  // 是一个节点块
  if (isNode.isEditElement(lastElement as HTMLElement)) {
    const referenceElement = lastElement.firstChild;

    if (referenceElement) {
      // 创建 Range 对象
      const range = document.createRange();
      // 将 Range 对象的起始位置和结束位置都设置为节点的尾部
      range.selectNodeContents(referenceElement);
      // 参数一个布尔值： true 折叠到 Range 的 start 节点，false 折叠到 end 节点。如果省略，则默认为 false
      range.collapse(false);

      // 将 Range 对象添加到 Selection 中
      selection.removeAllRanges();
      selection.addRange(referenceElement);

      callBack?.(referenceElement as HTMLElement);
      return;
    }
  }
  console.warn("富文本不存在节点，请排查问题");
};

/**
 * @name 获取光标的信息
 */
export const getRange = (): IRange | null => {
  // 光标的信息
  let currentRange: IRange = {
    startContainer: null,
    startOffset: 0,
    endContainer: null,
    endOffset: 0,
    anchorNode: null
  };

  // 获取页面的选择区域
  const selection = window.getSelection();

  // 不存在选区， 返回选区（selection）中范围（range）数量的只读属性
  if (!selection || selection?.rangeCount == 0) {
    return null;
  }

  try {
    // 获取当前光标
    const range = selection.getRangeAt(0);
    if (!range) return null;

    currentRange = {
      // Range起始节点
      startContainer: range.startContainer || null,
      startOffset: range.startOffset || 0,
      endContainer: range.endContainer || null,
      endOffset: range.endOffset || 0,
      anchorNode: selection.anchorNode
    };

    return currentRange;
  } catch (err) {
    return null;
  }
};

/**
 * @name 获取页面中的文本选区
 */
export const getSelection = () => {
  return window.getSelection() || null;
};

/**
 * @name 是否有光标选中的文本 和 元素
 *  Selection.isCollapsed 只读属性返回一个布尔值，表示当前是否有任何文本被选中。
 * 当选定内容的起点和终点位于内容中的同一位置时，没有选定文本
 */
export const isSelected = () => {
  const selection = getSelection();
  return !selection?.isCollapsed;
};

/**
 * @name 清除选定对象的所有光标对象
 */
export const removeAllRanges = () => {
  const selection = getSelection();
  // 清除选定对象的所有光标对象
  selection?.removeAllRanges?.();
};
