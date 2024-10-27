/*
 * @Date: 2024-03-19 09:43:43
 */
export { default } from "./components/chat-editor";

export { useClickAway } from "./hooks";

export { replaceMsgText, labelRep } from "./utils";

export { default as Emitter } from "./editor/emitter";

export type * from "./types";
export type * from "./editor";
export type { IEmitter } from "./editor/emitter";

export const Version = "1.0.9";
