/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: 聊天组件
 */
import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import classNames from "classnames";

import { Tooltip, Image } from "antd";
import Editable from "../Editable";
import { useClickAway } from "@/hooks";

import { getImgCdn } from "@/utils";
import { emoji } from "@/config";

import type { IChatEditorProps, IChatEditorRef, IEditableRef, IEmojiType } from "../../types";

const getEmojiData = () => {
  const data: IEmojiType[] = [];
  for (const i in emoji) {
    const bli = i.replace("[", "");
    const cli = bli.replace("]", "");
    data.push({
      url: getImgCdn("faces/" + emoji[i]),
      name: i,
      title: cli
    });
  }
  return data;
};

// 表情数据
const emojiData = getEmojiData();

// 聊天组件
const ChatEditor = forwardRef<IChatEditorRef, IChatEditorProps>((props, ref) => {
  // 解析值
  const { className: _className, placeholder, onChange, onEnterDown, onSend } = props;
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
    <div className={classNames("fb-editor", _className)}>
      {/* 功能区 */}
      <div className="fb-editor-controls">
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
      <div className="fb-chat-op">
        <span className="tip">按Enter键发送，按Ctrl+Enter键换行</span>
        <button className={classNames("btn-send", isSend && "activate")} onClick={onSubmit}>
          发送
        </button>
      </div>
      {/* 表情选择列表 */}
      <div className="fb-emote-pop" ref={modalRef} style={{ display: openEmoji ? "block" : "none" }}>
        <div className="emoji-panel-scroller">
          <div className="emoji-container">
            {emojiData.map((item, index) => (
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
