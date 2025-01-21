import isFunction from "lodash/isFunction";
import isArray from "lodash/isArray";
import { isNode, base, type IRange, range } from "../utils";
import type FishEditor from "../core/fish-editor";
import store from "../core/store";
import Module from "../core/module.js";

interface IUploaderOptions {
  /** @name Support file types */
  mimetypes: string[];
  /** @name Maximum number of uploaded files */
  slice: number;
  /** @name Hook before file insertion */
  beforeUpload?: (files: File[], amount: number) => (File[] | []) | Promise<File[] | []>;
}

class Uploader extends Module<IUploaderOptions> {
  static DEFAULTS: IUploaderOptions = {
    mimetypes: ["image/png", "image/jpeg"],
    slice: 10
  };

  constructor(fishEditor: FishEditor, options: Partial<IUploaderOptions>) {
    super(fishEditor, options);
  }

  async upload(rangeInfo: IRange, files: File[], callBack: (success: boolean) => void) {
    // capture
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

    if (uploads.length == 0) {
      callBack(false);
      return;
    }

    const promiseData: Promise<{ blobUrl: string; base64: string }>[] = [];

    for (let i = 0; i < uploads.length; i++) {
      const file = uploads[i];
      promiseData.push(imageFileToBlob(file));
    }

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
            if (range.isSelected()) {
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
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = function () {
      try {
        const base64Data = reader.result as string;
        // Parse base64Data and return blob string
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

    reader.onerror = function () {
      reject(new Error("Failed to load file"));
    };
  });
}

export default Uploader;
