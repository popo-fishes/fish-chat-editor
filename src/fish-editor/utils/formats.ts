/*
 * @Date: 2025-01-18 09:27:42
 * @Description: Modify here please
 */
import { base, dom, isNode } from ".";

/** Format - Optimize Conversion */
export const createNodeOptimize = (node: HTMLElement) => {
  let formatNode: HTMLElement | Text | null = null;
  if (!isNode.isDOMNode(node)) return formatNode;
  const clnode = dom.cloneNodes([node])[0];
  const nodeName = (clnode.nodeName || "").toLowerCase();
  if (isNode.isDOMText(clnode)) {
    formatNode = dom.cloneNodes([clnode])[0] || null;
  } else if (nodeName == "span") {
    if (clnode.style.color) {
      formatNode = base.createChunkTextElement("span");
      formatNode.innerText = clnode.innerText;
      formatNode.style.color = clnode.style.color;
    } else {
      formatNode = document.createTextNode(clnode.innerText || "");
    }
  } else if (nodeName == "strong") {
    formatNode = base.createChunkTextElement("strong");
    formatNode.innerText = clnode.innerText;
  } else if (nodeName == "img") {
    formatNode = base.createChunkImgElement(clnode.getAttribute("src") || "");
  }
  return formatNode;
};