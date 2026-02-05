/*
 * @Date: 2026-01-29 16:05:39
 * @Description: Modify here please
 */
import { useEffect, useCallback, useRef } from "react";

interface UseDragResizeProps {
  // 最小高度
  minHeight: number;
  // 最大高度
  maxHeight?: number;
  // 初始化高度
  initialHeight?: number;
  // 是否反转拖拽方向（默认 false）
  reverseDirection?: boolean;
  // 高度变化回调
  onChange?: (height: number) => void;
}
export const useDragResize = (props: UseDragResizeProps) => {
  const { minHeight, maxHeight, initialHeight, onChange, reverseDirection = false } = props;
  // 初始鼠标Y坐标
  const startYRef = useRef<number>(0);
  // 初始容器高度
  const startHeightRef = useRef<number>(0);
  // 容器引用
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      if (initialHeight || minHeight) {
        const v = initialHeight || minHeight;
        containerRef.current.style.height = `${v}px`;
        onChange?.(v);
      }
    }
  }, []);

  const setContainerHeight = (height: number) => {
    if (containerRef.current) {
      containerRef.current.style.height = `${height}px`;
      onChange?.(height);
    }
  };

  // 拖动
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!containerRef.current) return;

      startYRef.current = e.clientY;
      startHeightRef.current = containerRef.current.offsetHeight;

      // 设置全局光标样式
      document.body.style.cursor = "s-resize";
      document.body.style.userSelect = "none"; // 防止文本选中

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.stopPropagation();
        const deltaY = moveEvent.clientY - startYRef.current;
        // 根据 reverseDirection 调整 deltaY 方向
        // 如果 reverseDirection 为 true，则对 deltaY 取反，实现方向反转。
        const adjustedDeltaY = reverseDirection ? -deltaY : deltaY;

        const newHeight = Math.min(Math.max(startHeightRef.current + adjustedDeltaY, minHeight || 0), maxHeight ?? Infinity);

        // console.log(newHeight, maxHeight, minHeight)

        if (containerRef.current) {
          containerRef.current.style.height = `${newHeight}px`;
          onChange?.(newHeight);
        }
        /**
         * 使用 requestAnimationFrame 是为了优化渲染性能，确保高度更新发生在浏览器的下一帧绘制周期中。
           即使第一次已经设置了高度，requestAnimationFrame 的作用是：
           避免重复渲染冲突：如果在短时间内频繁修改样式，可能会导致浏览器多次重排（reflow）和重绘（repaint），影响性能。
           保证视觉一致性：将样式更新推迟到下一帧，可以让浏览器更高效地批量处理 DOM 变化，从而让动画更加流畅。
         */
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.height = `${newHeight}px`;
          }
        });
      };

      const handleMouseUp = () => {
        // 恢复默认光标和文本选择
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [minHeight, maxHeight, onChange]
  );

  // 移动端触屏拖拽开始（touchstart）
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault(); // 阻止触屏默认行为（如页面滚动、缩放）

      if (!containerRef.current) return;

      // 记录初始触摸点Y坐标（取第一个触摸点，适配单指拖拽）
      startYRef.current = e.touches[0].clientY;
      // 记录容器当前的初始高度
      startHeightRef.current = containerRef.current.offsetHeight;

      // 禁止页面文本选中（优化触屏体验）
      document.body.style.userSelect = "none";
      // 禁止触屏默认行为（防止滚动、缩放干扰拖拽）
      document.body.style.touchAction = "none";

      // 触屏移动过程（touchmove）：实时计算并更新高度
      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.stopPropagation();
        moveEvent.preventDefault();

        // 实时获取当前触摸点Y坐标
        const currentY = moveEvent.touches[0].clientY;
        // 计算触摸点移动的差值
        const deltaY = currentY - startYRef.current;
        // 根据是否反转方向，调整差值方向
        const adjustedDeltaY = reverseDirection ? -deltaY : deltaY;

        // 计算新高度，并限制在 min ~ max 范围内
        const newHeight = Math.min(Math.max(startHeightRef.current + adjustedDeltaY, minHeight), maxHeight ?? Infinity);

        // 更新容器高度并触发回调
        if (containerRef.current) {
          containerRef.current.style.height = `${newHeight}px`;
          onChange?.(newHeight);
        }
      };

      // 触屏拖拽结束（touchend）：清除事件监听和全局样式
      const handleTouchEnd = () => {
        // 恢复默认样式
        document.body.style.userSelect = "";
        document.body.style.touchAction = "";

        // 移除全局触屏事件监听（防止内存泄漏）
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      // 绑定全局触屏事件（监听整个文档，保证拖拽不中断）
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [minHeight, maxHeight, onChange, reverseDirection]
  );

  return { containerRef, setContainerHeight, handleMouseDown, handleTouchStart };
};
