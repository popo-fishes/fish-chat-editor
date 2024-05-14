/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: 富文本组件
 */
import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import type { ReactNode } from "react";
import { Tooltip, Image } from "antd";
import classNames from "classnames";
import Editable from "../Editable";

import emoji from "../../config/emoji";
import { getImgCdn } from "../../utils";
import { ItemType, IEditInputRef } from "../../types";
import { useClickAway } from "../../hooks/useClickAway";

export interface IEditorProps {
  /** 自定义工具栏内容 */
  toolbarRender?: () => ReactNode;
  /** 扩展类名 */
  className?: string;
  /** 键盘回车事件 */
  enterDown?: (val: string) => void;
  /** 输入框内容变化时的回调 */
  onChange?: (val: string) => void;
  /** 点击发送按钮事件 */
  onSend?: (val: string) => void;
  /** 提示占位符 */
  placeholder?: string;
}

export interface IEditRef extends IEditInputRef {}

const getEmojiData = () => {
  const data: ItemType[] = [];
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
const data = getEmojiData();

// 富文本组件
const ChatEditor = forwardRef<IEditRef, IEditorProps>((props, ref) => {
  // 解析值
  const { className: _className, placeholder } = props;
  // 输入框控制器
  const editInputRef = useRef<IEditInputRef>(null);
  // 表情的弹窗
  const modalRef = useRef<HTMLDivElement>(null);
  // 触发器
  const emotionTarget = useRef<HTMLDivElement>(null);
  // 显示表情弹窗
  const [openEmoji, setOpen] = useState<boolean>(false);
  // 可以点击发送按钮？
  const [isSend, setSend] = useState<boolean>(false);

  // 暴露更新聊天记录的方法，给父组件调用
  useImperativeHandle(ref, () => editInputRef.current as IEditInputRef);

  // 设置表情弹窗隐藏
  const closeEmojiPop = () => {
    setOpen(false);
  };

  // 点击外面元素隐藏弹窗
  useClickAway(closeEmojiPop, [modalRef, emotionTarget]);

  // 点击回车事件，暴露给外面
  const enterDownClick = useCallback(async () => {
    if (!isSend) return;
    // 获取输入框的值
    const msgValue = editInputRef.current?.getValue();
    props?.enterDown?.(msgValue as string);
  }, [props?.enterDown, isSend]);

  // 值变化时
  const editChange = useCallback(
    (v) => {
      setSend(!!v);
      props?.onChange?.(v);
    },
    [props?.onChange]
  );

  // 点击富文本时
  const editInputClick = useCallback(() => {
    setOpen(false);
  }, []);

  // 发送消息
  const onMsgSubmit = useCallback(async () => {
    // 没有输入值
    if (!isSend) return;
    // 获取输入框的值
    const msgValue = editInputRef.current?.getValue();
    // 发送消息
    props?.onSend?.(msgValue as string);
  }, [props?.onSend, isSend]);

  return (
    <div className={classNames("fb-editor", _className)}>
      {/* 功能区 */}
      <div className="fb-editor-controls">
        {/* 默认工具栏 */}
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
            className="btn-emotion"
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
      <Editable placeholder={placeholder} ref={editInputRef} onChange={editChange} enterDown={enterDownClick} click={editInputClick} />
      {/* 发送区 */}
      <div className="chat-op">
        <span className="tip">按Enter键发送，按Ctrl+Enter键换行</span>
        <button className={classNames("btn-send", isSend && "activate")} onClick={onMsgSubmit}>
          发送
        </button>
      </div>
      {/* 表情选择列表 */}
      <div className="emote-box" ref={modalRef} style={{ display: openEmoji ? "block" : "none" }}>
        <div className="emoji-panel-scroller">
          <div className="emoji-container">
            {data?.map((item, index) => (
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
