/*
 * @Date: 2024-09-30 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { forwardRef, useImperativeHandle } from "react";
import type { IEmojiType, IEditableRef, IEditableProps, IEditorElement } from "../../types";
import { editor, util } from "../../core";

import { onCopy, onCut } from "./core";
import { amendRangePosition } from "./util";

import useEdit from "./useEdit";

const Editor = forwardRef<IEditableRef, IEditableProps>((props, ref) => {
  const { placeholder, ...restProps } = props;

  const {
    editNodeRef,
    showTipHolder,

    setEditText,

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
  } = useEdit(props);

  useImperativeHandle(
    ref,
    () =>
      ({
        editor: editor,
        insertEmoji: (item: IEmojiType) => insertEmoji(item),
        setText: (content) => setEditText(content),
        clear: () => {
          // 清除内容
          clearEditor();
          // 失去焦点
          editNodeRef.current?.blur();
          restProps.onChange?.(editor);
        },
        focus: () => {
          requestAnimationFrame(() => amendRangePosition(editNodeRef.current));
        },
        blur: () => editNodeRef.current?.blur()
      }) as IEditableRef
  );

  return (
    <div className="fb-editor-container">
      <div className="fb-editor-scroll">
        <div
          className="fb-editor"
          id="fa-editor"
          ref={(instance: IEditorElement | null) => util.setEditorInstance(instance)}
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
      <div className="fb-placeholder" style={{ display: showTipHolder ? "block" : "none" }}>
        {placeholder == "" ? "" : placeholder || "请输入发送的消息"}
      </div>
    </div>
  );
});

export default Editor;
