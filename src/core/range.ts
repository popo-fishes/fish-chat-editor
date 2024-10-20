import isNumber from "lodash/isNumber";
import { isNode } from ".";

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
  try {
    const selection = getSelection();
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
  } catch (err) {
    console.error(err);
    return null;
  }
};

/**
 * @name 获取当前文档中用户选择的文本范围（range）对象
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
 * @name 是否有选中的文本 和 元素
 *  Selection.isCollapsed 只读属性返回一个布尔值，表示当前是否有任何文本被选中。
 * 当选定内容的起点和终点位于内容中的同一位置时，没有选定文本
 * 如果返回true，表示选择范围折叠；如果返回false，表示选择范围没有折叠，有一定的文本被选中
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

/**
 * @name 选中一个节点
 */
export const selectNode = (node: Node) => {
  const range = document.createRange();
  if (node) {
    range.selectNode(node);
  }

  const selection = getSelection();
  selection?.removeAllRanges();

  selection.addRange(range);
};
