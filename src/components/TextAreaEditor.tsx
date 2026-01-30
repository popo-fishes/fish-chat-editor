import React, { memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import FishEditor, { labelRep } from "../fish-editor";
import { useDragResize } from "../hooks";
import classNames from "classnames";
import isFunction from "lodash/isFunction";

type Props = {
  /** 最小高度 */
  minHeight: number;
  /** 内容 */
  value?: string;
  /** 最大高度 */
  maxHeight?: number;
  /** 最大字数限制  */
  maxLength?: number;
  /** 是否禁用状态 */
  disabled?: boolean;
  /** 提示文字 */
  placeholder?: string;
  /** 敏感词列表 */
  matchWordsList?: string[];
  textAreaEditorRef?: any;
  classnames?: string;
  onBlur?: (event) => void;
  /** 值变化时 */
  onChange?: (value: string) => void;
  /** 超出限制后回调 */
  onMaxLength?: () => void;
  /** 自定义计算当前输入的字数 */
  customInputLength?: (realNum: number) => number;
};

/**
 * @name 富文本-文本域
 * @param props
 * @returns
 */
const TextAreaEditor = (props: Props) => {
  const {
    value = "",
    maxLength,
    maxHeight,
    minHeight,
    disabled,
    placeholder = "",
    matchWordsList = [],
    onMaxLength,
    textAreaEditorRef,
    onBlur,
    onChange,
    customInputLength
  } = props;
  const fishEditor = useRef<FishEditor>();
  const demoref = useRef<HTMLDivElement>();

  // 触发字符长度检测变量
  const [inputVal, setInputVal] = useState("");
  const [isfocus, setFocus] = useState(false);
  // 富文本内容备份（主要用于设置敏感词需求）
  const inputValRef = useRef("");

  const { containerRef, handleMouseDown } = useDragResize({
    minHeight,
    maxHeight,
    onChange: (height) => {
      // console.log('当前高度:', height)
    }
  });

  useImperativeHandle(textAreaEditorRef, () => {
    return {
      /**
       * @name 获取值
       * @param isPure  ture 表示不要换行符,false 表示要换行符
       * @returns
       */
      getText: (isPure?: boolean) => {
        const text = fishEditor.current?.getText(isPure);
        const repText = labelRep(text, true);
        return repText || "";
      },
      /**
       * @name 设置值
       * @param value
       */
      setText: (value: string) => {
        fishEditor.current.setText?.(value);
        inputValRef.current = value;
      }
    };
  }, []);

  /** @name 初始化 FishEditor 富文本 */
  useEffect(() => {
    fishEditor.current = new FishEditor(demoref.current, {
      placeholder: placeholder,
      maxLength: maxLength,
      minHeight: 0,
      isLineBreakCount: true,
      modules: {
        clipboard: {
          isPasteFile: false
        },
        keyboard: {
          isEnterNewLine: true
        }
      }
    });
    return () => {
      if (fishEditor.current == null) return;
      fishEditor.current.destroy();
      fishEditor.current = null;
    };
  }, []);

  // 动态设置富文本的提示信息
  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.setPlaceholder(placeholder);
  }, [placeholder]);

  // 动态设置富文本是否可以编辑
  useEffect(() => {
    if (!fishEditor.current) return;
    if (disabled) {
      fishEditor.current.disable();
    } else {
      fishEditor.current.enable();
    }
  }, [disabled]);

  /** @name 初始化时回显数据 */
  useEffect(() => {
    if (!fishEditor.current) return;
    // console.log(value, inputValRef.current)

    if (inputValRef.current !== value) {
      inputValRef.current = value;
      // 设置值
      fishEditor.current?.setText?.(value);
    }
  }, [value]);

  // 设置敏感词
  useEffect(() => {
    if (!fishEditor.current) return;
    const input = fishEditor.current.getModule("input") as any;
    // 把旧的富文本内容设置回去
    const val = inputValRef.current;
    // 先获取富文本已经滚动的高度, 设置值以后滚动回去
    const scrollTop = fishEditor.current.getScrollDomTop();
    input.setMatchWords(matchWordsList, () => {
      if (val) {
        fishEditor.current?.setText?.(val);
        // 滚动回去，比如在top 200的地方失去焦点的 触发敏感词，设置完文本内容后，滚动回去
        setTimeout(() => {
          fishEditor.current.setScrollDomTop(scrollTop);
        }, 20);
      }
    });
  }, [JSON.stringify(matchWordsList)]);

  /** @name 监听编辑器内容变化事件 */
  const onEditableChange = () => {
    const text = fishEditor.current?.getText();
    const repText = labelRep(text, true);
    // console.log(repText, 'AAA3333')
    requestAnimationFrame(() => {
      // console.log(repText, 'AAA4444')
      inputValRef.current = repText;
      setInputVal(repText);
      // 更新内容
      onChange?.(repText);
    });
  };

  // 超出限制后 回调
  const handleOnMaxLength = () => {
    onMaxLength?.();
  };

  const onFocus = () => {
    setFocus(true);
  };

  const onProtoBlur = (e) => {
    setFocus(false);
    onBlur?.(e);
  };

  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.on(FishEditor.events.EDITOR_FOCUS, onFocus);
    return () => {
      fishEditor.current?.off(FishEditor.events.EDITOR_FOCUS, onFocus);
    };
  }, []);

  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.on(FishEditor.events.EDITOR_BLUR, onProtoBlur);
    return () => {
      fishEditor.current?.off(FishEditor.events.EDITOR_BLUR, onProtoBlur);
    };
  }, []);

  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.on(FishEditor.events.EDITOR_CHANGE, onEditableChange);
    return () => {
      fishEditor.current?.off(FishEditor.events.EDITOR_CHANGE, onEditableChange);
    };
  }, []);

  useEffect(() => {
    if (!fishEditor.current) return;
    fishEditor.current.on(FishEditor.events.EDITOR_MAXLENGTH, handleOnMaxLength);
    return () => {
      fishEditor.current?.off(FishEditor.events.EDITOR_MAXLENGTH, handleOnMaxLength);
    };
  }, []);

  /** @name 获取当前富文本的内容长度 */
  const length = useMemo(() => {
    const realNum = fishEditor.current?.getLength();
    // 走自定义计算长度方法
    if (isFunction(customInputLength)) {
      return customInputLength(realNum);
    }
    return realNum || 0;
  }, [inputVal]);

  return (
    <div ref={containerRef} className={classNames("textAreaEditor", isfocus && "focusSty", disabled && "disabled", props.classnames)}>
      <div ref={demoref} style={{ flex: 1, height: 0 }}></div>

      <div className={"drag"} onMouseDown={handleMouseDown}>
        上下拖我
      </div>

      {maxLength && (
        <div className={classNames("total")}>
          <span className={classNames({ error: length > maxLength }, "normal")}>{length}</span>/{maxLength}
        </div>
      )}
    </div>
  );
};

export default memo(
  TextAreaEditor, // props 不变化不更新
  (preProps, props) => {
    return JSON.stringify(preProps) == JSON.stringify(props);
  }
);
