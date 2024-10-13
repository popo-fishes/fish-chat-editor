/*
 * @Date: 2024-09-30 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: 富文本输入框事件处理
 */
import isObject from "lodash/isObject";

import { regContentImg, labelRep } from "../../utils";

import { dom, isNode, range as fishRange, editor, helper, util, base, transforms } from "../../core";

import type { IEditorElement } from "../../types";

const { setRangeNode, setCursorNode, amendRangeLastNode, amendRangePosition, getRange } = fishRange;

const { isFishInline, isEditTextNode, isEmojiImgNode, isDOMText, isEmptyEditNode, isEditElement } = isNode;

const {
  getNodeOfEditorRowNode,
  getNodeOfEditorInlineNode,
  getNodeOfEditorTextNode,
  getNodeOfChildTextNode,
  rewriteEmbryoTextNode,
  deleteTargetNodeOfBrNode,
  findNodetWithElement
} = util;

const { createLineElement, createChunkTextElement, getElementAttributeKey, prefixNmae, createChunkSapnElement } = base;

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
 *  @name 处理输入框的值
 * @deprecated 废弃-不会使用了
 * 把输入的文字转换成图片
 */
export const handleInputTransforms = (editNode: IEditorElement, callBack: () => void) => {
  // 获取当前文档中的选区
  const selection = window.getSelection();

  // 获取当前光标
  const range = selection?.getRangeAt(0);

  // 必须存在光标
  if ((selection && selection.rangeCount == 0) || !range) return callBack();

  // console.log(range);

  // 返回光标节点的共有祖先节点(表示选中范围所在的最小公共祖先节点。这个节点是指包含了所有选中文本的最小的节点，可以是文本节点、元素节点或文档节点。)
  const currNode: any = range.commonAncestorContainer;

  // 没有找到当前节点  || 当前节点不存在文本内容，代表不是文本节点，直接返回
  if (!isDOMText(currNode) || !currNode?.nodeValue) return callBack();

  // 根据当前光标位置，找到对应文本位置，因为这个位置代表新插入的内容结束位置
  const end = selection?.focusOffset;

  // 光标在当前节点中前面的内容
  let beforeText = currNode.nodeValue.substring(0, end);
  // 光标在当前节点中后面的内容
  const afterText = currNode.nodeValue.substring(end as any);

  // 把当前光标位置内容前面拼接 上 一个I 标签，有利于我们后面去定位光标位置。
  const keyId = "editorFocusHack" + new Date().getTime() + getRandomWord();
  // 我们这里先给个唯一的ID字符串，等转义完毕我们在吧这个ID替换为I标签
  // 避免最开始就把我I标签转义为"&lt; i &lt;"
  beforeText += `id=${keyId}`;

  // 组建后的文本内容
  const currentText = beforeText + afterText;

  // 构建节点元素
  {
    // 把文本标签转义：如<div>11</div> 把这个文本转义为"&lt;div&lt;",不然会出现当节点渲染了，其实</div>我们需要渲染为一个字符
    const repContent = labelRep(currentText);
    // 把上面的id唯一标识的字符串转换为 I 标签
    const newContent = repContent.replace(`id=${keyId}`, '<i id="' + keyId + '"></i>');

    // 文本转换图片替换方法
    const htmlNodeStr = regContentImg(newContent);

    // 把转换后的节点字符串变成dom节点。
    const tempEl = document.createElement("div");

    tempEl.innerHTML = htmlNodeStr;

    // 把当前的文本节点替换为多个节点 https://developer.mozilla.org/zh-CN/docs/Web/API/Element/replaceWith
    currNode.replaceWith(...tempEl.childNodes);

    // 获取光标节点
    const focusNode = document.getElementById(keyId) as any;
    // 设置光标
    setRangeNode(focusNode, "after", () => {
      // 删除节点
      focusNode?.remove();
      // 执行回调
      callBack();
    });
  }
};

/**
 * @name 处理换行
 */
export const handleLineFeed = (editNode: IEditorElement, callBack?: (success: boolean) => void) => {
  const range = getRange();
  // 必须存在光标
  if (!range) return callBack(false);

  console.time("editable插入换行耗时");

  // 获取当前光标的开始容器节点
  const rangeStartContainer: any = range.startContainer;

  // 判断光标节点是否为一个文本节点
  const targetNode = getNodeOfEditorTextNode(rangeStartContainer);
  // console.log(targetNode, range);
  if (!targetNode) {
    // 非常重要的逻辑--修正光标位置
    amendRangePosition(editNode, (node) => {
      if (node) {
        // 在调用自己一次
        handleLineFeed(editNode, callBack);
      }
    });
    return callBack(false);
  }

  const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(range);

  // console.log(behindNodeList, nextNodeList);

  /**
   * 创建换行节点
   * @dec 把之前的节点放到需要换行的节点后面
   */
  // 创建换行节点
  const lineDom = createLineElement(true);

  // 当前光标的顶层编辑行节点
  const rowElementNode = getNodeOfEditorRowNode(targetNode);

  // console.log("查看编辑文本节点的子节点情况: ",targetNode.childNodes);

  if (!rowElementNode) {
    console.warn("无编辑行节点，不可插入");
    return callBack(false);
  }

  /**
   * 把后面的节点放到换行节点的 文本节点中
   */
  const clNodes = dom.cloneNodes(nextNodeList);

  // 存在换行元素时
  if (clNodes.length) {
    // 标记顺序
    const markSortNodes: HTMLElement[][] = [];
    // 标记块节点的开始索引
    const blockindex = clNodes.findIndex((item) => isEditTextNode(item) || isFishInline(item));

    // 代表没有块节点，全部是个体
    if (blockindex == -1) {
      markSortNodes.push(clNodes);
    } else {
      // 截取前面的个体, 组合为一个数组
      if (blockindex == 0) {
        const restArr = clNodes.slice(blockindex);
        // 变二维插入
        for (const cld of restArr) {
          markSortNodes.push([cld]);
        }
      } else {
        const slicedArr = clNodes.slice(0, blockindex);
        const restArr = clNodes.slice(blockindex);
        markSortNodes.push(slicedArr);
        // 变二维插入
        for (const cld of restArr) {
          markSortNodes.push([cld]);
        }
      }
    }
    // console.log(markSortNodes, clNodes);
    // 遍历
    for (let i = 0; i < markSortNodes.length; i++) {
      /**
       * 如果二维数组里面存在块节点，代表是块。那么渲染的方式是不一样的。
       * isChunk ? 块 ： 代表是个体(文本属性节点下面的元素，代表个体)
       */
      const isChunk = markSortNodes[i].some((item) => isEditTextNode(item) || isFishInline(item));
      if (isChunk) {
        if (markSortNodes[i]?.[0]) {
          lineDom.appendChild(markSortNodes[i]?.[0]);
        }
      } else {
        // 代表是个体(文本属性节点下面的元素，代表个体)
        const textNode = createChunkTextElement();
        const nodes = markSortNodes[i].map((item) => item);
        dom.toTargetAddNodes(textNode, nodes);
        lineDom.appendChild(textNode);
      }
    }

    // !!! 删除原始节点中的换行部分的节点
    dom.removeNodes(nextNodeList);
  } else {
    // 不存在换行节点时，就把行添加一个编辑文本节点
    const textNode = createChunkTextElement(false);
    lineDom.appendChild(textNode);
  }

  // 如果前面的节点不存在，后面的接口存在； 代表换行后，前面的节点是没有内容的，需要进行添加一个编辑文本节点
  if (behindNodeList.length == 0 && nextNodeList.length) {
    // 创建文本节点
    const textNode = createChunkTextElement(false);
    dom.toTargetAddNodes(rowElementNode, [textNode]);
  }

  // console.log(dom.cloneNodes([lineDom])[0].childNodes);

  rowElementNode.insertAdjacentElement("afterend", lineDom);

  // 获取换行节点的第一个文本属性节点
  const cursorNode = getNodeOfChildTextNode(lineDom);
  // console.log(cursorNode, lineDom);

  // 设置光标为换行节点的开始位置
  setCursorNode(cursorNode);

  // 执行回调
  callBack?.(true);

  console.timeEnd("editable插入换行耗时");
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
  const range = getRange();
  console.time("onKeyUp转换节点耗时");

  // 是否只有一个br节点
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

    // 当前节点集合下面，如果有个节点 不属于文本节点and内联块属性节点就标记
    let exist = false;
    for (const cld of node.childNodes) {
      if ((!isEditTextNode(cld) && !isFishInline(cld)) || hasTransparentBackgroundColor(cld)) {
        exist = true;
        break;
      }
    }

    return exist;
  };

  /**
   * bug1：
   * 获取当前光标的行编辑节点，查询是否存在不符合编辑节点格式的节点，然后重写它。
   * 这种情况常出现在： 按键 删除行-富文本自动合并行时，会主动创建一些自定义标签
   * 比如：<span style="background-color: transparent;">345</span>
   */
  if (range && range?.startContainer) {
    /**
     * 1: 当前节点是编辑器文本属性节点。它的下一个兄弟节点，不是一个文本节点时，需要处理下 富文本的Dom格式
     */
    const editorTextNode = getNodeOfEditorTextNode(range.startContainer);

    // 获取行编辑节点
    const editorRowNode = getNodeOfEditorRowNode(range.startContainer);

    if (editorRowNode && isNodeWithNotTextNode(editorRowNode)) {
      console.log(editorRowNode.childNodes);
      /**
       * 必须用Array.from包裹下childNodes，不然导致for渲染不如预期的次数
       * 遍历行节点集合
       */
      const nodes: any[] = Array.from(editorRowNode.childNodes);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as any;

        // 按键 删除行-富文本自动合并行时，会主动创建一些自定义标签
        const isFlag = !isEditTextNode(node) && !isFishInline(node) && node.nodeName == "SPAN";
        if (isFlag) {
          rewriteEmbryoTextNode(node as HTMLElement);
        }

        // 删除编辑器行内节点的块样式
        if (hasTransparentBackgroundColor(node)) {
          // 重写
          node.removeAttribute("style");
        }

        if (node.nodeName === "BR") {
          node.remove();
        }
        // 基本不会存在会出现文本节点在editorRowNode中，如果出现直接删除了。免留后患
        if (isDOMText(node)) {
          node.remove();
        }
        /**
         * 处理表情图片节点
         */
        if (isEmojiImgNode(node)) {
          /**
           * 把图片插入到上一个兄弟节点的 文本属性节点里面
           * 如果没有上一个兄弟节点，就插入到下一个兄弟节点里面
           */
          const isPreviousNode = isEditTextNode(node.previousSibling);
          /**
           * 有可能图片的下一个兄弟节点是一个文本，但是因为for循环
           * 可能它还没转换rewriteEmbryoTextNode，导致isEditTextNode返回为false
           * 比如：图片表情节点后面是一个文本节点。
           */
          const isNextNode = isEditTextNode(node.nextSibling);
          if (isPreviousNode) {
            //node.previousSibling.appendChild(node);
          } else if (isNextNode) {
            // node.nextSibling.appendChild(node);
          } else {
            // 免留后患兜底处理，直接删除
            // node.remove();
          }
        }
      }
    }
  }

  /**
   * bug2：
   * 判断editNode是否只剩下一个节点，且不存在文本节点, 那就添加一个子节点
   * 主要解决删除内容把文本节点全部删完了
   * 兜底处理
   */
  if (isEmptyEditNode(editNode) && !getNodeOfChildTextNode(editNode)) {
    if (editNode.firstChild) {
      dom.toTargetAddNodes(editNode.firstChild as any, [base.createChunkTextElement(false)]);
    } else {
      if (editNode.childNodes.length == 0) {
        // 没有编辑行节点直接创建
        const lineDom = createLineElement();
        dom.toTargetAddNodes(editNode, [lineDom]);
      }
    }
  }

  /**
   * bug3：
   * 判断光标的行编辑节点是否是一个空节点，且不存在文本节点, 那就添加一个子节点
   * 主要解决删除内容把文本节点全部删完了，然后导致行编辑节点 格式错乱
   */
  if (range && range?.startContainer) {
    // 是一个编辑器块属性节点 && 光标节点不是一个文本节点 && 只有一个子节点且还是一个br标签
    if (isEditElement(range.startContainer as any) && !getNodeOfChildTextNode(range.startContainer) && hasParentOnlyBr(range.startContainer)) {
      dom.toTargetAddNodes(range.startContainer as any, [base.createChunkTextElement(false)]);
    }
  }

  /**
   * BUG4：如果光标是一个内联块节点，且后面没有文本节点直接添加一个文本节点。
   * 主要节点 解决当删除内容刚好删除到了图片节点，导致图片后面没有编辑文本节点了
   * 注意：添加完了还需要，光标设定上去后面的文本节点
   */
  // if (range && range?.startContainer) {
  //   // 是一个内联块节点
  //   const edInlineNode = getNodeOfEditorInlineNode(range?.startContainer as any);
  //   if (edInlineNode) {
  //     // 下一个兄弟节点不是一个文本节点
  //     if (!isEditTextNode(edInlineNode.nextSibling as any)) {
  //       const textNode = createChunkTextElement();
  //       dom.toTargetAfterInsertNode(edInlineNode, [textNode]);
  //       setRangeNode(edInlineNode.parentNode, "after");

  //       console.log(getRange());
  //     }
  //   }
  // }

  console.timeEnd("onKeyUp转换节点耗时");
};
