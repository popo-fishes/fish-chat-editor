/*
 * @Date: 2024-10-19 13:10:56
 * @Description: Modify here please
 */
import { base, isNode } from "../../core";
import type { IEditorElement } from "../../types";

/** 获取编辑器中有多少个图片文件（不包含表情） */
export const getEditImageAmount = (node: IEditorElement): number => {
  let amount = 0;
  if (isNode.isDOMElement(node)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      amount += getEditImageAmount((node as any).childNodes[i]);
    }

    if (isNode.isEditInline(node) && isNode.isImageNode(node)) {
      amount += 1;
    }
  }
  return amount;
};

/** 获取编辑器中的图片文件blobUrl（不包含表情） */
const getEditImageFileBlobUrl = (node: IEditorElement): string[] => {
  const result: string[] = [];
  function traverse(node) {
    if (isNode.isDOMElement(node)) {
      if (isNode.isEditInline(node) && isNode.isImageNode(node)) {
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
export const removeEditorImageBse64Map = async (hasEmpty: boolean, node: IEditorElement) => {
  if (hasEmpty) {
    // 清空图片map值
    base.editorImageBase64Map.clear();
    return;
  }

  const blobUrlList = getEditImageFileBlobUrl(node);

  if (blobUrlList.length == 0) {
    // 清空图片map值
    base.editorImageBase64Map.clear();
    return;
  }

  if (blobUrlList.length == base.editorImageBase64Map.size) {
    return;
  }

  const keysIterable = base.editorImageBase64Map.keys();

  // 将可迭代对象转换为数组
  const keyArray = Array.from(keysIterable);

  for (let i = 0; i < keyArray.length; i++) {
    // 如果在数组里面找不到，就删除
    if (!blobUrlList.includes(keyArray[i])) {
      base.editorImageBase64Map.delete(keyArray[i]);
    }
  }
};
