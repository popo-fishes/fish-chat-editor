/*
 * @Date: 2024-11-04 20:26:41
 * @Description: Modify here please
 */
import type FishEditor from "./fishEditor";

const editorImageBase64Map: Map<string, string> = new Map();

const instances: WeakMap<Node, FishEditor> = new WeakMap();

export default {
  editorImageBase64Map,
  instances
};
