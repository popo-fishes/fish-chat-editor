/*
 * @Date: 2024-11-04 10:54:20
 * @Description: Modify here please
 */
import type FishEditor from "./fish-editor";

export interface ThemeOptions {
  modules: Record<string, boolean>;
}

class Theme {
  modules: ThemeOptions["modules"] = {};
  constructor(
    protected fishEditor: FishEditor,
    protected options: ThemeOptions
  ) {}

  init() {
    Object.keys(this.options.modules).forEach((name) => {
      if (this.modules[name] == null) {
        this.addModule(name);
      }
    });
  }

  addModule(name: string) {
    // @ts-expect-error
    const ModuleClass = this.fishEditor.constructor.import(`modules/${name}`);
    const value = this.options.modules[name];
    this.modules[name] = new ModuleClass(this.fishEditor, value === true || !value ? {} : value);
    return this.modules[name];
  }
}

export interface ThemeConstructor {
  new (fishEditor: FishEditor, options: unknown): Theme;
}

export default Theme;
