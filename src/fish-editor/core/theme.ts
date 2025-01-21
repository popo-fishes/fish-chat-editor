/*
 * @Date: 2024-11-04 10:54:20
 * @Description: Modify here please
 */
import type FishEditor from "./fish-editor";
import type Clipboard from "../modules/clipboard";
import type Uploader from "../modules/uploader";
import type Keyboard from "../modules/keyboard";

export interface ThemeOptions {
  modules: Record<string, unknown>;
}

class Theme {
  modules: ThemeOptions["modules"] = {};
  constructor(
    protected fishEditor: FishEditor,
    protected options: ThemeOptions
  ) {}

  init() {
    Object.keys({ ...this.options.modules }).forEach((name) => {
      if (this.modules[name] == null) {
        this.addModule(name);
      }
    });
  }
  addModule(name: "clipboard"): Clipboard;
  addModule(name: "keyboard"): Keyboard;
  addModule(name: "uploader"): Uploader;
  addModule(name: string): unknown;
  addModule(name: string) {
    // @ts-expect-error
    const ModuleClass = this.fishEditor.constructor.import(`modules/${name}`);
    this.modules[name] = new ModuleClass(this.fishEditor, this.options.modules[name]);
    return this.modules[name];
  }
}

export default Theme;
