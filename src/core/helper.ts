/*
 * @Date: 2024-10-12 14:42:00
 * @Description: Modify here please
 */
/**
 * @name 生成长度为x的随机字母数字组合
 */
export const generateRandomString = (length = 5) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    // 获取指定索引位置, 向下取整
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/** @name 把一个file对象转为base64 */
export function fileToBase64(file: any) {
  return new Promise((resolve, reject) => {
    // 创建一个新的 FileReader 对象
    const reader = new FileReader();
    // 读取 File 对象
    reader.readAsDataURL(file);
    // 加载完成后
    reader.onload = function () {
      // 将读取的数据转换为 base64 编码的字符串
      const base64String = (reader.result as any).split(",")[1];
      // 解析为 Promise 对象，并返回 base64 编码的字符串
      resolve(base64String);
    };

    // 加载失败时
    reader.onerror = function () {
      reject(new Error("Failed to load file"));
    };
  });
}
