/*
 * @Date: 2024-11-05 11:31:03
 * @Description: Modify here please
 */
import { isNode } from "../utils";
import store from "./store";

/** Retrieve the image file blobURL from the editor (excluding emoticons) */
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
 * !!! Clear the base64 map data of saved images
 */
export const removeEditorImageBse64Map = async (hasEmpty: boolean, node: HTMLElement) => {
  if (hasEmpty) {
    store.editorImageBase64Map.clear();
    return;
  }

  const blobUrlList = getEditImageFileBlobUrl(node);

  if (blobUrlList.length == 0) {
    store.editorImageBase64Map.clear();
    return;
  }

  if (blobUrlList.length == store.editorImageBase64Map.size) {
    return;
  }

  const keysIterable = store.editorImageBase64Map.keys();

  // Convert iterable objects into arrays
  const keyArray = Array.from(keysIterable);

  for (let i = 0; i < keyArray.length; i++) {
    if (!blobUrlList.includes(keyArray[i])) {
      store.editorImageBase64Map.delete(keyArray[i]);
    }
  }
};
