/*
 * @Date: 2024-11-04 20:26:41
 * @Description: Modify here please
 */
import type FishEditor from "./fish-editor";

/** 保存图片的base64 map数据 */
const editorImageBase64Map: Map<string, string> = new Map();
// 记录下当前 editor 的 destroy listeners
const instances: WeakMap<Node, FishEditor> = new WeakMap();

export default {
  editorImageBase64Map,
  instances
};
