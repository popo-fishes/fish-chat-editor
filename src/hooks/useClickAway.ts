/*
 * @Date: 2024-03-27 14:11:27
 * @Description: Modify here please
 */
import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
// 定义默认事件 鼠标click
const defaultEvent = "click";

type BasicTarget<T = HTMLElement> =
  | (() => T | null) // 一个函数执行后，返回一个dom|null
  | T // dom
  | null
  | MutableRefObject<T | null | undefined>; // dom的ref

// 定义事件类型，浏览器的鼠标事件，移动端的触摸事件
type EventType = MouseEvent | TouchEvent;

type TargetElement = Element | Document | Window | HTMLElement;

function getTargetElement(
  target?: BasicTarget<TargetElement>,
  defaultTarget?: TargetElement
): TargetElement | null | undefined {
  // 如果target不存在，则返回默认dom
  if (!target) {
    return defaultTarget;
  }

  let targetElement: TargetElement | null | undefined;

  // 如果target是个函数，则执行该函数
  if (typeof target === "function") {
    targetElement = target();
    //如果target是ref ,则返回ref.current
  } else if ("current" in target) {
    targetElement = target.current;
  } else {
    targetElement = target;
  }

  return targetElement;
}

// 管理目标元素外点击事件的 Hook。
export default function useClickAway(
  /** 操作者 */
  onClickAway: (e: EventType) => void,
  /** 目标dom */
  target: BasicTarget | BasicTarget[],
  /** 监听的事件 */
  eventName: string = defaultEvent,
  /** 对内部事件侦听器使用捕获 (用来判断是捕获还是冒泡) */
  capture: boolean = true
) {
  const onClickAwayRef = useRef(onClickAway);

  useEffect(() => {
    const handler = (event: any) => {
      const targetArray = Array.isArray(target) ? target : [target];
      if (
        targetArray.some((item) => {
          // 拿到dom
          const targetElement = getTargetElement(item) as HTMLElement;
          // 目标dom不存在或者目标dom内含有触发事件的事件源的dom,则不执行
          return !targetElement || targetElement.contains(event.target);
        })
      ) {
        return;
      }

      onClickAwayRef.current(event);
    };

    document.addEventListener(eventName, handler, {
      passive: true,
      capture,
    });
    // 删除事件委托，避免内存泄漏
    return () => {
      document.removeEventListener(eventName, handler);
    };
  }, [eventName, target]);
}
