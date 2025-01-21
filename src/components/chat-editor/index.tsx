/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useMemo, useEffect } from "react";
import classNames from "classnames";

import { Tooltip, Image } from "antd";
import { useClickAway } from "../../hooks";

import { setEmojiData } from "../../utils";
import { emoji as defaultEmojiData } from "../../config";

import type { IChatEditorProps, IChatEditorRef, IEmojiType } from "../../types";

import FishEditor from "../../fish-editor";

const ChatWrapper = forwardRef<IChatEditorRef, IChatEditorProps>((props, ref) => {
  // 解析值
  const { onChange, onEnterDown, onSend, emojiList = [], ...restProps } = props;
  // 表情的弹窗
  const modalRef = useRef<HTMLDivElement>(null);
  // 触发器
  const emotionTarget = useRef<HTMLDivElement>(null);
  // 显示表情弹窗
  const [openEmoji, setOpen] = useState<boolean>(false);
  // 可以点击发送按钮？?
  const [isSend, setSend] = useState<boolean>(false);

  const fishEditor = useRef<FishEditor>(null);
  const demoref = useRef<HTMLDivElement>(null);

  const mergeEmojiList = useMemo(() => {
    // 如果外面传递了表情数据用外面的
    if (emojiList?.length) {
      setEmojiData([...emojiList]);
      return [...emojiList];
    }

    const data: IEmojiType[] = [];
    for (const i in defaultEmojiData) {
      const bli = i.replace("[", "");
      const cli = bli.replace("]", "");
      data.push({
        url: `http://43.136.119.145:83/image/${defaultEmojiData[i]}`,
        name: i,
        title: cli
      });
    }
    setEmojiData(data);
    return data;
  }, [emojiList]);

  useEffect(() => {
    fishEditor.current = new FishEditor(demoref.current, {
      placeholder: restProps.placeholder,
      modules: {
        uploader: {
          beforeUpload: restProps.beforePasteImage || null
        },
        input: {
          matchWordsList: ["哈哈"]
        }
      }
    });
    return () => {
      if (fishEditor.current == null) return;
      fishEditor.current.destroy();
      fishEditor.current = null;
    };
  }, []);

  /** @name 富文本值变化时 */
  const onEditableChange = (fishEditor: FishEditor) => {
    setSend(!fishEditor.isEmpty());
    onChange?.(fishEditor.editor);
  };

  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.on(FishEditor.events.EDITOR_CHANGE, onEditableChange);
    return () => {
      fishEditor.current?.off(FishEditor.events.EDITOR_CHANGE, onEditableChange);
    };
  }, []);

  /** @name 点击回车事件 */
  const onEnterDownEvent = (fishEditor: FishEditor) => {
    if (!isSend) return;
    onEnterDown?.(fishEditor.editor);
  };

  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.on(FishEditor.events.EDITOR_ENTER_DOWN, onEnterDownEvent);
    return () => {
      fishEditor.current?.off(FishEditor.events.EDITOR_ENTER_DOWN, onEnterDownEvent);
    };
  }, [isSend, onEnterDown]);

  /** @name 暴露方法 */
  useImperativeHandle(ref, () => {
    return {
      clear: () => fishEditor.current?.clear(),
      focus: () => fishEditor.current?.focus(),
      blur: () => fishEditor.current?.blur(),
      setText: (value: string) => fishEditor.current?.setText(value),
      fishEditor
    };
  });

  /** @name 设置表情弹窗隐藏 */
  const closeEmojiPop = () => {
    setOpen(false);
  };

  /** @name 点击外面元素隐藏弹窗 */
  useClickAway(closeEmojiPop, [modalRef, emotionTarget]);

  /** @name 发送消息 */
  const onSubmit = useCallback(() => {
    // 没有输入值
    if (!isSend) return;
    if (fishEditor?.current) {
      // 发送消息
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
          />
        </Tooltip>
        {restProps?.toolbarRender?.()}
      </div>

      <div ref={demoref}></div>

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
              >
                <Image src={item.url} preview={false} width={22} height={22} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatWrapper;
