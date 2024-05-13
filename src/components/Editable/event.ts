/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: 富文本输入框事件处理
 */

import { regContentImg, getRandomWord, labelRep } from "../../utils";
import {
  addTargetElement,
  removeNode,
  createLineElement,
  cloneNodes,
  judgeDomOrNotTtxt,
  isDOMText,
  findParentWithAttribute,
  getRangeAroundNode,
  getPlainText
} from "./dom";

import { setRangeNode, setCursorNode, insertText } from "./utils";

// 是否正在处理粘贴内容
let isPasteLock = false;

/** @name 处理复制事件 */
export const onCopyEvent = (event: any) => {
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

  const content = getPlainText(odiv);

  // event.clipboardData.setData("text/html", odiv.innerHTML);
  event.clipboardData?.setData("text/plain", content);
  contents.ownerDocument.body.removeChild(odiv);
};

/** @name 处理剪切事件 */
export const onCut = (event: any) => {
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

    const content = getPlainText(odiv);

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
 * 把输入的文字转换成图片
 */
export const handleInputTransforms = (editNode: any, callBack: () => void) => {
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
  const keyId = "editorFocusHack" + new Date().getTime() + getRandomWord(8);
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
 * @name 处理换行符
 */
export const handleAmendEmptyLine = (editNode: any, callBack?: () => void) => {
  // 获取页面的选择区域
  const selection = window.getSelection();

  // 获取当前光标
  const range = selection?.getRangeAt(0);

  // 必须存在光标
  if ((selection && selection.rangeCount == 0) || !range) return callBack?.();

  // 获取当前光标的开始容器节点
  const rangeStartContainer: any = range.startContainer;

  // 判断当前光标节点的顶级节点是否是一个富文本节点
  const topElementNode = findParentWithAttribute(rangeStartContainer);

  if (!topElementNode) return callBack?.();

  const [behindNodeList, nextNodeList] = getRangeAroundNode();

  if (!behindNodeList || !nextNodeList) return callBack?.();
  /**
   * 创建换行节点
   * @dec 把之前的节点放到需要换行的节点后面
   */
  const lineNode = addTargetElement(createLineElement(), cloneNodes(nextNodeList));

  topElementNode.insertAdjacentElement("afterend", lineNode);

  // 删除原始节点中的换行部分的节点
  removeNode(nextNodeList);

  // 判断原始节点中是否还存在内容，如果不存在，就给元素节点中给一个br标签（占位）不然换行看不出来
  const judgeOriginNotTtxt = judgeDomOrNotTtxt([...behindNodeList]);

  // 不满足条件
  if (!judgeOriginNotTtxt) {
    topElementNode.innerHTML = "<br/>";
  }
  // 设置光标节点
  setCursorNode(lineNode);
  // 执行回调
  callBack?.();
};

/** @name 处理粘贴事件的内容转换 */
export const handlePasteTransforms = (e: any, callBack?: () => void) => {
  // 获取粘贴的内容
  const clp = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
  const isFile = clp?.types?.includes("File");
  const isHtml = clp?.types?.includes("text/html");
  const isPlain = clp?.types?.includes("text/plain");
  let content = "";
  // 如果是粘贴的是文件
  if (isFile && !isHtml && !isPlain) {
    console.error("暂不支持粘贴文件 clp.types");
  } else if ((isHtml || isPlain) && !isFile) {
    // 如果是粘贴的是文本
    content = clp.getData("text/plain");
  }
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
    // 在删除完成后执行其他操作
    isPasteLock = true;
    insertText(repContent, () => {
      isPasteLock = false;
      callBack?.();
    });
  } else {
    isPasteLock = true;
    insertText(repContent, () => {
      isPasteLock = false;
      callBack?.();
    });
  }

  // 方案二, 不会支持自定义富文本节点
  if (repContent) {
    // 把表情文本转换为图片,
    // const htmlNodeStr = regContentImg(repContent);
    // 内容插入
    // document.execCommand("insertHTML", false, htmlNodeStr);
  }
};
