/*
 * @Date: 2024-09-30 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { forwardRef, useImperativeHandle } from "react";
import type { IEmojiType, IEditableRef, IEditableProps, IEditorElement } from "../../types";

import { onCopy, onCut } from "./core";

import useEditable from "./useEditable";

const Editable = forwardRef<IEditableRef, IEditableProps>((props, ref) => {
  const { placeholder, ...restProps } = props;

  const {
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
  } = useEditable(props);

  useImperativeHandle(
    ref,
    () =>
      ({
        editor,
        insertEmoji: (item: IEmojiType) => insertEmoji(item),
        clear: () => editor.current?.clear(),
        focus: () => editor.current?.focus(),
        blur: () => editor.current?.blur()
      }) as IEditableRef
  );

  return (
    <div className="fb-editor-container">
      <div className="fb-editor-scroll">
        <div
          className="fb-editor"
          id="fa-editor"
          ref={(instance: IEditorElement | null) => (editNodeRef.current = instance)}
          contentEditable
          data-fish-editor
          spellCheck={false}
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
            // 禁用拖放操作, 如果拖动编辑器内的图片，会导致吧图片的地址输入到 富文本中
            e.preventDefault();
            return false;
          }}
          onDragOver={(e) => {
            // 禁用拖放操作， 如果拖动编辑器内的图片，会导致吧图片的地址输入到 富文本中
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

export default Editable;
