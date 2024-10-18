/*
 * @Date: 2024-5-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: file content
 */
import type { IEmojiType } from "../types";

import { base, transforms } from "../core";

const { getElementAttributeKey } = base;

let globalEmojiList: IEmojiType[] = [];

export const labelRep = (str: string) => transforms.labelRep(str);

/**
 * @name 设置当前表情图片数据
 */
export const setEmojiData = (emojiData: IEmojiType[]) => {
  globalEmojiList = [...emojiData];
};

export const getEmojiData = (): IEmojiType[] => {
  return globalEmojiList || [];
};

/**
 * @name 文本消息转换，批量替换方法
 * @msgText 消息字符串
 */
export const replaceMsgText = (msgText?: string): string => {
  /**
   * @name 文本转换图片替换方法
   * @strCont 字符串
   */
  function regContentImg(strCont?: string) {
    if (!strCont) return "";
    const emojiList = getEmojiData();
    // 把字符串替换表情图片
    for (const i in emojiList) {
      const item = emojiList[i];
      const reg = new RegExp("\\" + item.name, "g");
      // 替换
      strCont = strCont?.replace(reg, function () {
        const key = base.getElementAttributeKey("emojiNode");
        // 替换表情
        const strimg = `<img src="${item.url}" width="${18}px" height="${18}px" ${key}="${item.name}"/>`;
        return strimg;
      });
    }
    return strCont;
  }

  // 文本转换批量图片替换方法
  const transMsgStr = regContentImg(msgText);
  /**
   * 把字符串消息内容转格式：
   * 1. 把换行符分割，转为数组
   * 3. 遍历数组，找出字符串中带有图片的文本，转出来
   * 4. 如果是文本，解析为html字符串
   * 5. 完成转成后，渲染消息列表会用pre标签进行渲染(<pre dangerouslySetInnerHTML={{__html: msg}}>)，pre标签：<pre> 标签可定义预格式化的文本。
        被包围在 <pre> 标签 元素中的文本通常会保留空格和换行符。而文本也会呈现为等宽字体。
   */
  // 分割换行
  const splitterList = transMsgStr?.split("\n") || [];
  // 换行字符串转换
  const data = splitterList.map((msgStr, index) => {
    let str = "";
    const imgReg = /<img.*?(?:>|\/>)/gi; //匹配图片中的img标签

    // 是否为最后一个换行字符串，如果不是最后一个，就需要加换行标签。最后一个不需要br换行
    const isEnd = splitterList.length - 1 == index;

    // 筛选出所有的img
    const imgArr = msgStr.match(imgReg);
    const key = getElementAttributeKey("emojiNode");
    // 代表当前存在图片表情，继续匹配
    if (msgStr?.indexOf(key) !== -1 && imgArr?.length) {
      let cMsg = msgStr; // 最新的字符串
      // 发现图片, 循环添加
      for (let i = 0; i < imgArr.length; i++) {
        // 找到图片，做字符串分割，直到分割完毕位置
        const msgImgList = cMsg?.split(imgArr[i]);
        /**
         * 把剩下文本在次装进入消息数组中
         * 如：`哈哈<img src="/static/imgs/[愉快].png" ${key}="[愉快]" />哈哈`
         * 我们需要得到的是数组: [
         *  '哈哈',
         *  '<img src="/static/imgs/[愉快].png" ${key}="[愉快]" />',
         *  '哈哈'
         * ]
         */
        // 组装字符串规则： 文本就需要加上span标签，否侧就是表情图片，直接显示img标签
        // 如果是最后一个字符：就需要加上换行: <span>\n</span>
        if (msgImgList?.length) {
          // 把截取的第一值直接存进消息数组，因为这代表是图片前面的文字
          if (msgImgList[0]) {
            str += `<span>${labelRep(msgImgList[0])}</span>`;
          }

          // (isFlag 必须是最后一次截取，且结尾的字符是空，才代表当前图片已经是最后一个字符，就需要换行)
          const isFlag = imgArr.length - 1 == i && !msgImgList[1];
          // 把当前图片装进去
          str += isFlag ? `${imgArr[i]}<br>` : `${imgArr[i]}`;

          // 如果循环到最后一个，就把最后一个结尾的字符装进去，加上br换行
          if (imgArr.length - 1 == i && msgImgList[1]) {
            str += `<span>${labelRep(msgImgList[1])}</span><br>`;
          } else {
            // 匹配剩下的imgArr
            // 把字符串中的图片截取后半部分赋值给匹配字符串，下次急需匹配后半部分
            cMsg = msgImgList[1];
          }
        }
      }
    } else {
      // 没有找到图片就当文本处理
      if (msgStr) {
        str += isEnd ? `<span>${labelRep(msgStr)}</span>` : `<span>${labelRep(msgStr)}</span><br>`;
      } else {
        // 如果文本不存在直接加br
        str += "<br>";
      }
    }
    return str;
  });

  return data.join("");
};
