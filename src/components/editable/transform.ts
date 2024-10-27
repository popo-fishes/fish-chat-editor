import { dom, isNode, range as fishRange, util, base } from "../../core";

import type { IEditorElement } from "../../types";

// 子节点是否只有一个br节点
function hasParentOnlyBr(node: HTMLElement) {
  if (node) {
    if (node.childNodes && node.childNodes?.length == 1) {
      if (node.childNodes[0]?.nodeName == "BR") return true;
    }
  }
  return false;
}

/** 处理节点带有style属性时，也需要标记 */
function hasTransparentBackgroundColor(node: HTMLElement) {
  try {
    if (node.style && node.style?.backgroundColor) return true;
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * @name 行节点下面是否具有异常的节点
 */
function hasNotSatisfiedNode(node: HTMLElement) {
  if (!node) return false;
  if (!node.childNodes) return false;
  if (!node.childNodes.length) return false;
  if (node.childNodes.length == 1) {
    if (hasParentOnlyBr(node)) return false;
  }
  const nodes: any[] = Array.from(node.childNodes);
  let exist = false;
  for (const cld of nodes) {
    // 存在BR节点，但是子节点有很多个
    if (cld.nodeName === "BR" && nodes.length > 1) {
      exist = true;
      break;
    }
    // 节点不是内联块属性节点 || 节点有背景色属性
    if ((!isNode.isEditInline(cld as any) && cld.nodeName == "SPAN") || hasTransparentBackgroundColor(cld as any)) {
      exist = true;
      break;
    }
  }
  return exist;
}

export const transformsEditNodes = (editNode: IEditorElement) => {
  const range = fishRange.getRange();

  // console.time("transforms转换节点耗时");

  /**
   * bug1:
   * 获取光标的行编辑节点，查询是否存在不符合编辑节点格式的节点，然后重写它。
   * 这种情况常出现在： 按键 删除行-富文本自动合并行时，会主动创建一些自定义标签
   * 比如：<span style="background-color: transparent;">345</span>
   */
  if (range && range?.startContainer) {
    // 获取行编辑节点
    const editorRowNode = util.getNodeOfEditorElementNode(range.startContainer);
    if (editorRowNode && hasNotSatisfiedNode(editorRowNode)) {
      // console.log(editorRowNode.childNodes);
      /**
       * 必须用Array.from包裹下childNodes，不然导致for渲染不如预期的次数
       * 遍历行节点集合
       */
      const nodes: any[] = Array.from(editorRowNode.childNodes);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as any;

        const isFlag = !isNode.isEditInline(node) && node.nodeName == "SPAN";
        if (isFlag) {
          const textNode = document.createTextNode(node.textContent || "");
          node.parentNode?.replaceChild(textNode, node);
        }

        if (hasTransparentBackgroundColor(node) && isNode.isEditInline(node)) {
          node.style.removeProperty("background-color");
        }

        if (node.nodeName === "BR" && nodes.length > 1) {
          node.remove();
        }
      }
    }
  }

  /**
   * bug2:
   * 判断editNode的第一个子节点是否是行编辑节点，如果不是, 那就添加行编辑节点
   * 主要解决骚操作删除内容时，把editNode下面的全部行编辑节点删完了
   * 兜底处理,防止骚操作
   */
  if (!isNode.isEditElement(editNode.firstChild as any)) {
    // 创建一个编辑器--行节点
    const lineDom = base.createLineElement();
    dom.toTargetAddNodes(editNode as any, [lineDom]);
    // 设置光标
    if (lineDom.firstChild) {
      fishRange.setCursorPosition(lineDom.firstChild, "before");
    }
  }

  /**
   * bug3:
   * 不可以在非编辑行节点里面输入。这种情况出现在行编辑里面剩下一个内联节点，然后删除了就会导致行节点也被删除了。
   * 兜底处理,防止骚操作
   */
  if (range && range?.startContainer) {
    if (!util.getNodeOfEditorElementNode(range.startContainer as any)) {
      // 编辑器存在节点大于1
      if (editNode.childNodes?.length > 1) {
        const nodes: any[] = Array.from(editNode.childNodes);
        // 直接吧br标签替换为行节点
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as any;

          if (!isNode.isEditElement(node) && node.nodeName !== "BR") {
            node?.remove();
          }
          if (node.nodeName == "BR") {
            // 创建一个编辑器--行节点
            const lineDom = base.createLineElement();
            node.parentNode?.replaceChild(lineDom, node);
            // 设置光标为目标行的字节节点
            const targetRowNode = editNode.childNodes[range.startOffset];
            if (targetRowNode?.firstChild) {
              fishRange.setCursorPosition(targetRowNode.firstChild, "before");
            }
          }
        }
      }
    }
  }

  // console.timeEnd("transforms转换节点耗时");
};
