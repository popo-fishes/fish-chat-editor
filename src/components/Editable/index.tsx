/*
 * @Date: 2024-09-30 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { forwardRef, useImperativeHandle } from "react";
import type { IEmojiType, IEditableRef, IEditableProps } from "../../types";
import { labelRep } from "../../utils";

import { onCopy, onCut } from "./core";

import useEdit from "./useEdit";

import { editor, transforms } from "../../core";

const Editable = forwardRef<IEditableRef, IEditableProps>((props, ref) => {
  const { placeholder, ...restProps } = props;

  const {
    editRef,
    showTipHolder,

    setTipHolder,
    setRangePosition,

    clearEditor,

    insertEmoji,

    onEditorKeyUp,
    onEditorChange,
    onEditorBlur,
    onEditorFocus,
    onEditorClick,
    onEditorKeydown,
    onEditorPaste,
    onCompositionStart,
    onCompositionEnd,
    onEditorMouseDown
  } = useEdit(props);

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
          onMouseDown={onEditorMouseDown}
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
