/*
 * @Date: 2024-10-12 13:45:55
 * @Description: Modify here please
 */
import { useRef, useState, useEffect } from "react";
import type { IEmojiType, IEditableProps, IEditorElement } from "../../types";

import { base, isNode, util, range, editor, IRange, dom, transforms } from "../../core";

import { transformsEditNodes } from "./transforms";
import { handlePasteTransforms, handleLineFeed } from "./core";

// 备份当前的光标位置
let currentRange: IRange = null;

/**
 * https://blog.csdn.net/weixin_45936690/article/details/121654517
 * @contentEditable输入框，遇见的问题：
 * 1.有些输入法输入中文 || 输入特殊字符时我还在输入拼音时，输入还没结束；会不停的触发onInput事件。导致onInput事件方法里面出现bug
 * 2. 而有些输入框中文时不会触发onInput：如搜狗输入法
 * 3. 我们需要做个判断 1.onCompositionStart： 启动新的合成会话时，会触发该事件。 例如，可以在用户开始使用拼音IME 输入中文字符后触发此事件
 * 4. 2. onCompositionEnd 完成或取消当前合成会话时，将触发该事件。例如，可以在用户使用拼音IME 完成输入中文字符后触发此事件
 * 我们在onCompositionStart：是标记正在输入中，必须等onCompositionEnd结束后主动去触发onInput
 */
let isLock = false;

// 表示正在操作换行，需要等等结束
let isLineFeedLock = false;

export default function useEdit(props: IEditableProps) {
  const { ...restProps } = props;

  /** 用于操作聊天输入框元素 */
  const editRef = useRef<IEditorElement>(null);
  /** 是否显示提示placeholder */
  const [showTipHolder, setTipHolder] = useState<boolean>(true);

  // 初始化
  useEffect(() => {
    init();
  }, []);

  /** @name 初始化编辑器 */
  const init = async () => {
    const editor = editRef.current;
    if (!editor) return;

    // 清空内容
    const curDom = clearEditor();
    // 设置光标的位置
    setRangePosition(curDom, 0, true);
  };

  /** @name 清空输入框的值 */
  const clearEditor = (): HTMLParagraphElement | null => {
    const node = base.createLineElement();
    if (!editRef.current) return null;
    editRef.current.innerHTML = ""; // 清空所有子节点
    dom.toTargetAddNodes(editRef.current, [node]);
    // 设置提示
    setTipHolder(true);
    return node;
  };

  /** @name 设置光标的位置 */
  const setRangePosition = (curDom: HTMLElement, startOffset: number, isReset?: boolean) => {
    let dom = curDom;
    if (isNode.isEditElement(curDom) && isReset) {
      dom = (curDom as any).firstChild;
    }
    // 光标位置为开头
    currentRange = {
      startContainer: dom,
      startOffset: startOffset || 0,
      endContainer: dom,
      endOffset: 0,
      anchorNode: dom
    };
  };

  /** @name 选择插入表情图片 */
  const insertEmoji = (item: IEmojiType) => {
    const editorElementNode = util.getNodeOfEditorElementNode(currentRange.startContainer);
    if (!editorElementNode) {
      // 修正光标位置
      range.amendRangePosition(editRef.current, (node) => {
        if (node) {
          // 设置当前光标节点
          setRangePosition(node, 0);
          insertEmoji(item);
        }
      });
      return;
    }
    // 创建
    const node = base.createChunkEmojilement(item.url, 18, 18, item.name);
    editor.insertNode([node], currentRange);
  };

  /** @name 失去焦点 */
  const onEditorBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const rangeInfo = range.getRange();
    if (rangeInfo) {
      console.log(rangeInfo);
      // 备份当前光标位置
      setRangePosition(rangeInfo.startContainer as HTMLElement, rangeInfo.startOffset);
    }
    // 如果有选中
    if (range.isSelected()) {
      // 清除选定对象的所有光标对象
      range?.removeAllRanges();
    }
  };

  /** @name 获取焦点 */
  const onEditorFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    // const focusedElement = document.activeElement;
    // console.log(event, document.activeElement);
  };

  /** @name 输入框值变化onChange事件 */
  const onEditorChange = (e: React.CompositionEvent<HTMLDivElement>) => {
    // 获取输入框的值，主动触发输入框值变化
    const val = editor.getText(editRef.current);
    // 控制提示
    setTipHolder(val == "");
    // 暴露值
    restProps.onChange?.(transforms.editTransformSpaceText(val));
  };

  /** @name 点击输入框事件（点击时） */
  const onEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e?.target as any;
    // 如果是表情节点
    const emojiNode = util.getNodeOfEditorEmojiNode(target);
    if (emojiNode) {
      // 选中它
      range.selectNode(emojiNode);
    }

    /**
     * 如果存在光标
     * 点击了输入框后，如果当前光标位置节点是一个 块节点，且是一个图片节点，就把当前光标移动到它的前面的一个兄弟节点身上。
     * 1：要保证图片的块节点不可以输入内容
     * 2：粘贴图片时，我们会在图片节点前面插入了一个文本输入节点。
     */
    // 是一个DOM元素节点，并且存在图片节点
    // if (isDOMElement(target) && findNodeWithImg(target)) {

    //   const pnode = getNodeOfEditorInlineNode(target);

    //   if (pnode) {
    //     // 用户选择的文本范围或光标的当前位置
    //     const selection = window.getSelection();
    //     // 清除选定对象的所有光标对象
    //     selection?.removeAllRanges();

    //     const textNode = base.createChunkTextElement();

    //     pnode.insertAdjacentElement("afterend", textNode);

    //     range.setRangeNode(textNode, "after", () => {});
    //   }
    // }
  };

  /**
   * @name 输入框键盘按下事件
   * @param event
   * @returns
   */
  const onEditorKeydown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keyCode = event.keyCode;
    // ctrl + Enter换行
    if (event.ctrlKey && keyCode === 13) {
      event.preventDefault();
      event.stopPropagation();

      if (isLineFeedLock) return;

      isLineFeedLock = true;

      // 插入换行符
      handleLineFeed(editRef.current, (success) => {
        if (success) {
          const isFlag = isNode.isEmptyEditNode(editRef.current);
          setTipHolder(isFlag);
        }
        isLineFeedLock = false;
      });

      return;
    }
    if (keyCode === 13) {
      // Enter发生消息
      event.preventDefault();
      event.stopPropagation();
      // 执行回车事件给父组件
      restProps.onEnterDown?.();
      return;
    }
    // 按下删除按键
    if (event.keyCode === 8) {
      // 如果当前已经是一个空节点 就 阻止事件 不然会把空文本节点给删除了导致BUG
      if (!range.isSelected() && isNode.isEmptyEditNode(editRef.current)) {
        event.preventDefault();
        return;
      }
    }
  };

  /**
   * @name 键盘按键被松开时发生
   * !!! 非常重要的边角异常-处理方法
   */
  const onEditorKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    transformsEditNodes(editRef.current);
  };

  /** @name 鼠标按下时 */
  const onEditorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e?.target as any;
    // 是一个DOM元素节点，且光标位置为1，并且存在图片节点, 那么就禁止获取焦点。
    // if (isDOMElement(target) && findNodeWithImg(target) && getNodeOfEditorInlineNode(target)) {
    //   e.preventDefault();
    // }
    // 获取当前文档的选区

    // if (selection && selection.rangeCount > 0) {
    //   const range = selection.getRangeAt(0);
    //   console.log("选区范围:", range);
    //   // 在这里可以对range进行进一步的操作
    // }
  };

  /**
   * @name 输入框的粘贴事件
   */
  const onEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    handlePasteTransforms(e, editRef.current, () => {
      // 获取输入框的值，主动触发输入框值变化
      const val = editor.getText(editRef.current);
      // 控制提示
      setTipHolder(val == "");
      // 暴露值
      restProps.onChange?.(transforms.editTransformSpaceText(val));
    });
  };

  const onCompositionStart = (e: React.CompositionEvent<HTMLDivElement>) => {
    // 标记正在输入中文
    isLock = true;
  };

  const onCompositionEnd = (e: React.CompositionEvent<HTMLDivElement>) => {
    // 标记正在输入中文, 结束以后再去触发onInput
    isLock = false;
    // 在调用
    onEditorChange(e);
  };

  return {
    editRef,
    showTipHolder,

    setTipHolder,
    setRangePosition,

    clearEditor,

    insertEmoji,

    onEditorKeyUp,
    onEditorBlur,
    onEditorFocus,
    onEditorChange,
    onEditorClick,
    onEditorKeydown,
    onCompositionStart,
    onCompositionEnd,
    onEditorMouseDown,
    onEditorPaste
  };
}
