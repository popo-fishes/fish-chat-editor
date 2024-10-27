/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { helper, base, dom, isNode, util, range as fishRange, transforms, positions } from "../core";
import type { IRange } from "../core";
import { hasEditorExistInlineNode, getCloneEditeElements, removeBodyChild, resolveSelector } from "./util";

export interface IEditorInterface {
  /**
   * @name 判断编辑器内容是否为空
   * @desc 仅存在换行or输入空格，都算是空内容
   */
  isEmpty: () => boolean;
  /**
   * @name 判断编辑器是否为空节点
   * @desc 存在换行or输入空格，都算是有内容
   * @desc 仅存在一个“<p><br></p>”代表是空。
   */
  isEditorEmptyNode: () => boolean;
  /** @name 获取编辑器的纯文本内容 */
  getText: () => string;
  /**
   * @name 获取编辑器内容的语义HTML
   * @desc 当你想提交富文本内容时，它是非常有用的，因为它会把img图片的src转换成base64。
   * @returns 返回一个html标签字符串
   */
  getSemanticHTML: () => string;
  /**
   * @name 获取编辑器内容的原始html，主要用于判断存在场景 or 富文本内部使用
   * @desc 它不会转换img图片的src，还是blob格式
   * @returns 返回一个html标签字符串
   */
  getProtoHTML: () => string;
  /**
   * @name 在选区插入文本
   * @param contentText 内容
   * @param range 光标信息
   * @param callBack 回调（success?）=> void
   * @param showCursor 插入成功后是否需要设置光标
   */
  insertText: (contentText: string, range: IRange, callBack?: (success: boolean) => void, showCursor?: boolean) => void;
  /**
   * @name 在目标位置插入节点（目前是图片）
   * @param nodes 节点集合
   * @param range 光标信息
   * @param callBack 回调（success?）=> void
   * @returns
   */
  insertNode: (nodes: HTMLElement[], range: IRange, callBack?: (success: boolean) => void) => void;
  /** @name 获取行数 */
  getLine: () => number;
  /** @name 检索编辑器内容的长度，不包含图片 */
  getLength: () => number;
  /** @name 设置编辑器文本, 注意它不会覆盖编辑器内容，而是追加内容 */
  setText: (content: string) => void;
  /** @name 清空编辑器内容 */
  clear: () => HTMLElement | null;
  /** @name 失去焦点 */
  blur: () => void;
  /** @name 获取焦点 */
  focus: () => void;
}

export interface IEditorOptions {
  onChange?: () => void;
}

class Editor {
  /** @name 编辑器配置项 */
  options: IEditorOptions;
  /** @name 编辑器容器 */
  container: HTMLElement;
  constructor(container: HTMLElement | string, options: IEditorOptions = {}) {
    this.container = resolveSelector(container);
    this.options = options;
    if (this.container == null) {
      console.error("Invalid Editor container", container);
      return;
    }
  }
  /**
   * @name 判断编辑器内容是否为空
   * @desc 仅存在换行or输入空格，都算是空内容
   */
  public isEmpty() {
    const editorNode = this.container;
    if (!editorNode || !editorNode?.childNodes) return true;
    /**
     * 没有纯文本内容，并且没有内联块节点。代表是一个空内容
     * hasEditorExistInlineNode方法主要判断，有可能编辑器存在图片节点。等等内联块节点
     */
    if (this.getText() == "" && !hasEditorExistInlineNode(editorNode)) return true;

    return false;
  }
  /**
   * @name 判断编辑器是否为空节点
   * @desc 存在换行or输入空格，都算是有内容
   * @desc 仅存在一个“<p><br></p>”代表是空。
   */
  public isEditorEmptyNode() {
    const editorNode = this.container;
    if (!editorNode || !editorNode?.childNodes) return true;
    /**
     * 代表有多个编辑行，不是空
     */
    if (editorNode?.childNodes && editorNode?.childNodes.length > 1) {
      return false;
    }
    /**
     * 没有纯文本内容，并且仅存在一个“<p><br></p>”。代表是空
     */
    if (this.getText() == "" && this.getProtoHTML() == base.emptyEditHtmlText) return true;

    return false;
  }
  /** @name 获取编辑器的纯文本内容 */
  public getText() {
    const cloneEditeNode = getCloneEditeElements.call(this);
    const contentStr = transforms.getNodePlainText(cloneEditeNode);
    // 移除节点
    removeBodyChild(cloneEditeNode);
    // 替换
    const result = helper.contentReplaceEmpty(helper.removeTailLineFeed(contentStr));

    return result;
  }
  /**
   * @name 获取编辑器内容的语义HTML
   * @desc 当你想提交富文本内容时，它是非常有用的，因为它会把img图片的src转换成base64。
   * @returns 返回Promise
   */
  public getSemanticHTML() {
    console.time("getSemanticHTML:获取内容耗时");
    const cloneEditeNode = getCloneEditeElements.call(this);
    const contentResult = transforms.handleEditTransformsSemanticHtml(cloneEditeNode);
    console.timeEnd("getSemanticHTML:获取内容耗时");
    // 移除节点
    removeBodyChild(cloneEditeNode);

    return contentResult;
  }
  /**
   * @name 获取编辑器内容的原始html，主要用于判断存在场景 or 富文本内部使用
   * @desc 它不会转换img图片的src，还是blob格式
   * @returns 返回一个html标签字符串
   */
  public getProtoHTML() {
    console.time("getProtoHTML:获取内容耗时");
    const cloneEditeNode = getCloneEditeElements.call(this);
    const contentResult = transforms.handleEditTransformsProtoHtml(cloneEditeNode);
    console.timeEnd("getProtoHTML:获取内容耗时");
    // 移除节点
    removeBodyChild(cloneEditeNode);
    return contentResult;
  }
  /**
   * @name 在选区插入文本
   * @param contentText 内容
   * @param range 光标信息
   * @param callBack 回调（success?）=> void
   * @param showCursor 插入成功后是否需要设置光标
   */
  public insertText(contentText: string, range: IRange, callBack?: (success: boolean) => void, showCursor?: boolean): void {
    if (!contentText || !range) {
      callBack?.(false);
      return;
    }

    const splitNodes = (startContainer: HTMLElement, node: HTMLElement) => {
      dom.toTargetAfterInsertNodes(startContainer, [node]);
    };

    // 获取光标的行编辑节点
    const rowElementNode: HTMLElement = util.getNodeOfEditorElementNode(range.startContainer);

    if (!rowElementNode) {
      console.warn("无编辑行节点，不可插入");
      callBack?.(false);
      return;
    }

    console.time("editor插入内容耗时");

    const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(range);

    /** 处理内容插入 */
    {
      // 把文本标签转义：如<div>[爱心]</div> 把这个文本转义为"&lt;div&lt;", newCurrentText 光标的节点元素的值
      const semanticContent = transforms.labelRep(contentText);

      const lines = semanticContent?.split(/\r\n|\r|\n/) || [];

      // 是否需要进行分割
      let split = false;
      // 初始化光标节点的顶级节点，在遍历时会不停地更新它
      let initialNode = rowElementNode;
      // 需要插入的第一个节点(没有被真正插入到dom，只用到了它的子节点去合并光标位置的节点)
      let firstNode: any = null;
      // 需要插入节点的最后一个节点（如果需要插入节点只有一个，那么这个值和第一个节点 相同）
      let lastNode: any = null;

      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i];
        const childNodes = transforms.transformTextToNodes(lineContent);
        const node = base.createLineElement();

        if (childNodes.length) {
          dom.toTargetAddNodes(node, childNodes as any[]);
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

      const keyId = "editorFocusHack" + new Date().getTime() + helper.generateRandomString();
      const iElement = document.createElement("i");
      iElement.id = keyId;

      if (firstNode === lastNode) {
        firstNode.appendChild(iElement);
      } else {
        lastNode.appendChild(iElement);
      }

      /** 处理原始光标行节点的内容 */
      {
        const content = transforms.getEditElementContent(rowElementNode);
        // 空文本??
        if (content == "\n" || content == "") {
          if (isNode.isDOMElement(firstNode)) {
            // 直接把第一个插入的节点内容 赋值给 光标节点的顶级富文本节点
            dom.toTargetAddNodes(rowElementNode, dom.cloneNodes(firstNode.childNodes));
          }
        } else {
          // 不是空！！
          /**
           * 1. 在光标前面节点数组中，找到最后一个节点，在最后一个节点的后面插入节点
           */
          // 获取第一个插入节点的文本内容
          const firstContent = transforms.getEditElementContent(firstNode);
          // 不是空文本！！
          if (firstContent !== "\n" && firstContent !== "") {
            // 获取前面节点的最后一个节点
            const prevLast = behindNodeList[0];
            if (prevLast) {
              dom.toTargetAfterInsertNodes(prevLast, dom.cloneNodes(firstNode.childNodes));
            } else {
              /**
               * 如果光标位置的之前没节点, 则选择光标之后的第一个节点，然后插入节点
               */
              if (nextNodeList[0]) {
                const nodes: any = Array.from(dom.cloneNodes(firstNode.childNodes));
                const fragment = new DocumentFragment();
                for (let i = 0; i < nodes.length; i++) {
                  fragment.appendChild(nodes[i]);
                }
                // 在行的--光标之后的第一个节点，的前面插入多个节点
                rowElementNode.insertBefore(fragment, nextNodeList[0]);
              }
            }
          }

          /**
           * 2.1 如果第一个插入的节点和最后一个插入的节点是 相同的，代表是插入一个节点, 如果是一个节点，就不能去删除原始节点后面的节点，因为没有换行。
           * 2.2 我们这里判断如果不是一个节点，那么就删除后面的节点
           */
          if (firstNode !== lastNode && nextNodeList.length) {
            const lastContent = transforms.getEditElementContent(lastNode);
            dom.toTargetAddNodes(lastNode, dom.cloneNodes(nextNodeList), false);
            /**
             * 如果添加的节点本身没有内容，就需要先清空节点吧BR标签删除掉
             * 没有内容lastNode会带一个 br标签子节点，如果不处理，会导致有2行的BUG视觉效果
             */
            if (lastContent == "" || lastContent == "\n") {
              util.deleteTargetNodeOfBrNode(lastNode);
            }
            dom.removeNodes(nextNodeList);
          }
        }
      }

      console.timeEnd("editor插入内容耗时");

      {
        const focusNode = document.getElementById(keyId) as any;

        if (showCursor) {
          focusNode?.scrollIntoView(true);
          fishRange.setCursorPosition(focusNode, "after");
        }
        focusNode?.remove();

        callBack?.(true);
        return;
      }
    }
  }
  /**
   * @name 在目标位置插入节点（目前是图片）
   * @param nodes 节点集合
   * @param range 光标信息
   * @param callBack 回调（success?）=> void
   * @returns
   */
  public insertNode(nodes: HTMLElement[], range: IRange, callBack?: (success: boolean) => void): void {
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
    console.time("editor插入节点耗时");

    // 获取光标位置的元素节点 前面的节点 和 后面的节点
    const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(range);

    if (nodes.length == 0) {
      console.timeEnd("editor插入节点耗时");
      callBack?.(false);
      return;
    }

    /** 处理内容 */
    {
      // 行编辑节点没有节点
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

    console.timeEnd("editor插入节点耗时");

    // 设置光标的位置
    {
      const referenceNode = nodes[nodes.length - 1] as any;
      if (isNode.isDOMElement(referenceNode)) {
        referenceNode?.scrollIntoView({ block: "end", inline: "end" });
        fishRange.setCursorPosition(referenceNode, "after");
        callBack?.(true);
        return;
      } else {
        const scrollNode = nodes[nodes.length - 2];
        /**
         * bug4:
         * 插入一个内联节点，基本要在节点的后面插入一个文本，解决光标非常高的问题。
         */
        fishRange.setCursorPosition(referenceNode, null, 1);
        scrollNode?.scrollIntoView({ block: "end", inline: "end" });
        callBack?.(true);
        return;
      }
    }
  }
  /** @name 获取行数 */
  public getLine() {
    if (!this.container || !this.container?.childNodes) return 0;
    return this.container.childNodes.length;
  }

  /** @name 检索编辑器内容的长度，不包含图片 */
  public getLength() {
    return this.getText()?.length;
  }
  /** @name 设置编辑器文本, 注意它不会覆盖编辑器内容，而是追加内容 */
  public setText(content: string) {
    if (!content || !this.container) return;
    positions.setCursorEditorLast(this.container, (node) => {
      if (node) {
        const rangeInfo = fishRange.getRange();
        this.insertText(
          content,
          rangeInfo,
          (success) => {
            if (success) {
              this.options?.onChange?.();
              this.blur();
            }
          },
          true
        );
      }
    });
  }
  /** @name 清空编辑器内容 */
  public clear(isUpdate = true) {
    const node = base.createLineElement();
    if (!this.container) return null;
    dom.toTargetAddNodes(this.container, [node]);
    this.blur();
    // 执行更新
    isUpdate && this.options?.onChange?.();
    // 返回编辑器的行节点
    return node;
  }
  /** @name 失去焦点 */
  public blur() {
    this.container?.blur?.();
  }
  /** @name 获取焦点 */
  public focus() {
    requestAnimationFrame(() => positions.setCursorEditorLast(this.container));
  }
}

export type IEditorInstance = InstanceType<typeof Editor>;

export { Editor as default };
