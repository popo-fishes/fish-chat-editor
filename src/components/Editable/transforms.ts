import isObject from "lodash/isObject";

import { regContentImg, labelRep } from "../../utils";

import { dom, isNode, range as fishRange, editor, helper, util, base, transforms } from "../../core";

import type { IEditorElement } from "../../types";

const { isFishInline, isEditTextNode, isEmojiImgNode, isDOMText, isEmptyEditNode, isEditElement } = isNode;

const {
  getNodeOfEditorElementNode,
  getNodeOfEditorInlineNode,
  getNodeOfEditorTextNode,
  getNodeOfChildTextNode,
  rewriteEmbryoTextNode,
  deleteTargetNodeOfBrNode,
  deleteTextNodeOfEmptyNode,
  findNodetWithElement
} = util;

const { createLineElement, createChunkTextElement, getElementAttributeKey, prefixNmae, zeroWidthNoBreakSpace, createChunkSapnElement } = base;

const { insertText, insertNode } = editor;

const { fileToBase64, getRandomWord } = helper;

export const transformsEditNodes = (editNode: IEditorElement) => {
  const range = fishRange.getRange();
  console.time("transforms转换节点耗时");

  // 子节点是否只有一个br节点
  function hasParentOnlyBr(node) {
    if (node) {
      if (node.childNodes && node.childNodes?.length == 1) {
        if (node.childNodes[0]?.nodeName == "BR") return true;
      }
    }
    return false;
  }

  /** 处理节点带有style属性时，也需要标记 */
  function hasTransparentBackgroundColor(node) {
    try {
      if (node.style && node.style?.backgroundColor) return true;
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * !!重要
   * @name 当前编辑器节点下面具有非编辑器文本属性的节点
   */
  const isNodeWithNotTextNode = (node) => {
    if (!node) return false;
    if (!node.childNodes) return false;
    if (!node.childNodes.length) return false;

    // 只有一个文本节点，且是一个空的br，直接返回
    if (node.childNodes.length == 1) {
      if (hasParentOnlyBr(node)) return false;
    }

    let exist = false;
    for (const cld of node.childNodes) {
      if (hasTransparentBackgroundColor(cld)) {
        exist = true;
        break;
      }
    }

    return exist;
  };

  /**
   * bug1:
   * 获取当前光标的行编辑节点，查询是否存在不符合编辑节点格式的节点，然后重写它。
   * 这种情况常出现在： 按键 删除行-富文本自动合并行时，会主动创建一些自定义标签
   * 比如：<span style="background-color: transparent;">345</span>
   */
  if (range && range?.startContainer) {
    // 获取行编辑节点
    const editorRowNode = util.getNodeOfEditorElementNode(range.startContainer);

    if (editorRowNode && isNodeWithNotTextNode(editorRowNode)) {
      // console.log(editorRowNode.childNodes);
      /**
       * 必须用Array.from包裹下childNodes，不然导致for渲染不如预期的次数
       * 遍历行节点集合
       */
      const nodes: any[] = Array.from(editorRowNode.childNodes);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as any;

        // 按键 删除行-富文本自动合并行时，会主动创建一些自定义标签
        // const isFlag = !isEditTextNode(node) && !isFishInline(node) && node.nodeName == "SPAN";
        // if (isFlag) {
        //   rewriteEmbryoTextNode(node as HTMLElement);
        // }

        // 删除编辑器行内节点的样式
        if (hasTransparentBackgroundColor(node) && node.nodeName == "SPAN") {
          node.style.removeProperty("background-color");
        }

        // 有其它节点就删除br
        if (node.nodeName === "BR" && nodes.length > 1) {
          node.remove();
        }
      }
    }
  }

  /**
   * bug2:
   * 判断editNode的第一个子节点是否是行编辑节点，如果不是, 那就添加行编辑节点
   * 主要解决骚操作删除内容时，把editNode下面的全部行编辑节点删完了
   * 兜底处理,防止骚操作
   */
  if (!isEditElement(editNode.firstChild as any)) {
    // 创建一个编辑器--行节点
    const lineDom = base.createLineElement(false);
    dom.toTargetAddNodes(editNode as any, [base.createLineElement(false)]);
    // 设置光标
    if (lineDom.firstChild) {
      fishRange.setCursorPosition(lineDom.firstChild, "after");
    }
  }

  /**
   * bug3:
   * 主要解决删除行编辑节点时，把行编辑内容删完了，然后导致行编辑节点没有文本节点
   * 1：这种情况通常出现在换行后，比如对第二行输入值了，然后删除,当删除到了第一个节点没内容了就会被搞一个空节点。
   */
  // if (range && range?.startContainer) {
  //   // 光标节点不是一个文本节点 && 是一个编辑器块属性节点  && 只有一个子节点且还是一个br标签
  //   if (!getNodeOfChildTextNode(range.startContainer) && isEditElement(range.startContainer as any) && hasParentOnlyBr(range.startContainer)) {
  //     const textNode = base.createChunkTextElement(false);
  //     dom.toTargetAddNodes(range.startContainer as any, [textNode]);
  //     // 设置光标
  //     if (textNode.firstChild) {
  //       setCursorPosition(textNode.firstChild, "after");
  //     }
  //   }
  // }

  console.timeEnd("transforms转换节点耗时");
};
