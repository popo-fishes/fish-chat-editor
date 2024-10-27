/*
 * @Date: 2024-10-26 21:27:55
 * @Description: Modify here please
 */
import { isNode } from "../core";

/**
 * @name 传入编辑器，判断是否存在内联块属性节点
 */
export function hasEditorExistInlineNode(node: HTMLElement): boolean {
  if (isNode.isEditInline(node)) {
    return true;
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    if (hasEditorExistInlineNode(node.childNodes[i] as HTMLElement)) {
      return true;
    }
  }
  return false;
}

/** @name 获取克隆编辑器的行节点 */
export function getCloneEditeElements(): HTMLDivElement | null {
  if (!this.container || !isNode.isDOMNode(this.container)) return null;

  const contentNode = this.container.cloneNode(true);

  const odiv = document.createElement("div");

  for (const childNode of Array.from(contentNode.childNodes)) {
    odiv.appendChild(childNode as Node);
  }

  odiv.setAttribute("hidden", "true");

  contentNode.ownerDocument.body.appendChild(odiv);

  return odiv;
}

export function removeBodyChild(node: HTMLElement) {
  if (document.body) {
    // 移除节点
    document.body.removeChild(node);
  }
}

export function resolveSelector(selector: string | HTMLElement | null | undefined) {
  return typeof selector === "string" ? document.querySelector<HTMLElement>(selector) : selector;
}
