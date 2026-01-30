/*
 * @Date: 2024-03-27 14:11:27
 * @Description: Modify here please
 */
import { useEffect, useRef, useCallback } from "react";
import type { MutableRefObject } from "react";

const defaultEvent = "click";

type BasicTarget<T = HTMLElement> =
  | (() => T | null)
  | T // dom
  | null
  | MutableRefObject<T | null | undefined>;

type EventType = MouseEvent | TouchEvent;

type TargetElement = Element | Document | Window | HTMLElement;

function getTargetElement(target?: BasicTarget<TargetElement>, defaultTarget?: TargetElement): TargetElement | null | undefined {
  if (!target) {
    return defaultTarget;
  }

  let targetElement: TargetElement | null | undefined;

  if (typeof target === "function") {
    targetElement = target();
  } else if ("current" in target) {
    targetElement = target.current;
  } else {
    targetElement = target;
  }

  return targetElement;
}

export function useClickAway(
  onClickAway: (e: EventType) => void,
  target: BasicTarget | BasicTarget[],
  eventName: string = defaultEvent,
  capture: boolean = true
) {
  const onClickAwayRef = useRef(onClickAway);
  onClickAwayRef.current = onClickAway;

  const handler = useCallback(
    (event: any) => {
      const targetArray = Array.isArray(target) ? target : [target];
      if (
        targetArray.some((item) => {
          const targetElement = getTargetElement(item) as HTMLElement;
          return !targetElement || targetElement.contains(event.target);
        })
      ) {
        return;
      }

      onClickAwayRef.current(event);
    },
    [target]
  );

  useEffect(() => {
    document.addEventListener(eventName, handler, {
      passive: true,
      capture
    });
    return () => {
      document.removeEventListener(eventName, handler, {
        capture: capture
      });
    };
  }, [eventName, capture, handler]);
}
