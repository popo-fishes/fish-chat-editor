import { isNode, util } from ".";

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

/** @name 把光标指向元素节点, 并把位置设置为0，0 */
export const setCursorNode = (node: HTMLElement) => {
  if (!node) return;
  const selection = window.getSelection();
  const range = document.createRange();
  // 清空当前文档中的选区
  selection?.removeAllRanges();

  node?.scrollIntoView(true);
  // 设置光标位置
  range.setStart(node, 0);
  range.setEnd(node, 0);
  // 添加新光标
  selection?.addRange(range);
};

/** @name 设置当前光标在某个节点的位置 */
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

/** @name 修正光标的位置，把光标指向到富文本节点的最后一个字符上 */
export const amendRangeLastNode = (editNode: IEditorElement, callBack?: (node?: HTMLElement) => void) => {
  // 获取页面的选择区域
  const selection: any = window.getSelection();
  if (!editNode || !editNode.childNodes) return callBack?.();

  let lastElement = null;

  if (selection && selection.rangeCount >= 0) {
    lastElement = editNode.childNodes[editNode.childNodes.length - 1];

    if (!lastElement) {
      console.warn("富文本不存在节点，请排查问题");
      callBack?.();
      return;
    }

    // 创建 Range 对象
    const range = document.createRange();

    // 将 Range 对象的起始位置和结束位置都设置为节点的尾部
    range.selectNodeContents(lastElement);
    // 参数一个布尔值： true 折叠到 Range 的 start 节点，false 折叠到 end 节点。如果省略，则默认为 false
    range.collapse(false);

    // 将 Range 对象添加到 Selection 中
    selection.removeAllRanges();
    selection.addRange(range);
  }
  return callBack?.(lastElement);
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
    const dom = util.getElementBelowTextNode(lastElement as HTMLElement);

    if (dom) {
      // 创建 Range 对象
      const range = document.createRange();
      // 将 Range 对象的起始位置和结束位置都设置为节点的尾部
      range.selectNodeContents(dom);
      // 参数一个布尔值： true 折叠到 Range 的 start 节点，false 折叠到 end 节点。如果省略，则默认为 false
      range.collapse(false);

      // 将 Range 对象添加到 Selection 中
      selection.removeAllRanges();
      selection.addRange(range);

      callBack?.(dom);
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
