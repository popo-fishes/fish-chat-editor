/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import classNames from "classnames";

import { Tooltip, Image } from "antd";
import Editable from "../editable";
import { useClickAway } from "../../hooks";

import { setEmojiData } from "../../utils";
import { emoji as defaultEmojiData } from "../../config";

import type { IChatEditorProps, IChatEditorRef, IEditableRef, IEmojiType } from "../../types";

const ChatEditor = forwardRef<IChatEditorRef, IChatEditorProps>((props, ref) => {
  // 解析值
  const { placeholder, onChange, onEnterDown, onSend, emojiList = [], ...restProps } = props;
  // 输入框控制器
  const editInputRef = useRef<IEditableRef>(null);
  // 表情的弹窗
  const modalRef = useRef<HTMLDivElement>(null);
  // 触发器
  const emotionTarget = useRef<HTMLDivElement>(null);
  // 显示表情弹窗
  const [openEmoji, setOpen] = useState<boolean>(false);
  // 可以点击发送按钮？?
  const [isSend, setSend] = useState<boolean>(false);

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

  /** @name 暴露方法 */
  useImperativeHandle(ref, () => {
    return {
      ...(editInputRef.current as IEditableRef)
      /**
       *  额外的部分
       *  ...
       */
    } as IChatEditorRef;
  });

  /** @name 设置表情弹窗隐藏 */
  const closeEmojiPop = () => {
    setOpen(false);
  };

  /** @name 点击外面元素隐藏弹窗 */
  useClickAway(closeEmojiPop, [modalRef, emotionTarget]);

  /** @name 点击回车事件 */
  const onEnterDownEvent = useCallback(async () => {
    if (!isSend) return;
    // 获取输入框的值
    const msgValue = editInputRef.current?.getValue();
    onEnterDown?.(msgValue as string);
  }, [onEnterDown, isSend]);

  /** @name 富文本值变化时 */
  const onEditableChange = useCallback(
    (v) => {
      setSend(!!v);
      onChange?.(v);
    },
    [onChange]
  );

  /** @name 点击富文本时 */
  const onEditableClick = useCallback(() => {
    // 关闭菜单
    setOpen(false);
  }, []);

  /** @name 发送消息 */
  const onSubmit = useCallback(async () => {
    // 没有输入值
    if (!isSend) return;
    // 获取输入框的值
    const msgValue = editInputRef.current?.getValue();
    // 发送消息
    onSend?.(msgValue as string);
  }, [onSend, isSend]);

  return (
    <div className={classNames("fb-chat-wrapper", restProps.className)}>
      {/* 功能区 */}
      <div className="fb-chat-toolbar">
        {/* 默认工具栏 */}
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
        {/* 可扩展 */}
        {props?.toolbarRender?.()}
      </div>
      {/* 编辑框 */}
      <Editable placeholder={placeholder} ref={editInputRef} onChange={onEditableChange} onEnterDown={onEnterDownEvent} onClick={onEditableClick} />
      {/* 发送区 */}
      <div className="fb-chat-footer">
        <span className="tip">按Enter键发送，按Ctrl+Enter键换行</span>
        <button className={classNames("btn-send", isSend && "activate")} onClick={onSubmit}>
          发送
        </button>
      </div>
      {/* 表情选择列表 */}
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
                  editInputRef.current?.insertEmoji(item);
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

export default ChatEditor;
