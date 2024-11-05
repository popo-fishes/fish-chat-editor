/*
 * @Date: 2024-03-19 09:43:43
 */
export { default } from "./components/chat-editor";

export { useClickAway } from "./hooks";

export { replaceMsgText } from "./utils";

export { labelRep, Emitter } from "./fish-editor";
export type { default as FishEditor, IEmitter } from "./fish-editor";

export type * from "./types";

export const Version = "1.2.0";
