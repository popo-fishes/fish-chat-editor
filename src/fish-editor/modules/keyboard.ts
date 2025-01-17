import throttle from "lodash/throttle";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";
import { range as fishRange, split, util, dom, base, isNode } from "../utils";

class Keyboard extends Module {
  isLineFeedLock = false;
  emitThrottled = throttle(() => {
    // 300 毫秒的节流间隔，可以根据需要调整
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, 300);
  constructor(fishEditor: FishEditor, options: Record<string, never>) {
    super(fishEditor, options);
    this.listen();
  }
  listen() {
    this.fishEditor.root.addEventListener("keydown", (evt: KeyboardEvent) => {
      if (evt.defaultPrevented || evt.isComposing) return;
      const keyCode = evt.keyCode;
      const rangeInfo = fishRange.getRange();
      // ctrl + Enter换行
      if (evt.ctrlKey && keyCode === 13) {
        evt.preventDefault();
        evt.stopPropagation();

        if (this.isLineFeedLock) return;

        this.isLineFeedLock = true;

        // 插入换行符
        this.handleLineFeed((success) => {
          if (success) {
            Promise.resolve().then(() => {
              this.emitThrottled();
            });
          }
          this.isLineFeedLock = false;
        });
        return;
      }

      if (keyCode === 13) {
        // Enter发生消息
        evt.preventDefault();
        evt.stopPropagation();
        this.fishEditor.emit(Emitter.events.EDITOR_ENTER_DOWN, this.fishEditor);
        return;
      }

      /**
       * 问题1: 处理ctrl+a事件，如果没有内容不能进行选中行的br节点
       * bug2:
       * 按下删除按键：如果编辑器已经是一个空节点 就 阻止删除按键。不然会把空文本节点给删除了导致BUG
       * 兜底处理,防止骚操作
       */
      if ((evt.ctrlKey && evt.key == "a") || evt.keyCode === 8) {
        const editor = this.fishEditor.editor;
        if (!fishRange.isSelected() && editor?.isEditorEmptyNode()) {
          event.preventDefault();
          return;
        }
      }

      /**
       * bug3:
       * 不可以在非编辑行节点里面输入。这种情况出现在行编辑里面剩下一个内联节点，然后删除了就会导致行节点也被删除了。
       * 兜底处理,防止骚操作
       */
      if (rangeInfo && rangeInfo.startContainer) {
        // 不是行编辑节点，直接禁止操作
        const elementRowNode = util.getNodeOfEditorElementNode(rangeInfo.startContainer);
        if (!elementRowNode) {
          event.preventDefault();
          return;
        }
      }

      // 检测到可能导致合并的操作，如退格键或删除键, 主动处理合并行。
      // if (event.key === "Backspace" || event.key === "Delete") {
      //   event.preventDefault();
      //   // 在这里可以根据需要进行自定义的处理逻辑
      // }
    });
    this.fishEditor.root.addEventListener("keyup", transformsEditNodes.bind(this));
  }

  handleLineFeed(callBack: (success: boolean) => void) {
    let rangeInfo = fishRange.getRange();
    // 不存在 光标
    if (!rangeInfo) return callBack(false);

    // 行属性节点
    const rowElementNode = util.getNodeOfEditorElementNode(rangeInfo.startContainer);

    if (!rowElementNode) {
      this.fishEditor.editor.setCursorEditorLast((node) => {
        if (node) {
          // 在调用自己一次
          this.handleLineFeed(callBack);
        }
      });
      return callBack(false);
    }

    console.time("editor插入换行耗时");

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

    // 如果当前节点是一个内联块编辑节点，就需要先分割它
    if (util.getNodeOfEditorInlineNode(rangeInfo.startContainer)) {
      const result = split.splitInlineNode(rangeInfo);
      rangeInfo.startContainer = result.parentNode;
      rangeInfo.anchorNode = result.parentNode;
      rangeInfo.startOffset = result.startOffset;
    }

    const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(rangeInfo);
    // console.log(behindNodeList, nextNodeList);
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
  }
}

// 子节点是否只有一个br节点
function hasParentOnlyBr(node: HTMLElement) {
  if (node) {
    if (node.childNodes && node.childNodes?.length == 1) {
      if (node.childNodes[0]?.nodeName == "BR") return true;
    }
  }
  return false;
}

/** 处理节点带有style属性时，也需要标记 */
function hasTransparentBackgroundColor(node: HTMLElement) {
  try {
    if (node.style && node.style?.backgroundColor) return true;
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * @name 行节点下面是否具有异常的节点
 */
function hasNotSatisfiedNode(node: HTMLElement) {
  if (!node) return false;
  if (!node.childNodes) return false;
  if (!node.childNodes.length) return false;
  if (node.childNodes.length == 1) {
    if (hasParentOnlyBr(node)) return false;
  }
  const nodes: any[] = Array.from(node.childNodes);
  let exist = false;
  for (const cld of nodes) {
    // 存在BR节点，但是子节点有很多个
    if (cld.nodeName === "BR" && nodes.length > 1) {
      exist = true;
      break;
    }
    // 节点不是内联块属性节点 || 节点有背景色属性
    if ((!isNode.isEditInline(cld as any) && cld.nodeName == "SPAN") || hasTransparentBackgroundColor(cld as any)) {
      exist = true;
      break;
    }
  }
  return exist;
}

function transformsEditNodes() {
  const editNode = (this as Keyboard).fishEditor.root;

  const rangeInfo = fishRange.getRange();

  // console.time("transforms转换节点耗时");

  /**
   * bug1:
   * 获取光标的行编辑节点，查询是否存在不符合编辑节点格式的节点，然后重写它。
   * 这种情况常出现在： 按键 删除行-富文本自动合并行时，会主动创建一些自定义标签
   * 比如：<span style="background-color: transparent;">345</span>
   */
  if (rangeInfo && rangeInfo?.startContainer) {
    // 获取行编辑节点
    const editorRowNode = util.getNodeOfEditorElementNode(rangeInfo.startContainer);
    if (editorRowNode && hasNotSatisfiedNode(editorRowNode)) {
      // console.log(editorRowNode.childNodes);
      /**
       * 必须用Array.from包裹下childNodes，不然导致for渲染不如预期的次数
       * 遍历行节点集合
       */
      const nodes: any[] = Array.from(editorRowNode.childNodes);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as any;
        // console.log(isNode.isEditInline(node), node);
        const isFlag = !isNode.isEditInline(node) && node.nodeName == "SPAN";
        if (isFlag) {
          if (node.style.color) {
            const dom_sapn = base.createInlineChunkElement();
            dom_sapn.innerText = node.innerText;
            dom_sapn.style.color = node.style.color;
            node.parentNode?.replaceChild(dom_sapn, node);
          } else {
            const textNode = document.createTextNode(node.textContent || "");
            node.parentNode?.replaceChild(textNode, node);
          }
        }

        if (hasTransparentBackgroundColor(node) && isNode.isEditInline(node)) {
          node.style.removeProperty("background-color");
        }

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
  if (!isNode.isEditElement(editNode.firstChild as any)) {
    // 创建一个编辑器--行节点
    const lineDom = base.createLineElement();
    dom.toTargetAddNodes(editNode as any, [lineDom]);
    // 设置光标
    if (lineDom.firstChild) {
      fishRange.setCursorPosition(lineDom.firstChild, "before");
    }
  }

  /**
   * bug3:
   * 不可以在非编辑行节点里面输入。这种情况出现在行编辑里面剩下一个内联节点，然后删除了就会导致行节点也被删除了。
   * 兜底处理,防止骚操作
   */
  if (rangeInfo && rangeInfo?.startContainer) {
    if (!util.getNodeOfEditorElementNode(rangeInfo.startContainer as any)) {
      // 编辑器存在节点大于1
      if (editNode.childNodes?.length > 1) {
        const nodes: any[] = Array.from(editNode.childNodes);
        // 直接吧br标签替换为行节点
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as any;

          if (!isNode.isEditElement(node) && node.nodeName !== "BR") {
            node?.remove();
          }
          if (node.nodeName == "BR") {
            // 创建一个编辑器--行节点
            const lineDom = base.createLineElement();
            node.parentNode?.replaceChild(lineDom, node);
            // 设置光标为目标行的字节节点
            const targetRowNode = editNode.childNodes[rangeInfo.startOffset];
            if (targetRowNode?.firstChild) {
              fishRange.setCursorPosition(targetRowNode.firstChild, "before");
            }
          }
        }
      }
    }
  }

  // console.timeEnd("transforms转换节点耗时");
}

export default Keyboard;
