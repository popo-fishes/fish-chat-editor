/*
 * @Date: 2024-09-30 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: 富文本组件
 */
import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import type { IEmojiType, IEditableRef, IEditableProps } from "../../types";
import { labelRep } from "../../utils";

import { onCopy, onCut } from "./event";

import useEdit from "./useEdit";

import { editor, transforms } from "../../core";

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

    clearEditor,
    init,

    insertEmoji,

    onEditorKeyUp,
    onEditorChange,
    onEditorBlur,
    onEditorFocus,
    onEditorClick,
    onEditorKeydown,
    onEditorPaste,
    onCompositionStart,
    onCompositionEnd
  } = useEdit(props);

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
          const editValue = editor.getText(editRef.current);
          // 返回输入框信息
          return transforms.editTransformSpaceText(editValue);
        },
        setValue: (val) => {
          if (!val || !editRef.current) return;
          // 把文本标签转义：如<div>[爱心]</div> 把这个文本转义为"&lt;div&lt;", newCurrentText 当前光标的节点元素的值
          const repContent = labelRep(val);
          editor.setText(editRef.current, repContent, () => {
            const val = editor.getText(editRef.current);
            // 控制提示
            setTipHolder(val == "");
            // 返回输入框信息
            restProps.onChange?.(transforms.editTransformSpaceText(val));
          });
        },
        clear: () => {
          const curDom = clearEditor();
          // 设置光标位置
          setRangePosition(curDom, 0, true);
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

  /** @name 鼠标按下时 */
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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

  return (
    <div className="fb-editor-container">
      <div className="fb-editor-scroll">
        <div
          className="fb-editor-wrapper"
          ref={editRef}
          contentEditable
          data-fish-editor
          spellCheck
          onPaste={onEditorPaste}
          onBlur={onEditorBlur}
          onFocus={onEditorFocus}
          onInput={onEditorChange}
          onCopy={onCopy}
          onCut={onCut}
          onKeyDown={onEditorKeydown}
          onKeyUp={onEditorKeyUp}
          onCompositionStart={onCompositionStart}
          onMouseDown={onMouseDown}
          onCompositionEnd={onCompositionEnd}
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
