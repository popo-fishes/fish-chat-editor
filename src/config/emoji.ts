/*
 * @Date: 2024-3-14 15:40:27
 * @Description: 表情配置
 */
import { getImgCdn } from "../utils";
import type { IEmojiType } from "../types";

export const emoji: { [key: string]: string } = {
  "[爱你]": "[爱你].png",
  "[爱心]": "[爱心].png",
  "[闭眼]": "[闭眼].png",
  "[不高兴]": "[不高兴].png",
  "[不看]": "[不看].png",
  "[吃惊]": "[吃惊].png",
  "[愁]": "[愁].png",
  "[呲牙]": "[呲牙].png",
  "[打瞌睡]": "[打瞌睡].png",
  "[大哭]": "[大哭].png",
  "[大笑]": "[大笑].png",
  "[得意]": "[得意].png",
  "[点赞]": "[点赞].png",
  "[调皮]": "[调皮].png",
  "[发怒]": "[发怒].png",
  "[愤怒]": "[愤怒].png",
  "[尬笑]": "[尬笑].png",
  "[害怕]": "[害怕].png",
  "[害羞]": "[害羞].png",
  "[汗]": "[汗].png",
  "[哼哼]": "[哼哼].png",
  "[挥手]": "[挥手].png",
  "[假笑]": "[假笑].png",
  "[惊讶]": "[惊讶].png",
  "[开怀大笑]": "[开怀大笑].png",
  "[困倦]": "[困倦].png",
  "[流泪]": "[流泪].png",
  "[玫瑰]": "[玫瑰].png",
  "[眯眼笑]": "[眯眼笑].png",
  "[钱]": "[钱].png",
  "[亲一口]": "[亲一口].png",
  "[拳头]": "[拳头].png",
  "[失望]": "[失望].png",
  "[天使]": "[天使].png",
  "[吐舌头]": "[吐舌头].png",
  "[微笑]": "[微笑].png",
  "[笑哭]": "[笑哭].png",
  "[心碎]": "[心碎].png",
  "[愉快]": "[愉快].png",
  "[眨眼]": "[眨眼].png",
  "[眨眼笑]": "[眨眼笑].png",
  "[ok]": "[ok].png"
};

const getEmojiData = () => {
  const data: IEmojiType[] = [];
  for (const i in emoji) {
    const bli = i.replace("[", "");
    const cli = bli.replace("]", "");
    data.push({
      url: getImgCdn("faces/" + emoji[i]),
      name: i,
      title: cli
    });
  }
  return data;
};

// 表情数据
export const emojiData = getEmojiData();
