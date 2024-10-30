import isObject from "lodash/isObject";
import isFunction from "lodash/isFunction";
import isArray from "lodash/isArray";

import { dom, isNode, range as fishRange, helper, util, base, transforms } from "../../core";

import { getEditImageAmount } from "./util";

import type { IEditableProps } from "../../types";

import type { IEditorInstance } from "../../editor";

/** 是否正在处理粘贴内容 */
let isPasteLock = false;

/** @name 设置复制的内容 */
const setCopyText = (event: React.ClipboardEvent<HTMLDivElement>) => {
  if (!fishRange.isSelected()) {
    return;
  }

  const selection = fishRange.getSelection();

  const contents = selection.getRangeAt(0)?.cloneContents();

  if (!contents) return;

  // 将内容添加到＜div＞中，这样我们就可以获得它的内部HTML。
  const odiv = contents.ownerDocument.createElement("div");
  odiv.appendChild(contents);

  odiv.setAttribute("hidden", "true");
  contents.ownerDocument.body.appendChild(odiv);

  const content = transforms.getNodePlainText(odiv);

  // event.clipboardData.setData("text/html", odiv.innerHTML);
  event.clipboardData?.setData("text/plain", content);
  contents.ownerDocument.body.removeChild(odiv);
};

/** @name 处理复制事件 */
export const onCopy = (event: React.ClipboardEvent<HTMLDivElement>) => {
  // 阻止默认事件，防止复制真实发生
  event.preventDefault();

  setCopyText(event);
};

/** @name 处理剪切事件 */
export const onCut = (event: React.ClipboardEvent<HTMLDivElement>) => {
  event.preventDefault();

  setCopyText(event);

  /**
   * 删除选区
   *  */
  // 后续可以拓展删除节点方法，先原生的
  document.execCommand("delete", false, undefined);
};

/**
 * @name 处理换行
 */
export const handleLineFeed = (editor: IEditorInstance, callBack: (success: boolean) => void) => {
  const range = fishRange.getRange();
  // 不存在 光标 和 实例
  if (!range || !editor?.container) return callBack(false);

  // 获取光标的节点
  const rangeStartContainer: any = range.startContainer;

  // 行属性节点
  const rowElementNode = util.getNodeOfEditorElementNode(rangeStartContainer);

  if (!rowElementNode) {
    editor.setCursorEditorLast((node) => {
      if (node) {
        // 在调用自己一次
        handleLineFeed(editor, callBack);
      }
    });
    return callBack(false);
  }
  console.time("editor插入换行耗时");

  const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(range);

  /**
   * 创建换行节点
   * @dec 把之前的节点放到需要换行的节点后面
   */
  // 创建换行节点
  const lineDom = base.createLineElement(true);

  if (!isNode.isEditElement(rowElementNode as HTMLElement)) {
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

  if (isNode.isDOMNode(lineDom.firstChild)) {
    fishRange.setCursorPosition(lineDom.firstChild, "before");
    lineDom?.scrollIntoView({ block: "end", inline: "end" });

    console.timeEnd("editor插入换行耗时");

    // 执行回调
    callBack(true);
    return;
  }

  console.timeEnd("editor插入换行耗时");

  callBack(false);
};

/**
 * @name 处理粘贴事件的内容转换
 * @param e 粘贴事件
 * @param editor 实例
 * @param beforePasteImage 粘贴图片之前的钩子
 * @param callBack 成功回调
 */
export const handlePasteTransforms = async (
  e: ClipboardEventWithOriginalEvent,
  editor: IEditorInstance,
  beforePasteImage: IEditableProps["beforePasteImage"],
  callBack: (success: boolean) => void
) => {
  // 获取粘贴的内容
  const clp = e.clipboardData || (e.originalEvent && (e.originalEvent as any).clipboardData);
  const isFile = clp?.types?.includes("Files");
  const isHtml = clp?.types?.includes("text/html");
  const isPlain = clp?.types?.includes("text/plain");

  const range = fishRange.getRange();

  if (!editor?.container) {
    callBack(false);
    return;
  }

  /**
   * @name 如果是文件
   */
  if (isFile) {
    const files = isObject(clp.files) ? Object.values(clp.files) : clp.files;
    // console.log(files);
    // 必须是图片
    const vfiles = files?.filter((item: File) => item.type.includes("image/"));

    if (!range || vfiles.length == 0) {
      isPasteLock = false;
      callBack(false);
      return;
    }

    if (isPasteLock) {
      callBack(false);
      return;
    }

    // 截取前面10个文件
    let filtratefiles = vfiles.slice(0, 10);

    if (isFunction(beforePasteImage)) {
      const amount = getEditImageAmount(editor.container);
      const result = await beforePasteImage(vfiles.slice(0, 10), amount);
      if (isArray(result) && result?.length) {
        filtratefiles = result;
      } else {
        filtratefiles = [];
      }
    }

    // 如果是一个空文件直接返回
    if (filtratefiles.length == 0) {
      callBack(false);
      return;
    }

    const promiseData: Promise<{ blobUrl: string; base64: string }>[] = [];

    console.time("图片转换耗时");

    for (let i = 0; i < filtratefiles.length; i++) {
      const file = filtratefiles[i];
      promiseData.push(helper.imageFileToBlob(file));
    }
    console.timeEnd("图片转换耗时");

    // 标记
    isPasteLock = true;

    // 执行其他操作
    {
      Promise.allSettled(promiseData)
        .then((res) => {
          const datas: { blobUrl: string; base64: string }[] = [];
          res.forEach((result) => {
            if (result.status == "fulfilled" && result.value) {
              datas.push(result.value);
            }
          });

          const nodes: HTMLSpanElement[] = [];
          datas.forEach((item) => {
            // const zeroSpaceNode = base.createZeroSpaceElement() as any;
            nodes.push(...[base.createChunkImgElement(item.blobUrl)]);
            base.editorImageBase64Map.set(item.blobUrl, item.base64);
          });

          if (nodes.length) {
            // 存在选区
            if (fishRange.isSelected()) {
              // 后续可以拓展删除节点方法，先原生的
              document.execCommand("delete", false, undefined);
            }

            // 行属性节点
            const rowElementNode = util.getNodeOfEditorElementNode(range.startContainer);

            if (!rowElementNode) {
              editor.setCursorEditorLast((node) => {
                if (node) {
                  // update range
                  const resetRange = fishRange.getRange();
                  editor.insertNode(nodes, resetRange, (success) => {
                    isPasteLock = false;
                    callBack(success);
                  });
                }
              });
              return;
            }

            editor.insertNode(nodes, range, (success) => {
              isPasteLock = false;
              callBack(success);
            });
            return;
          }

          // 没有节点插入时
          isPasteLock = false;
          callBack(false);
          return;
        })
        .catch(() => {
          isPasteLock = false;
          callBack(false);
        });
    }
  }

  /**
   * @name 如果是文本
   */
  if ((isHtml || isPlain) && !isFile) {
    // 如果是粘贴的是文本
    const content = clp.getData("text/plain");

    if (!content || !range) {
      isPasteLock = false;
      callBack(false);
      return;
    }

    if (isPasteLock) {
      callBack(false);
      return;
    }

    // 存在选区
    if (fishRange.isSelected()) {
      // 后续可以拓展删除节点方法，先原生的
      document.execCommand("delete", false, undefined);
    }

    // 在删除完成后执行其他操作
    {
      // 标记
      isPasteLock = true;

      // 行属性节点
      const rowElementNode = util.getNodeOfEditorElementNode(range.startContainer);

      if (!rowElementNode) {
        editor.setCursorEditorLast((node) => {
          if (node) {
            // update range
            const resetRange = fishRange.getRange();
            editor.insertText(
              content,
              resetRange,
              (success) => {
                isPasteLock = false;
                callBack(success);
              },
              true
            );
          }
        });
        return;
      }
      // 插入文本
      editor.insertText(
        content,
        range,
        (success) => {
          isPasteLock = false;
          callBack(success);
        },
        true
      );
    }
  }
};
