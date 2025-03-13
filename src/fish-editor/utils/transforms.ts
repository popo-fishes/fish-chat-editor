/*
 * @Date: 2024-10-12 21:00:15
 * @Description: Modify here please
 */
import { base, isNode } from ".";
import { emojiSize } from "../../config";
import { getEmojiData } from "../../utils";
import { isEditElement } from "./isNode";
import store from "../core/store";

/**
 * @name String tag escape
 * @param str `<h1>` ==> `&lt;h1&gt;`
 * @param reversal `&lt;h1&gt;`==> `<h1>`
 * @returns
 */
export const labelRep = (str: string, reversal?: boolean): string => {
  if (!str) return "";
  if (reversal) {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  }
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

/**
 * @name Convert inserted text into nodes, mainly converting text into emoji nodes
 * @param content
 * @param size
 * @returns
 */
export const transformTextToNodes = (content: string, size?: number): Node[] | [] => {
  if (!content) return [];
  const emojiList = getEmojiData();
  const nodes: Node[] = [];

  let strCont = content;

  for (const i in emojiList) {
    const item = emojiList[i];
    const reg = new RegExp("\\" + item.name, "g");
    strCont = strCont?.replace(reg, function () {
      const key = base.getElementAttributeKey("emojiNode");
      const strimg = `<img src="${item.url}" ${key}="${item.name}"/>`;
      return strimg;
    });
  }

  const dom_p = document.createElement("p");
  dom_p.innerHTML = strCont;

  if (dom_p.childNodes?.length) {
    for (const i in dom_p.childNodes) {
      const cldNode = dom_p.childNodes[i];
      if (isNode.isDOMText(cldNode)) {
        nodes.push(cldNode);
      } else if (isNode.isDOMElement(cldNode) && cldNode.nodeName == "IMG") {
        const attrName = base.getElementAttributeDatasetName("emojiNode");
        const elementAttrVal = (cldNode as any)?.dataset?.[attrName] || "";
        if (elementAttrVal && (cldNode as any).src) {
          const imgNode = base.createChunkEmojiElement((cldNode as any).src, size || emojiSize, elementAttrVal);
          nodes.push(imgNode);
        }
      }
    }
  }

  return nodes;
};

/**
 * @name get Edit Element Plain Text
 */
export const getEditElementPlainText = (node: HTMLElement) => {
  let text = "";

  if (isNode.isDOMText(node) && node.nodeValue) {
    return labelRep(node.nodeValue);
  }

  if (isNode.isDOMElement(node)) {
    for (const childNode of Array.from(node.childNodes)) {
      text += getEditElementPlainText(childNode as any);
    }

    if (isNode.isEmojiImgNode(node)) {
      const emojiNodeAttrName = base.getElementAttributeDatasetName("emojiNode");

      const isEmojiVal = node.dataset?.[emojiNodeAttrName] || "";
      if (isEmojiVal) {
        text += isEmojiVal;
      }
    }
  }

  return text;
};

/** @name Get the pure text of the editor */
export const handleEditTransformsPlainText = (node: HTMLElement): string => {
  const result: string[] = [];
  if (!node || !node?.childNodes) return "";

  const nodes: ChildNode[] = Array.from(node.childNodes);

  for (const cld of Array.from(nodes)) {
    if (isEditElement(cld as HTMLElement)) {
      const content = getEditElementPlainText(cld as any);
      if (content) {
        result.push(content);
      } else {
        result.push("");
      }
    }
  }
  const testStr = result.join("\n");
  return testStr;
};

/**
 * @name Retrieve the HTML content of the edit line attribute node
 * @param node
 * @param isFullAttr
 */
export const getEditElementContent = (node: HTMLElement, isFullAttr?: boolean): string => {
  let content = "";

  if (isNode.isDOMText(node) && node.nodeValue) {
    return labelRep(node.nodeValue);
  }

  if (isNode.isDOMElement(node)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      // Belongs to Editor - Text Block Node, not Image Node
      if (isNode.isEditTextNode(node) && !isNode.isEmojiImgNode(node) && !isNode.isImageNode(node)) {
        const nodeName = (node.nodeName || "").toLowerCase();
        const container = document.createElement(nodeName);
        if (node.style?.length) {
          container.style.cssText = node.style.cssText;
        }
        if (isFullAttr) {
          container.id = node.id;
          const key = base.getElementAttributeKey("fishNode");
          container.setAttribute(key, "text");
        }
        container.innerText = node.innerText;
        // console.log(node, container.outerHTML);
        content += container.outerHTML;
      } else {
        content += getEditElementContent((node as any).childNodes[i], isFullAttr || false);
      }
    }

    if (isNode.isEmojiImgNode(node)) {
      const emojiNodeAttrName = base.getElementAttributeDatasetName("emojiNode");
      const emojiVal = node?.dataset?.[emojiNodeAttrName] || "";
      if (emojiVal) content += emojiVal;
    }

    if (isNode.isImageNode(node)) {
      content += `<img src="${(node as HTMLImageElement).src}">`;
    }
  }

  return content;
};

/**
 * @name retrieves the semantic content of the editor. Retrieve line by line
 * @desc will convert the src of img images to base64
 * @returns returns an HTML formatted array
 */
export const handleEditTransformsSemanticHtml = (node: HTMLElement): string => {
  const result: string[] = [];

  if (!node || !node?.childNodes) return "";

  const nodes: ChildNode[] = Array.from(node.childNodes);
  try {
    for (const cld of Array.from(nodes)) {
      if (isEditElement(cld as HTMLElement)) {
        // If there is an image, it needs to be converted to src. Mainly processing the conversion of image blob to base64
        const imgElements = (cld as HTMLElement).querySelectorAll("img") as any;
        for (const cimg of Array.from(imgElements)) {
          if (isNode.isImageNode(cimg as HTMLElement)) {
            const blobUrl = (cimg as HTMLImageElement).src;
            if (blobUrl.includes(`blob:http://`) || blobUrl.includes(`blob:https://`)) {
              const base64 = store.editorImageBase64Map.get(blobUrl);
              if (base64) {
                (cimg as HTMLImageElement).src = base64;
              }
            }
          }
        }
        const content = getEditElementContent(cld as any);
        if (content) {
          result.push(`<p>${content}</p>`);
        } else {
          result.push(`<p><br></p>`);
        }
      }
    }

    const htmlStr = result.join("");
    // console.log(htmlStr);
    return htmlStr;
  } catch (err) {
    console.warn(err);
    return base.emptyEditHtmlText;
  }
};

/**
 * @name retrieves the semantic content of the editor. Retrieve line by line
 * @desc will convert the src of img images to blob
 * @returns returns an HTML formatted array
 */
export const handleEditTransformsProtoHtml = (node: HTMLElement): string => {
  const result: string[] = [];
  if (!node || !node?.childNodes) return "";

  const nodes: ChildNode[] = Array.from(node.childNodes);

  for (const cld of Array.from(nodes)) {
    if (isEditElement(cld as HTMLElement)) {
      const content = getEditElementContent(cld as any);
      if (content) {
        result.push(`<p>${content}</p>`);
      } else {
        result.push(`<p><br></p>`);
      }
    }
  }
  const htmlStr = result.join("");
  // console.log(htmlStr);
  return htmlStr;
};
