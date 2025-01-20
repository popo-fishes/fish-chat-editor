import isFunction from "lodash/isFunction";
import isArray from "lodash/isArray";
import { isNode, base, type IRange, range } from "../utils";
import type FishEditor from "../core/fish-editor";
import store from "../core/store";
import Module from "../core/module.js";

interface UploaderOptions {
  mimetypes: string[];
  slice: number;
  /** @param beforePasteImage 图片插入前的钩子 */
  beforeUpload?: (files: File[], amount: number) => (File[] | []) | Promise<File[] | []>;
}

class Uploader extends Module<UploaderOptions> {
  static DEFAULTS: UploaderOptions = {
    mimetypes: ["image/png", "image/jpeg"],
    slice: 10
  };

  constructor(fishEditor: FishEditor, options: Partial<UploaderOptions>) {
    super(fishEditor, options);
  }

  async upload(rangeInfo: IRange, files: File[], callBack: (success: boolean) => void) {
    // 截取
    const filtratefiles = this.options.slice ? files.slice(0, this.options.slice) : files;
    let uploads: File[] = [];
    Array.from(filtratefiles).forEach((file) => {
      if (file && this.options.mimetypes?.includes(file.type)) {
        uploads.push(file);
      }
    });
    if (uploads.length > 0) {
      const beforeUpload = this.options?.beforeUpload || null;
      if (isFunction(beforeUpload)) {
        const amount = getEditImageAmount(this.fishEditor.root);
        const result = await beforeUpload(uploads, amount);
        if (isArray(result) && result?.length) {
          uploads = result;
        } else {
          uploads = [];
        }
      }
    }

    // 如果是一个空文件直接返回
    if (uploads.length == 0) {
      callBack(false);
      return;
    }

    const promiseData: Promise<{ blobUrl: string; base64: string }>[] = [];
    console.time("图片转换耗时");

    for (let i = 0; i < uploads.length; i++) {
      const file = uploads[i];
      promiseData.push(imageFileToBlob(file));
    }
    console.timeEnd("图片转换耗时");

    // 执行其他操作
    {
      Promise.allSettled(promiseData)
        .then((res) => {
          const datas: { blobUrl: string; base64: string }[] = [];
          res.forEach((result) => {
            if (result.status == "fulfilled" && result.value) {
              datas.push(result.value);
            }
          });

          const nodes: HTMLSpanElement[] = [];
          datas.forEach((item) => {
            // const zeroSpaceNode = base.createZeroSpaceElement() as any;
            nodes.push(...[base.createChunkImgElement(item.blobUrl)]);
            store.editorImageBase64Map.set(item.blobUrl, item.base64);
          });

          if (nodes.length) {
            // 存在选区
            if (range.isSelected()) {
              // 后续可以拓展删除节点方法，先原生的
              document.execCommand("delete", false, undefined);
            }
            this.fishEditor.editor.insertNode(nodes, rangeInfo, (success) => {
              callBack(success);
            });
            return;
          }
          callBack(false);
          return;
        })
        .catch(() => {
          callBack(false);
        });
    }
  }
}

/** 获取编辑器中有多少个图片文件（不包含表情） */
const getEditImageAmount = (node: (typeof FishEditor)["prototype"]["root"]): number => {
  let amount = 0;
  if (isNode.isDOMElement(node)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      amount += getEditImageAmount((node as any).childNodes[i]);
    }

    if (isNode.isImageNode(node)) {
      amount += 1;
    }
  }
  return amount;
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

export default Uploader;
