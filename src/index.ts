/*
 * @Date: 2024-03-19 09:43:43
 */
export { default } from "./components/chat-editor";

export { useClickAway } from "./hooks";

export { replaceMsgText } from "./utils";

export { default as FishEditor, labelRep, Emitter } from "./fish-editor";
export type { IEmitter } from "./fish-editor";

export type * from "./types";

export const Version = "2.0.9";
