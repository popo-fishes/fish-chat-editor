export type Rect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const getParentElement = (element: Node): Element | null => element.parentElement || (element.getRootNode() as ShadowRoot).host || null;

const getElementRect = (element: Element): Rect => {
  const rect = element.getBoundingClientRect();
  const scaleX = ("offsetWidth" in element && Math.abs(rect.width) / (element as HTMLElement).offsetWidth) || 1;
  const scaleY = ("offsetHeight" in element && Math.abs(rect.height) / (element as HTMLElement).offsetHeight) || 1;
  return {
    top: rect.top,
    right: rect.left + element.clientWidth * scaleX,
    bottom: rect.top + element.clientHeight * scaleY,
    left: rect.left
  };
};

const paddingValueToInt = (value: string) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? 0 : number;
};

// Follow the steps described in https://www.w3.org/TR/cssom-view-1/#element-scrolling-members,
// assuming that the scroll option is set to 'nearest'.
const getScrollDistance = (
  targetStart: number,
  targetEnd: number,
  scrollStart: number,
  scrollEnd: number,
  scrollPaddingStart: number,
  scrollPaddingEnd: number
) => {
  if (targetStart < scrollStart && targetEnd > scrollEnd) {
    return 0;
  }

  if (targetStart < scrollStart) {
    return -(scrollStart - targetStart + scrollPaddingStart);
  }

  if (targetEnd > scrollEnd) {
    return targetEnd - targetStart > scrollEnd - scrollStart ? targetStart + scrollPaddingStart - scrollStart : targetEnd - scrollEnd + scrollPaddingEnd;
  }
  return 0;
};

/**
   @name Scroll the specified rectangular area (`targetRect`) into the visible viewport.
    1. Traverse upward from the `root` element through its ancestor elements (including `document.body`).
    2. For each scrollable container, calculate the required scroll distance (`scrollDistanceX` and `scrollDistanceY`).
    3. If the container is the `body`, use `window.scrollBy` to scroll; otherwise, perform vertical or horizontal scrolling on the current element.
    4. Update the position of the target rectangle to reflect its new relative location after scrolling.
    5. Stop traversing when encountering a `fixed` positioned element or reaching the `body`.
 * @param root
 * @param targetRect
 */
const scrollRectIntoView = (root: HTMLElement, targetRect: Rect) => {
  const document = root.ownerDocument;

  let rect = targetRect;

  let current: Element | null = root;

  while (current) {
    const isDocumentBody: boolean = current === document.body;
    const bounding = isDocumentBody
      ? {
          top: 0,
          right: window.visualViewport?.width ?? document.documentElement.clientWidth,
          bottom: window.visualViewport?.height ?? document.documentElement.clientHeight,
          left: 0
        }
      : getElementRect(current);

    const style = getComputedStyle(current);
    const scrollDistanceX = getScrollDistance(
      rect.left,
      rect.right,
      bounding.left,
      bounding.right,
      paddingValueToInt(style.scrollPaddingLeft),
      paddingValueToInt(style.scrollPaddingRight)
    );
    const scrollDistanceY = getScrollDistance(
      rect.top,
      rect.bottom,
      bounding.top,
      bounding.bottom,
      paddingValueToInt(style.scrollPaddingTop),
      paddingValueToInt(style.scrollPaddingBottom)
    );
    // console.log(scrollDistanceY, scrollDistanceX)
    if (scrollDistanceX || scrollDistanceY) {
      if (isDocumentBody) {
        document.defaultView?.scrollBy(scrollDistanceX, scrollDistanceY);
      } else {
        const { scrollLeft, scrollTop } = current;
        // console.log(current, scrollTop)
        if (scrollDistanceY) {
          current.scrollTop += scrollDistanceY;
        }
        if (scrollDistanceX) {
          current.scrollLeft += scrollDistanceX;
        }
        const scrolledLeft = current.scrollLeft - scrollLeft;
        const scrolledTop = current.scrollTop - scrollTop;
        rect = {
          left: rect.left - scrolledLeft,
          top: rect.top - scrolledTop,
          right: rect.right - scrolledLeft,
          bottom: rect.bottom - scrolledTop
        };
      }
    }

    current = isDocumentBody || style.position === "fixed" ? null : getParentElement(current);
  }
};

export default scrollRectIntoView;
