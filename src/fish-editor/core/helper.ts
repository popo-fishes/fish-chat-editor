/*
 * @Date: 2024-11-05 11:31:03
 * @Description: Modify here please
 */
import { isNode } from "../utils";
import store from "./store";

/** 获取编辑器中的图片文件blobUrl（不包含表情） */
const getEditImageFileBlobUrl = (node: HTMLElement): string[] => {
  const result: string[] = [];
  function traverse(node) {
    if (isNode.isDOMElement(node)) {
      if (isNode.isImageNode(node)) {
        result.push(node.src);
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
      }
    }
  }

  traverse(node);

  return result;
};

/**
 * !!! 清除保存图片的base64 map数据
 */
export const removeEditorImageBse64Map = async (hasEmpty: boolean, node: HTMLElement) => {
  if (hasEmpty) {
    // 清空图片map值
    store.editorImageBase64Map.clear();
    return;
  }

  const blobUrlList = getEditImageFileBlobUrl(node);

  if (blobUrlList.length == 0) {
    // 清空图片map值
    store.editorImageBase64Map.clear();
    return;
  }

  if (blobUrlList.length == store.editorImageBase64Map.size) {
    return;
  }

  const keysIterable = store.editorImageBase64Map.keys();

  // 将可迭代对象转换为数组
  const keyArray = Array.from(keysIterable);

  for (let i = 0; i < keyArray.length; i++) {
    // 如果在数组里面找不到，就删除
    if (!blobUrlList.includes(keyArray[i])) {
      store.editorImageBase64Map.delete(keyArray[i]);
    }
  }
};
