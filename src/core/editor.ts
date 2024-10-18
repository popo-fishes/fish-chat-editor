/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { regContentImg } from "../utils";
import { helper, base, dom, isNode, util, range as fishRange, transforms } from ".";

import type { IRange } from "./range";

const { toTargetAddNodes, removeNodes, cloneNodes, toTargetAfterInsertNodes } = dom;
const { isDOMElement, isDOMNode } = isNode;

const { getEditElementContent, handleEditNodeTransformsValue } = transforms;
/**
 * @name 当前编辑器是一个空节点？
 * @returns boolean
 */
export const isEmptyEditorNode = () => {
  const editorNode = util.getEditorInstance();
  if (!editorNode || !editorNode?.childNodes) return true;
  // 子节点大于1返回false，代表不是空
  if (editorNode?.childNodes && editorNode?.childNodes.length > 1) {
    return false;
  }
  // 获取纯文本内容，有内容返回false，没内容返回true
  if (!getText()) return true;

  return false;
};

/**
 * @name 获取当前编辑器的纯文本内容
 * @param editorNode 富文本节点
 * @returns
 */
export const getText = (): string => {
  const editorNode = util.getEditorInstance();

  if (!editorNode || !isDOMNode(editorNode)) return "";

  const contents = editorNode.cloneNode(true);

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
 * @param editorNode 富文本节点
 * @returns
 */
export const getHtml = (): string => {
  const editorNode = util.getEditorInstance();

  if (!editorNode || !isDOMNode(editorNode)) return "";

  const contents = editorNode.cloneNode(true);

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
 * @param content 内容
 * @param range 光标信息
 * @param callBack 回调（success?）=> void
 * @param showCursor 插入成功后是否需要设置光标
 * @returns
 */
export const insertText = (content: string, range: IRange, callBack?: (success: boolean) => void, showCursor?: boolean) => {
  if (!content || !range) {
    callBack?.(false);
    return;
  }

  const splitNodes = (startContainer: any, node) => {
    dom.toTargetAfterInsertNodes(startContainer, [node]);
  };

  // 获取当前光标的行编辑节点
  const rowElementNode: any = util.getNodeOfEditorElementNode(range.startContainer);

  if (!rowElementNode) {
    console.warn("无编辑行节点，不可插入");
    callBack?.(false);
    return;
  }

  console.time("editable插入内容耗时");

  // 获取当前光标位置的元素节点 前面的节点 和 后面的节点
  const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(range);

  console.log(behindNodeList, nextNodeList);

  /** 处理内容插入 */
  {
    const lines = content.split(/\r\n|\r|\n/);

    // 是否需要进行分割
    let split = false;
    // 初始化光标节点的顶级节点，在遍历时会不停地更新它
    let initialNode = rowElementNode;
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
      const content = transforms.getEditElementContent(rowElementNode);

      if (content == "\n" || content == "") {
        if (isDOMElement(firstNode)) {
          // 直接把第一个插入的节点内容 赋值给 当前光标节点的顶级富文本节点
          dom.toTargetAddNodes(rowElementNode, cloneNodes(firstNode.childNodes));
        }
      } else {
        // 不是空
        /**
         * 1. 在当前光标前面节点数组中，找到最后一个节点，在最后一个节点的后面插入节点
         */
        // 获取第一个插入节点的文本内容
        const firstContent = getEditElementContent(firstNode);
        // 不是空文本
        if (firstContent !== "\n" && firstContent !== "") {
          // 获取前面节点的最后一个节点
          const prevLast = behindNodeList[0];
          if (prevLast) {
            dom.toTargetAfterInsertNodes(prevLast, cloneNodes(firstNode.childNodes));
          } else {
            /**
             * 如果光标位置的之前没节点, 则选择光标之后的第一个节点，然后插入节点
             */
            if (nextNodeList[0]) {
              const nodes: any = Array.from(cloneNodes(firstNode.childNodes));
              const fragment = new DocumentFragment();
              for (let i = 0; i < nodes.length; i++) {
                fragment.appendChild(nodes[i]);
              }
              rowElementNode.insertBefore(fragment, nextNodeList[0]);
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
            dom.toTargetAddNodes(lastNode, cloneNodes(nextNodeList), false);
            // /**
            //  * 如果我添加的节点本身没有内容，就需要先清空节点吧BR标签删除掉
            //  * 没有内容lastNode会只带一个 br标签子节点，如果不处理，会导致有2行的BUG视觉效果
            //  */
            // util.judgeEditRowNotNull(lastNode);
            // 删除原始节点中的换行部分的节点
            dom.removeNodes(nextNodeList);
          }
        }
      }
    }

    console.timeEnd("editable插入内容耗时");

    // 设置光标的位置
    {
      const focusNode = document.getElementById(keyId) as any;

      // 设置光标
      if (showCursor) {
        focusNode?.scrollIntoView(true);
        fishRange.setCursorPosition(focusNode, "after");
      }
      // 删除节点
      focusNode?.remove();

      callBack?.(true);
    }
  }
  return;
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
      return;
    }
  }

  callBack?.(false);
  return;
};
