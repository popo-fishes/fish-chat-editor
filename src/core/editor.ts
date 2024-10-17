/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { regContentImg } from "../utils";
import { helper, base, dom, isNode, util, range as fishRange, transforms } from ".";

import type { IRange } from "./range";
import type { IEditorElement } from "../types";

const { getRangeAroundNode, toTargetAddNodes, removeNodes, cloneNodes, toTargetAfterInsertNodes } = dom;
const { isDOMElement, isDOMNode } = isNode;

const { getNodeContent, handleEditNodeTransformsValue } = transforms;
/**
 * @name 获取当前编辑器的纯文本内容
 * @param editNode 富文本节点
 * @returns
 */
export const getText = (editNode: IEditorElement): string => {
  if (!editNode || !isDOMNode(editNode)) return "";

  const contents = editNode.cloneNode(true);

  const odiv = document.createElement("div");

  for (const childNode of Array.from(contents.childNodes)) {
    odiv.appendChild(childNode as Node);
  }

  odiv.setAttribute("hidden", "true");

  // 将内容添加到＜div＞中，这样我们就可以获得它的内部HTML。
  contents.ownerDocument.body.appendChild(odiv);

  let contentResult = handleEditNodeTransformsValue(odiv);

  contents.ownerDocument.body.removeChild(odiv);

  return contentResult.join("\n");
};

/** @name 设置文本值 */
export const setText = (editNode: IEditorElement, content: string, callBack?: () => void) => {
  if (!content || !editNode) return callBack?.();
  // 把光标设置在富文本内容的最后一行的最后一个位置
  fishRange.amendRangePosition(editNode, () => {
    insertText(content, () => callBack?.());
  });
};

/**
 * todo
 * @name 获取非格式化的html
 * @param editNode 富文本节点
 * @returns
 */
export const getHtml = (editNode: IEditorElement): string => {
  if (!editNode || !isDOMNode(editNode)) return "";

  const contents = editNode.cloneNode(true);

  const odiv = document.createElement("div");

  for (const childNode of Array.from(contents.childNodes)) {
    odiv.appendChild(childNode as Node);
  }

  odiv.setAttribute("hidden", "true");

  // 将内容添加到＜div＞中，这样我们就可以获得它的内部HTML。
  contents.ownerDocument.body.appendChild(odiv);

  let contentResult = handleEditNodeTransformsValue(odiv);

  contents.ownerDocument.body.removeChild(odiv);

  return contentResult.join("\n");
};

/**
 * @name 在选区插入文本
 * 核心方法之一
 */
export const insertText = (content: string, callBack?: () => void) => {
  if (!content) return callBack?.();

  const splitNodes = (startContainer: any, node) => {
    startContainer.insertAdjacentElement("afterend", node);
  };

  console.time("editable插入内容耗时");

  // 获取页面的选择区域
  const selection = window.getSelection();

  // 获取当前光标
  const range = selection?.getRangeAt(0);

  // 必须存在光标
  if (!selection || selection?.rangeCount == 0 || !range) {
    console.timeEnd("editable插入内容耗时");
    callBack?.();
    return;
  }

  // 获取当前光标的开始容器节点
  const topElementNode: any = util.findNodetWithElement(range.startContainer);
  // console.log(topElementNode, range);
  // 如果当前节点的最顶级节点不是一个富文本内容节点：element  直接返回
  if (!topElementNode) {
    console.warn("选区的容器节点不属于富文本节点");
    console.timeEnd("editable插入内容耗时");
    callBack?.();
    return;
  }

  /** 处理内容插入 */
  {
    const lines = content.split(/\r\n|\r|\n/);

    // 是否需要进行分割
    let split = false;
    // 初始化光标节点的顶级节点，在遍历时会不停地更新它
    let initialNode = topElementNode;
    // 需要插入的第一个节点(没有被真正插入到dom，只用到了它的子节点去合并光标位置的节点)
    let firstNode: any = null;
    // 需要插入节点的最后一个节点（如果需要插入节点只有一个，那么这个值和第一个节点 相同）
    let lastNode: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 把表情文本转换为图片,
      const htmlNodeStr = regContentImg(line);
      const node = base.createLineElement();

      if (htmlNodeStr) {
        node.innerHTML = htmlNodeStr;
      }

      if (i === lines.length - 1) {
        lastNode = node;
      }

      if (split) {
        splitNodes(initialNode, node);
        initialNode = node;
      } else {
        split = true;
        firstNode = node;
      }
    }

    // 获取当前光标位置的元素节点 前面的节点 和 后面的节点
    const [behindNodeList, nextNodeList] = getRangeAroundNode();

    /** 给最后一个节点加入一个i标签方便我们插入内容后，设置光标的焦点位置 */
    const keyId = "editorFocusHack" + new Date().getTime() + helper.getRandomWord();
    const iElement = document.createElement("i");
    iElement.id = keyId;

    // 如果第一个插入的节点和最后一个插入的节点是 相同的，代表是插入一个节点， 如果是一个节点，就把标签插入到第一个节点
    if (firstNode === lastNode) {
      firstNode.appendChild(iElement);
    } else {
      lastNode.appendChild(iElement);
    }

    /** 处理原始光标行位置节点的内容 */
    {
      // 获取焦点节点文本是空文本
      const content = getNodeContent(topElementNode);

      if (content == "\n" || content == "") {
        if (isDOMElement(firstNode)) {
          // 直接把第一个插入的节点内容 赋值给 当前光标节点的顶级富文本节点
          toTargetAddNodes(topElementNode, cloneNodes(firstNode.childNodes));
        }
      } else {
        // 不是空

        // 1. 在当前光标前面节点数组中，找到最后一个节点，在最后一个节点的后面插入节点
        const firstContent = getNodeContent(firstNode);

        if (firstContent !== "\n" && firstContent !== "") {
          const prevLast = behindNodeList[0];
          if (prevLast) {
            toTargetAfterInsertNodes(prevLast, cloneNodes(firstNode.childNodes));
          } else {
            /**
             * 如果光标位置的后面没节点, 则选择光标后面的一个节点，然后插入节点
             */
            if (nextNodeList[0]) {
              const nodes: any = Array.from(cloneNodes(firstNode.childNodes));
              const fragment = new DocumentFragment();
              for (let i = 0; i < nodes.length; i++) {
                fragment.appendChild(nodes[i]);
              }
              topElementNode.insertBefore(fragment, nextNodeList[0]);
            }
          }
        }

        /**
         * 2.1 如果第一个插入的节点和最后一个插入的节点是 相同的，代表是插入一个节点, 如果是一个节点，就不能去删除原始节点后面的节点，因为没有换行。
         * 2.2 我们这里判断如果不是一个节点，那么就删除后面的节点
         */
        if (firstNode !== lastNode) {
          // 1: 把后面的节点放到 插入的尾部节点中
          if (nextNodeList.length) {
            // 插入的尾部节点中
            toTargetAddNodes(lastNode, cloneNodes(nextNodeList), false);
            /**
             * 如果我添加的节点本身没有内容，就需要先清空节点吧BR标签删除掉
             * 没有内容lastNode会只带一个 br标签子节点，如果不处理，会导致有2行的BUG视觉效果
             */
            util.judgeEditRowNotNull(lastNode);
            // 删除原始节点中的换行部分的节点
            removeNodes(nextNodeList);
          }
        }
      }
    }

    // console.log(behindNodeList, nextNodeList);
    // console.log(
    //   // 原始光标节点
    //   topElementNode,
    //   // 需要插入的第一个节点(没有被真正插入到dom，只用到了它的子节点去合并光标位置的节点)
    //   firstNode,
    //   // 需要插入的最后一个节点
    //   lastNode
    // );

    // 设置光标的位置
    {
      // 获取光标节点
      const focusNode = document.getElementById(keyId) as any;

      focusNode?.scrollIntoView(true);
      // 设置光标
      setRangeNode(focusNode, "after", () => {
        // 删除节点
        focusNode?.remove();
        // 执行回调
        callBack?.();
      });
    }
  }

  console.timeEnd("editable插入内容耗时");
};

/**
 * @name 在目标位置插入节点（目前是图片）
 * @param nodes 节点集合
 * @param range 光标信息
 * @param callBack 回调（success?）=> void
 * @returns
 */
export const insertNode = (nodes: HTMLElement[], range: IRange, callBack?: (success: boolean) => void) => {
  if (!nodes || nodes?.length == 0) return callBack?.(false);

  // 不存在光标
  if (!range) {
    callBack?.(false);
    return;
  }

  const rowElementNode: any = util.getNodeOfEditorElementNode(range.startContainer);

  if (!rowElementNode) {
    console.warn("无编辑行节点，不可插入");
    callBack?.(false);
    return;
  }

  console.time("editable插入节点耗时");

  // 获取当前光标位置的元素节点 前面的节点 和 后面的节点
  const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(range);

  if (nodes.length == 0) {
    console.timeEnd("editable插入节点耗时");
    callBack?.(false);
    return;
  }

  /** 处理内容 */
  {
    // 当前行编辑节点没有节点
    if (behindNodeList.length == 0 && nextNodeList.length == 0) {
      dom.toTargetAddNodes(rowElementNode, nodes);
    } else if (behindNodeList.length) {
      // 判断前面有节点
      dom.toTargetAfterInsertNodes(behindNodeList[0], nodes);
    } else if (nextNodeList.length) {
      // 判断后面有节点
      dom.toTargetBeforeInsertNodes(nextNodeList[0], nodes);
    }
  }

  console.timeEnd("editable插入节点耗时");

  // 设置光标的位置
  {
    const referenceNode = nodes[nodes.length - 1] as any;
    if (referenceNode) {
      referenceNode?.scrollIntoView(true);
      fishRange.setCursorPosition(referenceNode, "after");
      callBack?.(true);
    }
  }

  callBack?.(false);
};
