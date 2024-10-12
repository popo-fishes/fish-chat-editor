/*
 * @Date: 2024-09-30 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: 富文本组件
 */
import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import type { IEmojiType, IEditableRef, IEditableProps } from "../../types";
import { labelRep } from "../../utils";

import { onKeyUp, handlePasteTransforms, onCopy, onCut, handleLineFeed } from "./event";

import useEditable from "./use-editable";

import { dom, isNode, range, editor, util, base, transforms } from "../../core";

const { isEmptyEditNode, isDOMElement, isImgNode } = isNode;

const { findNodeWithImg, findNodeWithInline, findNodeWithTextNode } = util;

const { getText, setText } = editor;
const { editTransformSpaceText } = transforms;

// 输入框值变化时，我需要对内容进行转换，必须等转换结束才可以在执行，用来判断的
let isFlag = false;

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

/**
 * @name 富文本组件
 */
const Editable = forwardRef<IEditableRef, IEditableProps>((props, ref) => {
  const { placeholder, ...restProps } = props;

  const {
    editRef,
    showTipHolder,

    setTipHolder,
    setRangePosition,
    backupRangePosition,
    clearEditor,
    init,

    insertEmoji
  } = useEditable(props);

  // 初始化
  useEffect(() => {
    init();
  }, []);

  useImperativeHandle(
    ref,
    () =>
      ({
        insertEmoji: (item: IEmojiType) => insertEmoji(item),
        getValue: () => {
          const editValue = getText(editRef.current);
          // 返回输入框信息
          return editTransformSpaceText(editValue);
        },
        setValue: (val) => {
          if (!val || !editRef.current) return;
          // 把文本标签转义：如<div>[爱心]</div> 把这个文本转义为"&lt;div&lt;", newCurrentText 当前光标的节点元素的值
          const repContent = labelRep(val);
          setText(editRef.current, repContent, () => {
            const val = getText(editRef.current);
            // 控制提示
            setTipHolder(val == "");
            // 返回输入框信息
            restProps.onChange?.(editTransformSpaceText(val));
          });
        },
        clear: () => {
          const curDom = clearEditor();
          // 设置光标位置
          setRangePosition(curDom);
          // 失去焦点
          editRef?.current?.blur();
          restProps.onChange?.("");
        },
        focus: () => {
          requestAnimationFrame(() => {
            editRef?.current?.focus();
          });
        },
        blur: () => editRef?.current?.blur()
      }) as IEditableRef
  );

  /** @name 失去焦点 */
  const onEditorBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // 备份当前光标位置
    backupRangePosition();
    // 用户选择的文本范围或光标的当前位置
    const selection = window.getSelection();
    // 如果有选中
    if (!selection?.isCollapsed) {
      // 清除选定对象的所有光标对象
      selection?.removeAllRanges();
    }
  };

  /** @name 获取焦点 */
  const onEditorFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    // const focusedElement = document.activeElement;
    // console.log(event, document.activeElement);
  };

  /** @name 输入框值变化onChange事件 */
  const onEditorInputChange = (e: React.CompositionEvent<HTMLDivElement>) => {
    // 表示正在输入中文，还没输入完毕，不能执行下面逻辑  ||  必须等到转换完成，才继续执行

    /***
     * 在谷歌浏览器，输入遇见输入框先清除焦点然后调用focus方法，重新修正光标的位置，会导致，下次输入中文时 onCompositionEnd事件不会触发，导致
     * isLock变量状态有问题，这里先注释掉，不判断了，直接变化值，就去暴露值
     */
    if (isLock || isFlag) return;

    // 标记正在输入转换，必须等到转换完成，才继续开启状态
    // isFlag = true;
    /**
     * 有些电脑输入框卡，可能原因就在这里，v2版本先注释掉转换的方法
       // 转换输入框的内容，比如[爱心]转为表情图片
      handleInputTransforms(editRef.current, async () => {
        // 获取输入框的值，主动触发输入框值变化
        const val = getText(editRef.current);
        // 控制提示
        setTipHolder(val == "");
        // 暴露值
        restProps.onChange?.(editTransformSpaceText(val));
        // 必须等到转换完成，才继续开启状态
        isFlag = false;
      });
     */
    // 获取输入框的值，主动触发输入框值变化
    const val = getText(editRef.current);
    // 控制提示
    setTipHolder(val == "");
    // 暴露值
    restProps.onChange?.(editTransformSpaceText(val));

    /**
     * 判断是否只剩下一个节点，且不存在文本节点, 那就添加一个子节点
     * 主要解决删除内容把文本节点全部删完了
     */
    if (isEmptyEditNode(editRef.current) && !findNodeWithTextNode(editRef.current)) {
      if (editRef.current.firstChild) {
        dom.addTargetElement(editRef.current.firstChild as any, [base.createChunkTextElement(false)]);
      }
    }
  };

  /** @name 点击输入框事件（点击时） */
  const onEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 点击时，如果点击到的是表情图片需要吧当前光标变为点击图片的前面
    const target = e?.target as any;
    // 不包含是图片节点
    if (target?.nodeName == "IMG" && !isImgNode(target)) {
      range.setRangeNode(target, "before", () => {
        // 重新聚焦输入框
        editRef?.current?.focus();
      });
      return;
    }
    // 点击图片节点，失去光标
    if (isImgNode(target)) {
      // 用户选择的文本范围或光标的当前位置
      const selection = window.getSelection();
      // 清除选定对象的所有光标对象
      selection?.removeAllRanges();
      return;
    }

    /**
     * 如果存在光标
     * 点击了输入框后，如果当前光标位置节点是一个 块节点，且是一个图片节点，就把当前光标移动到它的前面的一个兄弟节点身上。
     * 1：要保证图片的块节点不可以输入内容
     * 2：粘贴图片时，我们会在图片节点前面插入了一个文本输入节点。
     */
    // 是一个DOM元素节点，并且存在图片节点
    if (isDOMElement(target) && findNodeWithImg(target)) {
      // 必须是内联节点
      const pnode = findNodeWithInline(target);

      if (pnode) {
        // 用户选择的文本范围或光标的当前位置
        const selection = window.getSelection();
        // 清除选定对象的所有光标对象
        selection?.removeAllRanges();

        const textNode = base.createChunkTextElement();

        pnode.insertAdjacentElement("afterend", textNode);

        range.setRangeNode(textNode, "after", () => {});
      }
    }
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
      // 插入换行符
      handleLineFeed(editRef.current, () => {
        const isFlag = isEmptyEditNode(editRef.current);
        setTipHolder(isFlag);
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
      const selection = window.getSelection();
      // 如果当前已经是一个空节点 就 阻止事件 不然会把我的空文本节点给删除了导致BUG
      if (selection?.isCollapsed && isEmptyEditNode(editRef.current)) {
        event.preventDefault();
        return;
      }
    }
  };

  /**
   * @name 输入框的粘贴事件
   */
  const onPasteChange = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    handlePasteTransforms(e, editRef.current, () => {
      // 获取输入框的值，主动触发输入框值变化
      const val = getText(editRef.current);
      // 控制提示
      setTipHolder(val == "");
      // 暴露值
      restProps.onChange?.(editTransformSpaceText(val));
    });
  };

  /** @name 鼠标按下时 */
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e?.target as any;
    // 是一个DOM元素节点，且光标位置为1，并且存在图片节点, 那么就禁止获取焦点。
    if (isDOMElement(target) && findNodeWithImg(target) && findNodeWithInline(target)) {
      e.preventDefault();
    }
    // 获取当前文档的选区
    const selection = window.getSelection();

    // if (selection && selection.rangeCount > 0) {
    //   const range = selection.getRangeAt(0);
    //   console.log("选区范围:", range);
    //   // 在这里可以对range进行进一步的操作
    // }
  };

  return (
    <div className="fb-editor-container">
      <div className="fb-editor-scroll">
        <div
          className="fb-editor-wrapper"
          ref={editRef}
          contentEditable
          data-fish-editor
          spellCheck
          onPaste={onPasteChange}
          onBlur={onEditorBlur}
          onFocus={onEditorFocus}
          onInput={onEditorInputChange}
          onCopy={onCopy}
          onCut={onCut}
          onKeyDown={onEditorKeydown}
          onKeyUp={onKeyUp}
          onCompositionStart={(e) => {
            // 标记正在输入中文
            isLock = true;
          }}
          onMouseDown={onMouseDown}
          onCompositionEnd={(e) => {
            // 标记正在输入中文, 结束以后再去触发onInput
            isLock = false;
            // 在调用
            onEditorInputChange(e);
          }}
          onClick={(e) => {
            e.preventDefault();
            onEditorClick(e);
            restProps.onClick?.();
          }}
          onDrop={(e) => {
            // 禁用拖放操作, 如果拖动输入框内的图片，会导致吧图片的地址输入到 富文本中
            e.preventDefault();
            return false;
          }}
          onDragOver={(e) => {
            // 禁用拖放操作， 如果拖动输入框内的图片，会导致吧图片的地址输入到 富文本中
            e.preventDefault();
            return false;
          }}
          onContextMenu={(e) => {
            // 禁止鼠标右键
            e.preventDefault();
          }}
        />
      </div>
      <div className="fb-tip-placeholder" style={{ display: showTipHolder ? "block" : "none" }}>
        {placeholder == "" ? "" : placeholder || "请输入发送的消息"}
      </div>
    </div>
  );
});

export default Editable;
