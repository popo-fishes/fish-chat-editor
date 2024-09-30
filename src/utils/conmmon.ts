/*
 * @Date: 2024-5-14 15:40:27
 * @LastEditors: Please set LastEditors
 * @Description: file content
 */
import { emoji } from "../config";

export const prefixNmae = "fb-e-";

/** 表情图片的 标签扩展属性名称 */
export const emojiLabel = {
  key: "data-fish-emoji-img-name",
  value: "fishEmojiImgName"
};

let globalCdn = "";

/**
 * @name 获取表情图片的CDN路径，且吧传递进来的CDN路径保存到全局变量
 * @param CDN_IMG
 * @returns
 */
export const setEmojiCdn = (CDN_IMG?: string) => {
  if (CDN_IMG) {
    globalCdn = CDN_IMG;
    return CDN_IMG;
  }
  if (globalCdn) {
    return globalCdn;
  }
  return "";
};

/**
 * @name 获取图片CDN链接
 * @param img 图片的路径或名称
 * @returns 返回拼接后的图片CDN链接
 */
export const getEmojiCdn = (img: string) => {
  return setEmojiCdn() + img;
};

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
 * @name 任意长度随机字母数字组合
 * min-长度
 */
export const getRandomWord = (min: number) => {
  let str = "";
  const range = min;
  const arr = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z"
  ];
  for (let i = 0; i < range; i++) {
    const pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
};

/**
 * @name 文本转换图片替换方法
 * @strCont 字符串
 * @imgSize 表情图片的大小 默认为18px
 */
export const regContentImg = (strCont?: string, imgSize?: number) => {
  if (!strCont) return "";
  // 把字符串替换表情图片
  for (const i in emoji) {
    const reg = new RegExp("\\" + i, "g");
    // 替换
    strCont = strCont?.replace(reg, function () {
      // 给当前替换的图片给一个位置的值，防止过滤匹配图片的时候出现问题
      const t = "emoji-" + getRandomWord(5);
      // 替换表情
      const strimg = `<img src="${getEmojiCdn(`${emoji[i]}`)}" width="${imgSize || 18}px" height="${imgSize || 18}px" ${emojiLabel.key}="${i}" data-key="${t}"/>`;
      return strimg;
    });
  }
  return strCont;
};

/**
 * @name 文本消息转换，批量替换方法
 * @msgText 消息字符串
 */
export const replaceMsgText = (msgText?: string): string => {
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

    // 代表当前存在图片表情，继续匹配
    if (msgStr?.indexOf(emojiLabel.key) !== -1 && imgArr?.length) {
      let cMsg = msgStr; // 最新的字符串
      // 发现图片, 循环添加
      for (let i = 0; i < imgArr.length; i++) {
        // 找到图片，做字符串分割，直到分割完毕位置
        const msgImgList = cMsg?.split(imgArr[i]);
        /**
         * 把剩下文本在次装进入消息数组中
         * 如：`哈哈<img src="/static/imgs/[愉快].png" ${emojiLabel.key}="[愉快]" />哈哈`
         * 我们需要得到的是数组: [
         *  '哈哈',
         *  '<img src="/static/imgs/[愉快].png" ${emojiLabel.key}="[愉快]" />',
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
