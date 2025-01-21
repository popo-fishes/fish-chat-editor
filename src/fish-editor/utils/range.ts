import isNumber from "lodash/isNumber";
import { isNode } from ".";

export interface IRange {
  /** Range starting node */
  startContainer?: Node | null;
  /** range.startOffset: It is a read-only property used to return a number representing the starting position of Range in startContainer*/
  startOffset: number;
  /** Node at the end of Range */
  endContainer: Node | null;
  /** The number of offset values in Range.EndContainer */
  endOffset: number;
  /** Read only property returns the node to which the starting position of the selection belongs */
  anchorNode: Node | null;
}

/**
 * @name Set cursor position
 * @param referenceNode Reference node
 * @param type
 * @param startOffset
 * @param endOffset
 */
export const setCursorPosition = (referenceNode: Node, type?: "before" | "after", startOffset?: number, endOffset?: number): Range | null => {
  if (!isNode.isDOMNode(referenceNode)) return null;
  // No transmission, return directly
  if (!type && !isNumber(startOffset) && !isNumber(endOffset)) return null;
  try {
    const selection = getSelection();
    const range = document.createRange();
    if (isNumber(startOffset) || isNumber(endOffset)) {
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
    console.warn(err);
    return null;
  }
};

export const getRange = (): IRange | null => {
  const selection = window.getSelection();

  if (!selection || selection?.rangeCount == 0) {
    return null;
  }

  try {
    const range = selection.getRangeAt(0);

    if (!range) return null;

    return {
      startContainer: range.startContainer || null,
      startOffset: range.startOffset || 0,
      endContainer: range.endContainer || null,
      endOffset: range.endOffset || 0,
      anchorNode: selection.anchorNode
    } as IRange;
  } catch (err) {
    return null;
  }
};

export const getSelection = () => {
  return window.getSelection() || null;
};

export const isSelected = () => {
  const selection = getSelection();
  return !selection?.isCollapsed;
};

export const removeAllRanges = () => {
  const selection = getSelection();
  selection?.removeAllRanges?.();
};

export const selectNode = (node: Node) => {
  const range = document.createRange();
  if (node) {
    range.selectNode(node);
  }

  const selection = getSelection();
  selection?.removeAllRanges();

  selection.addRange(range);
};
