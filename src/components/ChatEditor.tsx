/*
 * @Date: 2025-04-27 13:38:56
 * @Description: Modify here please
 */
import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useMemo, useEffect } from "react";
import classNames from "classnames";
import { Tooltip, Image } from "antd";
import { useClickAway } from "../hooks";

import type { IChatEditorProps, IChatEditorRef } from "../types";

import FishEditor from "../fish-editor";
import { getDefaultEmojiData } from "../config";

/**
 * @name 富文本编辑器
 * @param props
 * @returns
 */
const ChatEditor = forwardRef<IChatEditorRef, IChatEditorProps>((props, ref) => {
  const { onChange, onEnterDown, onSend, emojiList = [], ...restProps } = props;

  const modalRef = useRef<HTMLDivElement>(null);

  const emotionTarget = useRef<HTMLDivElement>(null);

  const [openEmoji, setOpen] = useState<boolean>(false);

  const [isSend, setSend] = useState<boolean>(false);

  const [count, setCount] = useState<number>(0);

  const fishEditor = useRef<FishEditor>(null);

  const domRef = useRef();

  const mergeEmojiList = useMemo(() => {
    const defaultEmojiList = getDefaultEmojiData();
    // 把 defaultEmojiList 和 emojiList 合并去重，优先使用 emojiList 中的表情包
    const mergeEmojiList = [...emojiList, ...defaultEmojiList];
    const uniqueEmojiList = mergeEmojiList.filter((item, index, self) => index === self.findIndex((t) => t.name == item.name));
    fishEditor.current?.setEditorEmojiList(uniqueEmojiList);
    return [...uniqueEmojiList];
  }, [emojiList, fishEditor.current]);

  /**
   * !!! 可以动态监听值，进行多次实例化，但是不建议
   */
  useEffect(() => {
    fishEditor.current = new FishEditor(domRef.current, {
      placeholder: restProps.placeholder,
      minHeight: 75
    });
    return () => {
      if (fishEditor.current == null) return;
      fishEditor.current.destroy();
      fishEditor.current = null;
    };
  }, []);

  const onEditableChange = (fishEditor: FishEditor) => {
    setSend(!fishEditor.isPureTextAndInlineElement());
    setCount(fishEditor.getLength() || 0);
    onChange?.(fishEditor.editor);
  };

  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.on(FishEditor.events.EDITOR_CHANGE, onEditableChange);
    return () => {
      fishEditor.current?.off(FishEditor.events.EDITOR_CHANGE, onEditableChange);
    };
  }, []);

  const onEnterDownEvent = async (editor: FishEditor) => {
    if (!isSend) return;
    onEnterDown?.(editor.editor);
  };

  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.on(FishEditor.events.EDITOR_ENTER_DOWN, onEnterDownEvent);
    return () => {
      fishEditor.current?.off(FishEditor.events.EDITOR_ENTER_DOWN, onEnterDownEvent);
    };
  }, [isSend, onEnterDown]);

  useImperativeHandle(ref, () => {
    return {
      clear: () => fishEditor.current?.clear(),
      focus: () => fishEditor.current?.focus(),
      blur: () => fishEditor.current?.blur(),
      setText: (value: string, cb) => fishEditor.current?.setText(value, false, cb),
      getText: () => fishEditor.current?.getText(),
      fishEditor
    };
  });

  const closeEmojiPop = () => {
    setOpen(false);
  };

  useClickAway(closeEmojiPop, [modalRef, emotionTarget]);

  const onSubmit = useCallback(() => {
    if (!isSend) return;

    if (fishEditor?.current) {
      onSend?.(fishEditor.current.editor);
    }
  }, [onSend, isSend]);

  return (
    <div className={classNames("fb-chat-editor", restProps.className)}>
      <div className="fb-chat-toolbar">
        <Tooltip
          title="表情包"
          overlayStyle={{ pointerEvents: "none" }}
          overlayInnerStyle={{
            fontSize: "12px",
            padding: "5px 12px",
            minHeight: "29px"
          }}
        >
          <div
            className="emotion"
            ref={emotionTarget}
            onClick={() => {
              setOpen(!openEmoji);
            }}
            style={{
              marginRight: "16px"
            }}
          />
        </Tooltip>
        {restProps?.toolbarRender?.()}
      </div>

      <div ref={domRef} style={{ flex: 1, height: 0 }}></div>

      <div className="fb-chat-footer">
        <span className="tip">按Enter键发送，按Ctrl+Enter键换行</span>
        <button className={classNames("btn-send", isSend && "activate")} onClick={onSubmit}>
          发送
        </button>
      </div>

      <div className="fb-chat-emote-pop" ref={modalRef} style={{ display: openEmoji ? "block" : "none" }}>
        <div className="emoji-panel-scroller">
          <div className="emoji-container">
            {mergeEmojiList.map((item, index) => (
              <div
                className="emoji-item"
                title={item.title}
                key={`emoji-item-${index}`}
                onClick={() => {
                  setOpen(false);
                  fishEditor.current?.insertEmoji(item);
                }}
                style={{ lineHeight: "normal" }}
              >
                <Image src={item.url} preview={false} width={28} height={28} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatEditor;
