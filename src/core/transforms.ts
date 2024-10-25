/*
 * @Date: 2024-10-12 21:00:15
 * @Description: Modify here please
 */
import { base, isNode, helper } from ".";
import { getEmojiData } from "../utils";
import { emojiSize } from "../config";
import { isEditElement } from "./isNode";

/** @name 字符串标签转换 */
export const labelRep = (str: string, reversal?: boolean) => {
  if (!str) return "";
  // 反转回去
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
 *  @name 把插入的文本转成节点
 * 主要是把文本转成表情节点
 */
export const transformTextToNodes = (content: string): Node[] | [] => {
  if (!content) return [];
  const emojiList = getEmojiData();
  const nodes: Node[] = [];

  let strCont = content;
  /**
   * 比如content为：哈哈[爱你]哈[不看]哈 --->
   * 要转换为一个数组： [text节点内容为“"哈哈"，img节点， text节点内容为“"哈"，img节点， text节点内容为“"哈哈"]
   * ：：：：：
   *这里主要做字符串标记
   */
  for (const i in emojiList) {
    const item = emojiList[i];
    const reg = new RegExp("\\" + item.name, "g");
    // 替换
    strCont = strCont?.replace(reg, function () {
      const key = base.getElementAttributeKey("emojiNode");
      // 替换表情
      const strimg = `<img src="${item.url}" ${key}="${item.name}"/>`;
      return strimg;
    });
  }

  // 创建一个p标签, 把字符串转成一个dom节点
  const dom_p = document.createElement("p");
  dom_p.innerHTML = strCont;

  // 处理当前节点内容
  if (dom_p.childNodes?.length) {
    for (const i in dom_p.childNodes) {
      const cldNode = dom_p.childNodes[i];
      if (isNode.isDOMText(cldNode)) {
        nodes.push(cldNode);
      } else if (isNode.isDOMElement(cldNode) && cldNode.nodeName == "IMG") {
        const attrName = base.getElementAttributeDatasetName("emojiNode");
        const elementAttrVal = (cldNode as any)?.dataset?.[attrName] || "";
        if (elementAttrVal && (cldNode as any).src) {
          const imgNode = base.createChunkEmojiElement((cldNode as any).src, emojiSize, elementAttrVal);
          nodes.push(imgNode);
        }
      }
    }
  }

  return nodes;
};

/**
 * @name 传入节点,获取它的纯文本内容
 * @returns
 */
export const getNodePlainText = (node: HTMLElement) => {
  let text = "";

  if (isNode.isDOMText(node) && node.nodeValue) {
    return node.nodeValue;
  }

  if (isNode.isDOMElement(node)) {
    for (const childNode of Array.from(node.childNodes)) {
      text += getNodePlainText(childNode as any);
    }

    const display = getComputedStyle(node).getPropertyValue("display");

    if (isNode.isEditInline(node) && isNode.isEmojiImgNode(node)) {
      const emojiNodeAttrName = base.getElementAttributeDatasetName("emojiNode");
      // 是否是一个表情图片,如果是取出名称
      const isEmojiVal = node.dataset?.[emojiNodeAttrName] || "";
      if (isEmojiVal) {
        text += isEmojiVal;
      }
    }

    if (display === "block" && !isNode.isEditInline(node)) {
      text += "\n";
    }
  }

  return text;
};

/** @name 获取编辑行属性节点的html内容 */
export const getEditElementContent = (node: HTMLElement): string => {
  let content = "";

  if (isNode.isDOMText(node) && node.nodeValue) {
    return node.nodeValue;
  }

  if (isNode.isDOMElement(node)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      content += getEditElementContent((node as any).childNodes[i]);
    }

    if (isNode.isEditInline(node) && isNode.isEmojiImgNode(node)) {
      const emojiNodeAttrName = base.getElementAttributeDatasetName("emojiNode");
      const emojiVal = node?.dataset?.[emojiNodeAttrName] || "";
      if (emojiVal) content += emojiVal;
    }

    if (isNode.isEditInline(node) && isNode.isImageNode(node)) {
      content += `<img src="${(node as HTMLImageElement).src}">`;
    }
  }

  return content;
};

/**
 * @name 获取编辑器的语义内容。逐行获取
 * @desc 它是会给img图片的src转换成base64的
 * @returns 返回一个html格式数组
 */
export const handleEditTransformsSemanticHtml = async (node: HTMLElement): Promise<string> => {
  if (!node || !node?.childNodes) return "";

  const nodes: ChildNode[] = Array.from(node.childNodes);

  const promiseData: Promise<string>[] = [];
  // 辅助函数：转义正则表达式中的特殊字符
  function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& 表示匹配到的字符串
  }

  for (const cld of Array.from(nodes)) {
    if (isEditElement(cld as HTMLElement)) {
      const content = getEditElementContent(cld as any);
      // 主要处理把图片的blob转成base64
      if (content) {
        // 判断当前行内容是否存在图片，存在图片就需要转换src。
        if (content.includes(`blob:http://`) || content.includes(`blob:https://`)) {
          const promise = new Promise<string>((resolve) => {
            const imgElements = (cld as HTMLElement).querySelectorAll("img") as any;
            const urls = Array.from(imgElements).map((img: HTMLImageElement) => img.src);

            if (!urls.length) resolve("");
            // 获取图片的base64
            Promise.allSettled(urls.map(helper.fetchBlobAsBase64))
              .then((res) => {
                const datas: { base64: string; blobUrl: string }[] = [];
                res.forEach((result) => {
                  if (result.status == "fulfilled" && result.value) {
                    datas.push(result.value);
                  }
                });
                // 替换原始字符串，把图标的src路径替换为base64
                let repAfterContent = content;
                for (const i in datas) {
                  const item = datas[i];
                  const reg = new RegExp(`src="${escapeRegExp(item.blobUrl)}"`, "g");
                  // 替换
                  repAfterContent = repAfterContent?.replace(reg, `src="${item.base64}"`);
                }
                // console.log(repAfterContent);
                resolve(`<p>${repAfterContent}</p>`);
              })
              .catch((error) => {
                resolve("");
                console.error("Error converting URLs to Base64:", error);
              });
          });
          promiseData.push(promise);
        } else {
          promiseData.push(
            (async () => {
              return `<p>${content}</p>`;
            })()
          );
        }
      } else {
        promiseData.push(
          (async () => {
            return `<p><br></p>`;
          })()
        );
      }
    }
  }

  try {
    const result = await Promise.all(promiseData);
    // console.log(result);
    const htmlStr = result.join("");
    return htmlStr;
  } catch (err) {
    return base.emptyEditHtmlText;
  }
};

/**
 * @name 获取编辑器节点的原始内容。逐行获取
 * @desc 它不会转换img图片的src，还是blob格式
 * @returns 返回一个html格式数组
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
