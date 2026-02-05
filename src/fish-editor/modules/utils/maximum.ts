/*
 * @Date: 2025-10-22 10:39:09
 * @Description: Modify here please
 */
import { isNode, util } from "../../utils";
import type FishEditor from "../../core/fishEditor";
import type { IRange } from "../../core/selection";

export const EDITOR_TO_START_CONTAINER: WeakMap<
  FishEditor,
  {
    startOffset: number;
    startContainer: globalThis.Node;
    type: "text" | "element";
    text: string | null;
  }
> = new WeakMap();

const getSubstringFromEnd = (str: string, match: string) => {
  const lastIndex = str.lastIndexOf(match);
  if (lastIndex !== -1) {
    return str.slice(0, lastIndex);
  }
  return str;
};
/**
 * @name 处理CompositionStart记录下当前选区信息，以便触发 maxLength 时使用
 * @param flag 是否删除过选区
 * @param range 当前选区
 * @param contextFishEditor 上下文编辑器对象
 */
const recordCompositionStartContainer = (flag: boolean, range: IRange, contextFishEditor: any) => {
  if (!range) return;
  // 如果删除了选区，则目标dom取之后的节点
  if (flag && isNode.isDOMText(range.startContainer)) {
    const targetNode = range.startContainer;
    const previousSibling = targetNode?.previousSibling as any;
    if (previousSibling && isNode.isDOMText(previousSibling)) {
      EDITOR_TO_START_CONTAINER.set(contextFishEditor, {
        startOffset: previousSibling.data.length,
        startContainer: previousSibling,
        type: "text",
        text: isNode.isDOMText(previousSibling) ? previousSibling.textContent || "" : null
      });
    }
  } else {
    if (isNode.isDOMElement(range.startContainer)) {
      EDITOR_TO_START_CONTAINER.set(contextFishEditor, {
        startOffset: range.startOffset,
        startContainer: range.startContainer,
        type: "element",
        text: null
      });
    } else {
      EDITOR_TO_START_CONTAINER.set(contextFishEditor, {
        startOffset: range.startOffset,
        startContainer: range.startContainer,
        type: "text",
        text: isNode.isDOMText(range.startContainer) ? range.startContainer.textContent || "" : null
      });
    }
  }
};

/**
 * @name Handle the maxLength logic of CompositionEnd
 */
function handleMaxLengthFn(data: string, contextFishEditor: any) {
  const fishEditor = this.fishEditor as FishEditor;
  try {
    /**
     * 1. 由于是CompositionEnd触发的这个方法，所以getLeftLengthOfMaxLength时获取的长度已经包含了当前中文作曲的内容。
     * 2. getLeftLengthOfMaxLength减去了当前内容的长度，所以这里需要给它加回去，不然leftMaxLength是有异常的
     */
    const leftMaxLength = fishEditor.getLeftLengthOfMaxLength();
    const currentlyMaxLength = leftMaxLength + data.length;
    // console.log(leftMaxLength, currentlyMaxLength, data)
    // 如果剩余长度小于插入的长度，则截取插入
    if (currentlyMaxLength < data.length) {
      // CompositionStart时的选区
      const oldRange = EDITOR_TO_START_CONTAINER.get(contextFishEditor);
      // console.log(oldRange, oldRange.startContainer)
      // CompositionEnd时，当前选区
      const curRange = fishEditor.selection.getRange();
      // console.log(curRange)
      const elementRowNode = util.getNodeOfEditorElementNode(curRange?.startContainer);
      if (!elementRowNode || !oldRange) return;

      // 1. 如果是元素节点
      if (oldRange.type == "element") {
        const nodeName = oldRange?.startContainer?.nodeName?.toLowerCase() || "";
        /**
         * @name 是否空行节点
         * 因为可能最开始一个空行:<p><br></p>,输入后输入删除当前选区会导致变成<p></p>一个空行标签。
         */
        if (oldRange.startContainer && nodeName == "br") {
          // !!! clearTextCache
          fishEditor.editor.clearTextCache();
          // 如果不能插入文本，则删除刚刚输入的内容，变回之前的内容（之前的内容肯定是br空行内容）
          // 删除当前选区内容
          const dom_br = document.createElement("br");
          (curRange.startContainer as any)?.replaceWith(dom_br);
          // 重新定位光标
          fishEditor.selection.setCursorPosition(elementRowNode.firstChild, "before");

          // 允许直接插入
          if (currentlyMaxLength > 0) {
            const curText = data.slice(0, currentlyMaxLength);
            fishEditor.insertTextInterceptor(curText, true, (success) => {
              if (success) {
                // fishEditor.scrollSelectionIntoView()
              }
            });
          }
        } else {
          // !!! clearTextCache
          fishEditor.editor.clearTextCache();
          // 删除当前选区内容
          (curRange.startContainer as any)?.remove();
          // 重新定位光标
          fishEditor.selection.setCursorPosition(oldRange.startContainer, oldRange.startOffset == 1 ? "after" : "before");
          // 允许直接插入
          if (currentlyMaxLength > 0) {
            const curText = data.slice(0, currentlyMaxLength);
            fishEditor.insertTextInterceptor(curText, true, (success) => {
              if (success) {
                // fishEditor.scrollSelectionIntoView()
              }
            });
          }
        }
      } else {
        // 相同选区
        const isSameNode = curRange.startContainer.isSameNode(oldRange.startContainer);
        //console.log('1--', elementRowNode.childNodes, elementRowNode.outerHTML)
        // console.log(isSameNode, curRange, oldRange)
        if (isSameNode) {
          /**
           * 场景"<p>12</p>",在12的中间中文作曲就会触发
           * 重置为输入完毕之前的内容
           */
          curRange.startContainer.textContent = oldRange.text;
          // !!! clearTextCache
          fishEditor.editor.clearTextCache();
          // 重新定位光标
          fishEditor.selection.setCursorPosition(curRange.startContainer, null, oldRange.startOffset);
          // 如果剩余长度大于0，则插入
          if (currentlyMaxLength > 0) {
            const curText = data.slice(0, currentlyMaxLength);
            fishEditor.insertTextInterceptor(curText, true, (success) => {
              if (success) {
                fishEditor.scrollSelectionIntoView();
              }
            });
          }
        } else {
          /**
           * @name 不是同一个选区，把刚刚输入的内容过滤掉
           * 1. 场景1"<p>1<img />2</p>",在img之前 2之后的中间中文作曲就会触发,这种情况是走删除当前选区的内容，在旧的光标点位插入内容
           * 2. 场景2"<p><text>1</text><text>2</text><text>3</text></p>"在3的前面位置进行中文作曲，会导致走到不同选区；这个时候输入了应该换行新选区的内容为之前的，
           * 也就是变为<text>2</text>
           */
          /**
           * @name 当前选区输入完成之前的旧值
           * 1. 当前选区的内容去掉刚刚输入的内容，得到输入完毕之前的旧值
           */
          const curRangeNodeOldValue = getSubstringFromEnd(curRange.startContainer?.textContent || "", data);
          // console.log(curRangeNodeOldValue, !!curRangeNodeOldValue, curRange.startContainer?.textContent, data)
          // 如果这个值为true，代表走到了场景2，需要还原回去之前的值
          if (!!curRangeNodeOldValue) {
            curRange.startContainer.textContent = curRangeNodeOldValue;
          } else {
            // 场景1：直接删除当前选区内容
            (curRange.startContainer as any)?.remove();
          }
          // !!! clearTextCache
          fishEditor.editor.clearTextCache();
          // 重新定位光标为compositionstart时的节点
          fishEditor.selection.setCursorPosition(oldRange.startContainer, null, oldRange.startOffset);
          // 如果剩余长度大于0，则插入
          if (currentlyMaxLength > 0) {
            const cText = data.slice(0, currentlyMaxLength);
            fishEditor.insertTextInterceptor(cText, true, (success) => {
              if (success) {
                fishEditor.scrollSelectionIntoView();
              }
            });
          }
        }
        // console.log('2--', elementRowNode.outerHTML, elementRowNode.childNodes)
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export { recordCompositionStartContainer, handleMaxLengthFn };
