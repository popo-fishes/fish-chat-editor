/*
 * @Date: 2024-05-14 14:11:13
 * @Description: Modify here please
 */
export const emoji: { [key: string]: string } = {
  "[爱你]": "[爱你].png",
  "[不看]": "[不看].png"
};

export const getDefaultEmojiData = () => {
  const data = [];
  for (const i in emoji) {
    const bli = i.replace("[", "");
    const cli = bli.replace("]", "");
    data.push({
      url: "http://43.136.119.145:83/image/" + emoji[i],
      name: i,
      title: cli
    });
  }
  return data;
};
