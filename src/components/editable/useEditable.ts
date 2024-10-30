/*
 * @Date: 2024-10-12 13:45:55
 * @Description: Modify here please
 */
import { useRef, useState, useEffect } from "react";
import type { IEmojiType, IEditableProps, IEditorElement } from "../../types";

import { base, util, range } from "../../core";
import { emojiSize } from "../../config";

import Editor, { type IEditorInstance } from "../../editor";

import { transformsEditNodes } from "./transform";
import { handlePasteTransforms, handleLineFeed } from "./core";
import { removeEditorImageBse64Map } from "./util";

/**
 * https://blog.csdn.net/weixin_45936690/article/details/121654517
 * @contentEditable编辑器，遇见的问题：
 * 1.有些输入法输入中文 || 输入特殊字符时我还在输入拼音时，输入还没结束；会不停的触发onInput事件。导致onInput事件方法里面出现bug
 * 2. 而有些编辑器中文时不会触发onInput：如搜狗输入法
 * 3. 我们需要做个判断 1.onCompositionStart： 启动新的合成会话时，会触发该事件。 例如，可以在用户开始使用拼音IME 输入中文字符后触发此事件
 * 4. 2. onCompositionEnd 完成或取消合成会话时，将触发该事件。例如，可以在用户使用拼音IME 完成输入中文字符后触发此事件
 * 我们在onCompositionStart：是标记正在输入中，必须等onCompositionEnd结束后主动去触发onInput
 */
let isLock = false;

// 表示正在操作换行，需要等等结束
let isLineFeedLock = false;

export default function useEditable(props: IEditableProps) {
  const { ...restProps } = props;
  /** 编辑区域的元素 */
  const editNodeRef = useRef<IEditorElement>(null);
  /** 是否显示提示placeholder */
  const [showTipHolder, setTipHolder] = useState<boolean>(true);
  /** 编辑器实例 */
  const editor = useRef<IEditorInstance | null>(null);

  // 初始化
  useEffect(() => {
    createEditor();
  }, []);

  const createEditor = () => {
    const editorInstance = new Editor(editNodeRef.current, {
      onChange: () => {
        updateValue();
      }
    });
    editor.current = editorInstance;
  };

  /** @name 更新值 */
  const updateValue = (): Promise<boolean> => {
    const hasEmpty = editor.current?.isEditorEmptyNode();
    // 控制提示,为空就提示placeholder
    setTipHolder(hasEmpty);
    restProps.onChange?.(editor.current);

    // 将 removeEditorImageBse64Map 包装成Promise异步执行
    return new Promise((resolve, reject) => {
      removeEditorImageBse64Map(hasEmpty, editNodeRef.current)
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  /** @name 选择插入表情图片 */
  const insertEmoji = (item: IEmojiType) => {
    if (editor.current) {
      // 创建
      const imgNode = base.createChunkEmojiElement(item.url, emojiSize, item.name);

      const currentRange = editor.current.rangeInfo;

      const editorElementNode = util.getNodeOfEditorElementNode(currentRange.startContainer);

      if (!editorElementNode) {
        editor.current.setCursorEditorLast((rowNode) => {
          if (rowNode) {
            const rangeInfo = range.getRange();
            editor.current?.insertNode([imgNode], rangeInfo, (success) => {
              if (success) {
                updateValue();
              }
            });
          }
        });
        return;
      } else {
        editor.current?.insertNode([imgNode], currentRange, (success) => {
          if (success) {
            updateValue();
          }
        });
      }
    }
  };

  /** @name 失去焦点 */
  const onEditorBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const rangeInfo = range.getRange();
    // console.log(rangeInfo);
    if (rangeInfo && editor.current) {
      editor.current.backupRangePosition(rangeInfo.startContainer as HTMLElement, rangeInfo.startOffset);
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

  /** @name 编辑器值变化事件 */
  const onEditorChange = (e: React.CompositionEvent<HTMLDivElement>) => {
    /***
     * 在谷歌浏览器，输入遇见编辑器先清除焦点然后调用focus方法，重新修正光标的位置，会导致，下次输入中文时 onCompositionEnd事件不会触发，导致
     * isLock变量状态有问题，这里先注释掉，不判断了，直接变化值，就去暴露值
     */
    if (isLock) return;

    updateValue();
  };

  /** @name 点击编辑器事件（点击时） */
  const onEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e?.target as any;
    // 如果是表情节点
    const emojiNode = util.getNodeOfEditorEmojiNode(target);
    if (emojiNode) {
      // 选中它
      range.selectNode(emojiNode);
    }
    // 如果是图片节点
    const imageNode = util.getNodeOfEditorImageNode(target);
    if (imageNode) {
      // 选中它
      // range.selectNode(imageNode);
    }

    /**
     * 如果存在光标
     * 点击了编辑器后，如果光标位置节点是一个 块节点，且是一个图片节点，就把光标移动到它的前面的一个兄弟节点身上。
     * 1：要保证图片的块节点不可以输入内容
     * 2：粘贴图片时，我们会在图片节点前面插入了一个文本输入节点。
     */
    // 是一个DOM元素节点，并且存在图片节点
    // if (isDOMElement(target) && findNodeWithImg(target)) {

    //   const pnode = getNodeOfEditorInlineNode(target);

    //   if (pnode) {
    //     // 用户选择的文本范围或光标的位置
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
   * @name 编辑器键盘按下事件
   * @param event
   * @returns
   */
  const onEditorKeydown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keyCode = event.keyCode;
    const rangeInfo = range.getRange();
    // ctrl + Enter换行
    if (event.ctrlKey && keyCode === 13) {
      event.preventDefault();
      event.stopPropagation();

      if (isLineFeedLock) return;

      isLineFeedLock = true;

      // 插入换行符
      handleLineFeed(editor.current, (success) => {
        if (success) {
          updateValue();
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
      restProps.onEnterDown?.(editor.current);
      return;
    }

    /**
     * 处理ctrl+a事件，如果没有内容不能进行选中行的br节点
     */
    if (event.ctrlKey && event.key == "a") {
      if (!range.isSelected() && editor.current && editor.current?.isEditorEmptyNode()) {
        event.preventDefault();
        return;
      }
    }
    /**
     * bug2:
     * 按下删除按键：如果编辑器已经是一个空节点 就 阻止删除按键。不然会把空文本节点给删除了导致BUG
     * 兜底处理,防止骚操作
     */
    if (event.keyCode === 8) {
      /**
       * 是没有选定文本 && 编辑器是一个空节点
       */
      if (!range.isSelected() && editor.current && editor.current?.isEditorEmptyNode()) {
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
  };

  /**
   * @name 键盘按键被松开时发生
   */
  const onEditorKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    transformsEditNodes(editNodeRef.current);
  };

  /** @name 鼠标按下时 */
  const onEditorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e?.target as any;
    // 是一个DOM元素节点，且光标位置为1，并且存在图片节点, 那么就禁止获取焦点。
    // if (isDOMElement(target) && findNodeWithImg(target) && getNodeOfEditorInlineNode(target)) {
    //   e.preventDefault();
    // }
    // 获取文档的选区

    // if (selection && selection.rangeCount > 0) {
    //   const range = selection.getRangeAt(0);
    //   console.log("选区范围:", range);
    //   // 在这里可以对range进行进一步的操作
    // }
  };

  /**
   * @name 编辑器的粘贴事件
   */
  const onEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    /** 处理粘贴事件的内容转换 */
    handlePasteTransforms(e, editor.current, restProps.beforePasteImage, (success) => {
      if (success) {
        updateValue();
      }
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
    editNodeRef,
    showTipHolder,
    editor,

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
