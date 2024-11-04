/*
 * @Date: 2024-11-04 10:54:20
 * @Description: Modify here please
 */
import type FishEditor from "./fish-editor";

export interface ThemeOptions {
  modules: Record<string, unknown>;
}

class Theme {
  modules: ThemeOptions["modules"] = {};
  constructor(
    protected fishEditor: FishEditor,
    protected options: ThemeOptions
  ) {
    this.init();
  }

  init() {
    const baseModule = {
      input: {},
      "other-event": {},
      uploader: {}
    };

    Object.keys({ ...this.options.modules, ...baseModule }).forEach((name) => {
      if (this.modules[name] == null) {
        this.addModule(name);
      }
    });
  }

  addModule(name: string) {
    // @ts-expect-error
    const ModuleClass = this.fishEditor.constructor.import(`modules/${name}`);
    this.modules[name] = new ModuleClass(this.fishEditor, this.options.modules[name]);
    return this.modules[name];
  }
}

export default Theme;
