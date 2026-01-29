/*
 * @Date: 2024-03-19 09:43:43
 */
export { default } from "./components/ChatEditor";
export { default as TextAreaEditor } from "./components/TextAreaEditor";

export * from "./hooks";

export { default as FishEditor, labelRep, replaceMsgText, Module, Emitter } from "./fish-editor";
export type { IEmitter } from "./fish-editor";

export type * from "./types";

export const Version = "2.1.8";
