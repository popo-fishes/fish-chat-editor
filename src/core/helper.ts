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

/**
 * @name 去掉字符串的空格or换行---后是否为一个空文本，如果是直接赋值为空，否则用原始的
 * @desc: 常用于获取节点值后，判断是否全部是空格 和 换行，如果是就给字符串置空
 */
export const contentReplaceEmpty = (content: string) => {
  // 删除所有换行
  const cStr = content.replace(/\s/g, "");
  // 去掉所有的换行
  const lStr = cStr.replace(/\n/g, "");

  // 删除全部的换行和空格，得到一个 空字符，直接用空字符串作为值
  if (lStr == "") {
    content = "";
  }

  return content;
};

/** @name 去掉字符串尾部的\n换行符 */
export const removeTailLineFeed = (content: string) => {
  if (!content) return "";
  // 删除尾部
  if (content.endsWith("\n")) {
    content = content.slice(0, -1);
  }
  return content;
};

/**
 * @name 把图片的file对象转为blob
 */
export function imageFileToBlob(file: any): Promise<{ blobUrl: string; base64: string }> {
  const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return new Promise((resolve, reject) => {
    // 创建一个新的 FileReader 对象
    const reader = new FileReader();
    // 读取 File 对象
    reader.readAsDataURL(file);
    // 加载完成后
    reader.onload = function () {
      try {
        const base64Data = reader.result as string;
        // 解析base64Data，并返回blob字符串
        const blob = dataURLToBlob(base64Data);
        const url = URL.createObjectURL(blob);
        resolve({
          blobUrl: url,
          base64: base64Data
        });
      } catch (err) {
        reject(new Error(err));
      }
    };

    // 加载失败时
    reader.onerror = function () {
      reject(new Error("Failed to load file"));
    };
  });
}

/**
 * @name 通过blob-url获取base64
 * @desc 把图片的blob类型转为base64
 */
export async function fetchBlobAsBase64(url: string): Promise<{ base64: string; blobUrl: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          base64: reader.result as string,
          blobUrl: url
        });
      };
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching or processing blob:", error);
    throw error;
  }
}
