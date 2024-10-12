import { isNode, util } from ".";

import type { IEditorElement } from "../types";

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
  // 用户选择的文本范围或光标的当前位置
  const selection = window.getSelection();
  // 清除选定对象的所有光标对象
  selection?.removeAllRanges();

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
  // 是一个节点块，且不是内联块属性节点
  if (isNode.isEditElement(lastElement as HTMLElement) && !isNode.isFishInline(lastElement as HTMLElement)) {
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
