/*
 * @Date: 2024-09-30 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: 富文本输入框事件处理
 */
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

// 是否正在处理粘贴内容
let isPasteLock = false;

/** @name 处理复制事件 */
export const onCopy = (event: React.ClipboardEvent<HTMLDivElement>) => {
  // 阻止默认事件，防止复制真实发生
  event.preventDefault();

  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  if (selection.isCollapsed) {
    return;
  }

  // 获取当前光标选中的内容，我们需要吧复制的内容转换一次
  // cloneContents很关键，获取选中的文档碎片（此方法返回从Range的内容创建的DocumentFragment对象）
  const contents = selection.getRangeAt(0)?.cloneContents();

  // 将内容添加到＜div＞中，这样我们就可以获得它的内部HTML。
  const odiv = contents.ownerDocument.createElement("div");
  odiv.appendChild(contents);

  odiv.setAttribute("hidden", "true");
  contents.ownerDocument.body.appendChild(odiv);

  const content = transforms.getPlainText(odiv);

  // event.clipboardData.setData("text/html", odiv.innerHTML);
  event.clipboardData?.setData("text/plain", content);
  contents.ownerDocument.body.removeChild(odiv);
};

/** @name 处理剪切事件 */
export const onCut = (event: React.ClipboardEvent<HTMLDivElement>) => {
  event.preventDefault();
  const selection = window.getSelection();
  // 存在选区
  if (selection && !selection.isCollapsed) {
    /**
     * 1；设置复制内容
     */
    // 获取当前光标选中的内容，我们需要吧复制的内容转换一次
    // cloneContents很关键，获取选中的文档碎片（此方法返回从Range的内容创建的DocumentFragment对象）
    const contents = selection.getRangeAt(0)?.cloneContents();

    // 将内容添加到＜div＞中，这样我们就可以获得它的内部HTML。
    const odiv = contents.ownerDocument.createElement("div");
    odiv.appendChild(contents);

    odiv.setAttribute("hidden", "true");
    contents.ownerDocument.body.appendChild(odiv);

    const content = transforms.getPlainText(odiv);

    // event.clipboardData.setData("text/html", odiv.innerHTML);
    event.clipboardData?.setData("text/plain", content);
    contents.ownerDocument.body.removeChild(odiv);

    /**
     * 删除选区
     *  */
    // 后续可以拓展删除节点方法，先原生的
    document.execCommand("delete", false, undefined);
  }
};

/**
 * @name 处理换行
 */
export const handleLineFeed = (editNode: IEditorElement, callBack?: (success: boolean) => void) => {
  const range = fishRange.getRange();
  // 必须存在光标
  if (!range) return callBack(false);

  // 获取当前光标的节点
  const rangeStartContainer: any = range.startContainer;

  // 行属性节点
  const rowElementNode = util.getNodeOfEditorElementNode(rangeStartContainer);

  if (!rowElementNode) {
    // 非常重要的逻辑--修正光标位置
    fishRange.amendRangePosition(editNode, (node) => {
      if (node) {
        // 在调用自己一次
        handleLineFeed(editNode, callBack);
      }
    });
    return callBack(false);
  }

  const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(range);

  console.time("editable插入换行耗时");

  /**
   * 创建换行节点
   * @dec 把之前的节点放到需要换行的节点后面
   */
  // 创建换行节点
  const lineDom = createLineElement(true);

  if (!isEditElement(rowElementNode as HTMLElement)) {
    console.warn("无编辑行节点，不可插入");
    return callBack(false);
  }

  /**
   * 把后面的节点放到换行节点的 文本节点中
   */
  const clNodes = dom.cloneNodes(nextNodeList);

  // 存在换行元素时
  if (clNodes.length) {
    dom.toTargetAddNodes(lineDom, clNodes, false);

    dom.removeNodes(nextNodeList);
  } else {
    const br = document.createElement("br");
    dom.toTargetAddNodes(lineDom, [br]);
  }

  // 如果前面的节点不存在，后面的节点存在； 代表换行后，前面的节点是没有内容的
  if (behindNodeList.length == 0 && nextNodeList.length) {
    const br = document.createElement("br");
    dom.toTargetAddNodes(rowElementNode, [br]);
  }

  dom.toTargetAfterInsertNodes(rowElementNode, [lineDom]);

  // 第一个节点是一个文本节点
  if (lineDom.firstChild) {
    fishRange.setCursorPosition(lineDom.firstChild, "before");
    lineDom?.scrollIntoView(true);

    console.timeEnd("editable插入换行耗时");

    // 执行回调
    callBack?.(true);
    return;
  }

  console.timeEnd("editable插入换行耗时");

  callBack?.(false);
};

/**
 * @name 处理粘贴事件的内容转换
 * @param e 粘贴事件
 * @param editNode 编辑器节点
 * @param callBack 成功回调
 */
export const handlePasteTransforms = (e: ClipboardEventWithOriginalEvent, editNode: IEditorElement, callBack?: () => void) => {
  // 获取粘贴的内容
  const clp = e.clipboardData || (e.originalEvent && (e.originalEvent as any).clipboardData);
  const isFile = clp?.types?.includes("Files");
  const isHtml = clp?.types?.includes("text/html");
  const isPlain = clp?.types?.includes("text/plain");

  /**
   * @name 如果是文件
   */
  if (isFile) {
    const files = isObject(clp.files) ? Object.values(clp.files) : clp.files;
    // console.log(files);
    // 必须是图片
    const vfiles = files?.filter((item) => item.type.includes("image/"));
    // 截取前面5个文件
    const sfiles = vfiles.slice(-5);

    const promiseData = [];
    // 处理获取到的文件
    for (let i = 0; i < sfiles.length; i++) {
      const file = sfiles[i];
      promiseData.push(fileToBase64(file));
    }
    Promise.allSettled(promiseData)
      .then((res) => {
        const datas = [];
        // 请求结束后再去清除掉
        res.forEach((result) => {
          if (result.status == "fulfilled" && result.value) {
            datas.push(`data:image/jpeg;base64,${result.value}`);
          }
        });

        const nodes: HTMLSpanElement[] = [];
        datas.forEach((baseItem) => {
          // 创建一个图片容器节点
          const container = document.createElement("span");
          container.id = `${prefixNmae}image-container-` + getRandomWord();
          container.classList.add(`${prefixNmae}image-container`);

          const node = new Image();
          node.src = baseItem;
          const key = getElementAttributeKey("imgNode");
          node.setAttribute(key, "true");

          container.appendChild(node);

          const textNode = createChunkTextElement();

          nodes.push(...[createChunkSapnElement(container), textNode]);
        });

        insertNode(nodes);
      })
      .catch(() => {});
  }

  /**
   * @name 如果是文本
   */
  if ((isHtml || isPlain) && !isFile) {
    // 如果是粘贴的是文本
    const content = clp.getData("text/plain");
    // x.getSelection
    const selection = window.getSelection();
    // 把文本标签转义：如<div>[爱心]</div> 把这个文本转义为"&lt;div&lt;",
    const repContent = labelRep(content);

    if (!repContent) {
      isPasteLock = false;
      return;
    }

    if (isPasteLock) return;

    // 存在选区
    if (selection && !selection.isCollapsed) {
      // 后续可以拓展删除节点方法，先原生的
      document.execCommand("delete", false, undefined);
    }

    // 在删除完成后执行其他操作
    {
      isPasteLock = true;

      // 获取当前光标
      const range = selection?.getRangeAt(0);

      // 获取当前光标的开始容器节点
      const topElementNode = findNodetWithElement(range.startContainer);

      // 如果当前光标节点不是一个富文本元素节点，就默认指向它的第一个子节点
      if (!topElementNode) {
        // !!非常重要的逻辑
        amendRangeLastNode(editNode, (node) => {
          if (node) {
            insertText(repContent, () => {
              isPasteLock = false;
              callBack?.();
            });
          }
        });
        return;
      }

      insertText(repContent, () => {
        isPasteLock = false;
        callBack?.();
      });
    }
  }
};

/**
 * @name 键盘按键被松开时发生
 * !!! 非常重要的边角异常-处理方法
 */
export const onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>, editNode: IEditorElement) => {
  const range = fishRange.getRange();
  console.time("onKeyUp转换节点耗时");

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
   * 当前判断是富文本兜底操作。也称为 transforms 时机
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

  console.timeEnd("onKeyUp转换节点耗时");
};
