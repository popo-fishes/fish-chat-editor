/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: 工具方法
 */
import { regContentImg } from "../utils";

import { helper, base, dom, isNode, util, range } from ".";

import type { IEditorElement } from "../types";

const { createLineElement } = base;
const { getRangeAroundNode, addTargetElement, removeNode, cloneNodes, insertBeforeNode } = dom;
const { isDOMElement, isDOMNode } = isNode;
const { getNodeContent, findNodetWithElement, handleEditNodeTransformsValue, judgeEditRowNotNull } = util;
const { setRangeNode } = range;

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

  console.log(contentResult);
  return contentResult.join("\n");
};

/**
 * @name 除去字符串空格换后是否为一个空文本，如果是直接赋值为空，否则用原始的
 * 常用于获取富文本值后，判断是否全部是空格 和 换行，如果是就给字符串置空
 */
export const editTransformSpaceText = (content: string) => {
  // 删除所有换行
  const cStr = content.replace(/\s/g, "");
  // 去掉所有的换行
  const lStr = cStr.replace(/\n/g, "");

  // 删除全部的换行和空格，得到一个 空字符，直接用空字符串作为值
  if (lStr == "") {
    content = "";
  }

  return content;
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
  const topElementNode: any = findNodetWithElement(range.startContainer);
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
      const node = createLineElement();

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
    const keyId = "editorFocusHack" + new Date().getTime() + helper.getRandomWord(4);
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
          addTargetElement(topElementNode, cloneNodes(firstNode.childNodes));
        }
      } else {
        // 不是空

        // 1. 在当前光标前面节点数组中，找到最后一个节点，在最后一个节点的后面插入节点
        const firstContent = getNodeContent(firstNode);

        if (firstContent !== "\n" && firstContent !== "") {
          const prevLast = behindNodeList[0];
          if (prevLast) {
            insertBeforeNode(prevLast, cloneNodes(firstNode.childNodes));
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
            addTargetElement(lastNode, cloneNodes(nextNodeList), false);
            /**
             * 如果我添加的节点本身没有内容，就需要先清空节点吧BR标签删除掉
             * 没有内容lastNode会只带一个 br标签子节点，如果不处理，会导致有2行的BUG视觉效果
             */
            judgeEditRowNotNull(lastNode);
            // 删除原始节点中的换行部分的节点
            removeNode(nextNodeList);
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

/** @name 设置文本值 */
export const setText = (editNode: IEditorElement, content: string, callBack?: () => void) => {
  if (!content || !editNode) return callBack?.();
  // 把光标设置在富文本内容的最后一行的最后一个位置
  amendRangeLastNode(editNode, () => {
    insertText(content, () => callBack?.());
  });
};

/** @name 在选区插入节点（目前是图片） */
export const insertNode = (nodes: HTMLElement[], callBack?: () => void) => {
  if (!nodes || nodes?.length == 0) return callBack?.();

  console.time("editable插入节点耗时");

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
  const topElementNode: any = findNodetWithElement(range.startContainer);

  // 如果当前节点的最顶级节点不是一个富文本内容节点：element  直接返回
  if (!topElementNode) {
    console.warn("选区的容器节点不属于富文本节点");
    console.timeEnd("editable插入内容耗时");
    callBack?.();
    return;
  }

  // 获取当前光标位置的元素节点 前面的节点 和 后面的节点
  const [behindNodeList, nextNodeList] = getRangeAroundNode();

  /** 处理原始光标行位置节点的内容 */
  {
    // 获取焦点节点文本是空文本
    const content = getNodeContent(topElementNode);

    if (content == "\n" || content == "") {
      // 直接把第一个插入的节点内容 赋值给 当前光标节点的顶级富文本节点
      addTargetElement(topElementNode, nodes);
    } else {
      // 不是空

      // 1. 在当前光标前面节点数组中，找到最后一个节点，在最后一个节点的后面插入节点
      const prevLast = behindNodeList[0];
      if (prevLast) {
        insertBeforeNode(prevLast, nodes);
      } else {
        /**
         * 如果光标位置的后面没节点, 则选择光标后面的一个节点，然后在它的前面插入节点
         */
        if (nextNodeList[0]) {
          const fragment = new DocumentFragment();
          for (let i = 0; i < nodes.length; i++) {
            fragment.appendChild(nodes[i]);
          }
          topElementNode.insertBefore(fragment, nextNodeList[0]);
        }
      }
    }
  }

  // 设置光标的位置
  {
    // 获取光标节点
    const focusNode = nodes[nodes.length - 1] as any;

    focusNode?.scrollIntoView(true);
    // 设置光标
    setRangeNode(focusNode, "after", () => {
      // 执行回调
      callBack?.();
    });
  }

  console.timeEnd("editable插入节点耗时");
};
