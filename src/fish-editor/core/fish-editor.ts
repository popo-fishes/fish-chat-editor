/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import merge from "lodash/merge";
import { helper, base, dom, isNode, util, range as fishRange, transforms } from "../../core";
import type { IRange } from "../../core";

import Emitter from "./emitter";
import Composition from "./composition";
import Theme from "./theme";

export interface ExpandedFishEditorOptions {
  modules: Record<string, boolean>;
  placeholder: string;
  readOnly: boolean;
}

export interface IFishEditorOptions {
  /**
   * 是否禁用编辑
   * @default false
   */
  readOnly?: boolean;
  placeholder?: string;
  modules?: Record<string, boolean>;
}

class FishEditor {
  static DEFAULTS = {
    modules: {
      clipboard: true,
      keyboard: true
    },
    placeholder: "",
    readOnly: false
  } satisfies Partial<IFishEditorOptions>;
  static events = Emitter.events;

  static imports: Record<string, unknown> = {};
  static import(name: string) {
    if (this.imports[name] == null) {
      console.warn(`无法导入${name}。你确定它已经注册了吗？`);
    }
    return this.imports[name];
  }
  static register(...args: any[]): void {
    if (typeof args[0] !== "string") {
      const target = args[0];
      Object.keys(target).forEach((key) => {
        this.register(key, target[key]);
      });
    } else {
      const path = args[0];
      const target = args[1];
      this.imports[path] = target;
    }
  }
  /** @name 编辑器配置项 */
  options: ExpandedFishEditorOptions;
  /** @name 编辑器最外层容器 */
  container: HTMLElement;
  /** @name 编辑器根节点*/
  root: HTMLDivElement;
  composition: Composition;
  emitter: Emitter;
  theme: Theme;
  /** @name 当前选区信息 */
  rangeInfo: IRange;
  constructor(container: HTMLElement | string, options: IFishEditorOptions = {}) {
    this.container = resolveSelector(container);
    this.options = expandConfig(options);
    // 选区信息
    this.rangeInfo = {
      startContainer: null,
      startOffset: 0,
      endContainer: null,
      endOffset: 0,
      anchorNode: null
    };

    if (this.container == null) {
      console.error("Invalid Editor container", container);
      return;
    }
    this.container.classList.add("fb-editor-container");
    this.root = this.addContainer("fb-editor");
    this.init();
    this.emitter = new Emitter();
    this.composition = new Composition(this.root, this.emitter);

    this.theme = new Theme(this, this.options);
    this.theme.addModule("input");
    this.theme.addModule("other-event");
    // this.theme.init();
    if (this.options.readOnly) {
      this.disable();
    } else {
      this.enable();
    }
  }
  private init() {
    if (this.root) {
      const node = base.createLineElement();
      dom.toTargetAddNodes(this.root, [node]);
      this.backupRangePosition(node, 0, true);
    }
  }
  addContainer(container: string): HTMLDivElement {
    let editor: HTMLDivElement = null;
    if (typeof container === "string") {
      const className = container;
      editor = document.createElement("div");
      editor.classList.add(className);
      editor.setAttribute("data-fish-editor", "true");
      editor.setAttribute("spellCheck", "false");
    }
    const scroll = document.createElement("div");
    scroll.classList.add("fb-editor-scroll");
    scroll.insertBefore(editor, null);
    this.container.insertBefore(scroll, null);
    return editor;
  }
  enable(enabled = true) {
    this.root.setAttribute("contenteditable", enabled ? "true" : "false");
  }
  disable() {
    this.enable(false);
  }

  off(...args: Parameters<(typeof Emitter)["prototype"]["off"]>) {
    return this.emitter.off(...args);
  }
  on(...args: Parameters<(typeof Emitter)["prototype"]["on"]>) {
    return this.emitter.on(...args);
  }
  once(...args: Parameters<(typeof Emitter)["prototype"]["once"]>) {
    return this.emitter.once(...args);
  }
  /** @name 备份选区的位置 */
  public backupRangePosition(node: HTMLElement, startOffset: number, isReset?: boolean) {
    let targetDom = node;
    if (isNode.isEditElement(node) && isReset) {
      targetDom = (node as any).firstChild;
    }
    this.rangeInfo = {
      startContainer: targetDom,
      startOffset: startOffset || 0,
      endContainer: targetDom,
      endOffset: 0,
      anchorNode: targetDom
    };
  }
}

function expandConfig(options: IFishEditorOptions): ExpandedFishEditorOptions {
  const { modules: moduleDefaults, ...restDefaults } = FishEditor.DEFAULTS;

  const modules: ExpandedFishEditorOptions["modules"] = merge({}, moduleDefaults, options.modules);

  const config = {
    ...restDefaults,
    ...omitUndefinedValuesFromOptions(options)
  };

  return {
    ...config,
    modules: Object.entries(modules).reduce((modulesWithDefaults, [name, value]) => {
      if (!value) return modulesWithDefaults;

      const moduleClass = FishEditor.import(`modules/${name}`);
      if (moduleClass == null) {
        console.warn(`无法导入${name}。你确定它已经注册了吗？`);
        return modulesWithDefaults;
      }
      return {
        ...modulesWithDefaults,
        [name]: value
      };
    }, {})
  };
}

function omitUndefinedValuesFromOptions(obj: IFishEditorOptions) {
  return Object.fromEntries(Object.entries(obj).filter((entry) => entry[1] !== undefined));
}

export function resolveSelector(selector: string | HTMLElement | null | undefined) {
  return typeof selector === "string" ? document.querySelector<HTMLElement>(selector) : selector;
}

export type IFishEditorInstance = InstanceType<typeof FishEditor>;

export { FishEditor as default };
