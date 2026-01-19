import throttle from "lodash/throttle";
import cloneDeep from "lodash/cloneDeep";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";
import type { IRange } from "../core/selection";
import { split, util, dom, base, isNode } from "../utils";

/** Is it a client */
const isClient = typeof window !== "undefined";

const SHORTKEY = isClient ? (/Mac/i.test(navigator.platform) ? "metaKey" : "ctrlKey") : "ctrlKey";

interface KeyboardOptions {
  /** can enter new line  */
  isEnterNewLine: boolean;
  /** event binding container */
  bindings: Record<string, Binding>;
}
interface Context {
  /** If the start and end nodes are in the same position in the DOM, this property returns true; Otherwise, return false */
  collapsed: boolean;
  /** The starting position of the cursor belongs to a certain line */
  line: number | null;
  /** Native KeyboardEvent */
  event: KeyboardEvent;
}

interface BindingObject extends Partial<Pick<Context, "collapsed">> {
  key: string | number;
  shortKey?: boolean | null;
  shiftKey?: boolean | null;
  altKey?: boolean | null;
  metaKey?: boolean | null;
  ctrlKey?: boolean | null;
  handler?: (range: IRange, curContext: Context, binding: BindingObject) => boolean | void;
}

type Binding = BindingObject | string | number;

class Keyboard extends Module<KeyboardOptions> {
  static DEFAULTS: KeyboardOptions = {
    isEnterNewLine: false,
    bindings: {}
  };
  static match(evt: KeyboardEvent, binding: BindingObject) {
    // Match detects the state of a specific modifier key on the keyboard
    if (
      (["altKey", "ctrlKey", "metaKey", "shiftKey"] as const).some((key) => {
        return !!binding[key] !== evt[key] && binding[key] !== null;
      })
    ) {
      return false;
    }
    return binding.key === evt.key || binding.key === evt.which;
  }

  bindings: Record<string, BindingObject[]>;
  isLineFeedLock = false;
  /** throttle */
  emitThrottled = throttle(() => {
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, 300);
  constructor(fishEditor: FishEditor, options: Record<string, never>) {
    super(fishEditor, options);
    this.isLineFeedLock = false;
    this.bindings = {};

    // add default bindings
    Object.keys(this.options.bindings).forEach((name) => {
      if (this.options.bindings[name]) {
        this.addBinding(this.options.bindings[name]);
      }
    });

    if (this.options.isEnterNewLine) {
      // Enter or Enter + shiftKey line break
      this.addBinding({ key: "Enter", shiftKey: null }, this.handleLineFeed);
      this.addBinding({ key: "Enter", metaKey: null, ctrlKey: null, altKey: null }, () => {});
    } else {
      // Can only enter+ctrlKey line break
      this.addBinding({ key: "Enter", ctrlKey: true }, this.handleLineFeed);
      // Enter to send
      this.addBinding({ key: "Enter" }, () => {
        this.fishEditor.emit(Emitter.events.EDITOR_ENTER_DOWN, this.fishEditor);
      });
      // Block others
      this.addBinding({ key: "Enter", metaKey: null, shiftKey: null, altKey: null }, () => {});
    }

    // No selection, no backspace key
    this.addBinding({ key: "Backspace" }, { collapsed: true }, this.handleBackspace);
    this.addBinding({ key: "Delete", ctrlKey: null }, { collapsed: true }, this.handleDelete);
    // There are selection, backspace keys
    this.addBinding({ key: "Backspace" }, { collapsed: false }, this.handleDeleteRange);
    this.addBinding({ key: "Delete" }, { collapsed: false }, this.handleDeleteRange);
    this.addBinding(
      {
        key: "Backspace",
        altKey: null,
        ctrlKey: null,
        metaKey: null,
        shiftKey: null
      },
      { collapsed: true },
      this.handleBackspace
    );
    this.listen();
  }

  addBinding(
    keyBinding: Binding,
    context: Required<BindingObject["handler"]> | Partial<Omit<BindingObject, "key" | "handler">> = {},
    handler: Required<BindingObject["handler"]> = {}
  ) {
    const binding = normalize(keyBinding);
    if (binding == null) {
      console.warn("Attempting to add invalid keyboard binding", binding);
      return;
    }

    if (typeof context === "function") {
      context = { handler: context };
    }
    if (typeof handler === "function") {
      handler = { handler };
    }

    const singleBinding = {
      ...binding,
      key: binding.key,
      ...context,
      ...handler
    };

    this.bindings[singleBinding.key] = this.bindings[singleBinding.key] || [];
    this.bindings[singleBinding.key].push(singleBinding);
  }

  listen() {
    this.fishEditor.root.addEventListener("keydown", (evt: KeyboardEvent) => {
      if (evt.defaultPrevented || evt.isComposing) return;

      // Matching key
      const bindings = (this.bindings[evt.key] || []).concat(this.bindings[evt.which] || []);
      // pairing
      const matches = bindings.filter((binding) => Keyboard.match(evt, binding));

      const rangeInfo = this.fishEditor.selection.getRange();

      // 兜底处理
      if (rangeInfo == null || !this.fishEditor.selection.hasFocus() || !util.getNodeOfEditorElementNode(rangeInfo.startContainer)) {
        evt.preventDefault();
        return;
      }
      if (matches.length === 0) return;

      const startLine = this.fishEditor.selection.getLine(rangeInfo.startContainer);

      const curContext = {
        collapsed: rangeInfo.collapsed,
        event: evt,
        line: startLine
      } as Context;

      const prevented = matches.some((binding) => {
        if (binding.collapsed != null && binding.collapsed !== curContext.collapsed) {
          return false;
        }
        return binding.handler.call(this, rangeInfo, curContext, binding) !== true;
      });

      if (prevented) {
        evt.preventDefault();
      }

      /**
       * Problem 1: When dealing with the ctrl+a event, if there is no content, the br node of the selected row cannot be selected
       * bug:
       *Press the delete button: If the editor is already an empty node, block the delete button. Otherwise, the empty text nodes will be deleted, leading to bugs
       *Bottom treatment to prevent rough handling
       */
      // if ((evt.ctrlKey && evt.key == 'a') || evt.keyCode === 8) {
      //   const editor = this.fishEditor.editor
      //   if (!fishRange.isSelected() && editor?.isEmpty()) {
      //     evt.preventDefault()
      //     return
      //   }
      // }
    });
  }

  /** handle Line Feed */
  handleLineFeed(range: IRange) {
    if (this.isLineFeedLock) return;

    /**
     * @name 判断是否超出了输入上限? 如果上限，则不许换行
     * range.collapsed 没有选择内容
     * leftLength 还可输入的字符数
     * isLineBreakCount: 换行符是否算作字符数量
     */
    /** Does a newline character count as the number of characters */
    const isLineBreakCount = this.fishEditor.options.isLineBreakCount;
    // 还可输入的字符数
    const leftLength = this.fishEditor.getLeftLengthOfMaxLength();
    if (range.collapsed && leftLength <= 0 && isLineBreakCount) {
      console.warn("editor input limit------------");
      return;
    }

    this.isLineFeedLock = true;

    this.fishEditor.selection.deleteRange(range, () => {
      normalizeLineFeed.call(this, this.fishEditor.selection.getRange(), (success: boolean) => {
        if (success) {
          Promise.resolve().then(() => {
            this.fishEditor.emit(Emitter.events.EDITOR_BEFORE_CHANGE);
            this.emitThrottled();
          });
          this.fishEditor.scrollSelectionIntoView();
        }
        this.isLineFeedLock = false;
      });
    });
  }

  handleBackspace(range: IRange, context: Context) {
    const editor = this.fishEditor.editor;
    // 1. If the content is empty, go straight back. That's equivalent to the beginning of the first row
    // console.log(context.line, range.startOffset, range.startContainer)
    if (
      editor.isEmpty() ||
      /**
       * 1. When deleting content in Firefox browser, the cursor on the first line is left with a br,
       *  and the cursor position may be 1, while in other browsers, the cursor position is 0。
       * 2. If the cursor is at the position of the first line and the cursor position is 0 or 1,
       *  and the cursor is at the br node, return directly, otherwise Firefox browser will delete the current line。
       */
      (context.line == 0 && (range.startOffset == 0 || range.startOffset == 1) && range.startContainer.nodeName == "BR")
    ) {
      console.warn("Currently at the beginning of the first line, block it~");
      return false;
    }
    // 2. 提行操作。
    const mergeRows = () => {
      try {
        // The position of the node at the start position in the edit line
        const startLine = this.fishEditor.selection.getLine(range.startContainer);
        if (startLine == null) {
          return false;
        }
        // Not the first line, and the cursor is at the start position
        if (startLine > 0 && range.startOffset == 0) {
          const [startBehindNodeList, startNextNodeList] = dom.getRangeAroundNode({
            startContainer: range.startContainer,
            startOffset: range.startOffset
          });
          // console.log(startBehindNodeList, startNextNodeList)
          const preRowNode = this.fishEditor.selection.getLineRow(startLine - 1);

          if (startBehindNodeList.length == 0 && startNextNodeList.length) {
            if (preRowNode) {
              const cNode = dom.cloneNodes(startNextNodeList);
              if (preRowNode.firstChild && preRowNode.firstChild.nodeName == "BR") {
                dom.toTargetAddNodes(preRowNode as any, cNode, true);
              } else {
                dom.toTargetAddNodes(preRowNode as any, cNode, false);
              }
              // Delete current line
              this.fishEditor.selection.getLineRow(startLine)?.remove();
              this.fishEditor.selection.setCursorPosition(cNode[0], "before");
              return true;
            }
          }
          if (startBehindNodeList.length == 0 && startNextNodeList.length == 0) {
            // Delete current line
            this.fishEditor.selection.getLineRow(startLine)?.remove();
            if (preRowNode && preRowNode.lastChild) {
              this.fishEditor.selection.setCursorPosition(preRowNode.lastChild, "after");
            }
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error(error);
        return false;
      }
    };

    const state = mergeRows();
    // console.log(state);
    if (state) {
      Promise.resolve().then(() => {
        this.fishEditor.emit(Emitter.events.EDITOR_BEFORE_CHANGE);
        this.emitThrottled();
      });
      return false;
    }
    return true;
  }

  // TODO： Add the function of deleting rows
  handleDelete(range: IRange) {
    //  console.log(range)
  }
  handleDeleteRange(range: IRange) {
    this.fishEditor.selection.deleteRange(range, () => {
      Promise.resolve().then(() => {
        this.fishEditor.emit(Emitter.events.EDITOR_BEFORE_CHANGE);
        this.emitThrottled();
      });
    });
  }
}

function normalize(binding: Binding): BindingObject | null {
  if (typeof binding === "string" || typeof binding === "number") {
    binding = { key: binding };
  } else if (typeof binding === "object") {
    binding = cloneDeep(binding);
  } else {
    return null;
  }

  if (binding.shortKey) {
    binding[SHORTKEY] = binding.shortKey;
    delete binding.shortKey;
  }

  return binding;
}

/** @name line feed */
function normalizeLineFeed(rangeInfo: IRange, callBack: (success: boolean) => void) {
  if (!rangeInfo) return callBack(false);
  const rowElementNode = util.getNodeOfEditorElementNode(rangeInfo.startContainer);
  if (!rowElementNode) {
    return callBack(false);
  }

  const lineDom = base.createLineElement(true);

  if (!isNode.isEditElement(rowElementNode as HTMLElement)) {
    console.warn("No editing line node, cannot be inserted");
    return callBack(false);
  }

  if (util.getNodeOfEditorTextNode(rangeInfo.startContainer)) {
    const result = split.splitEditTextNode(rangeInfo);
    rangeInfo.startContainer = result.parentNode;
    rangeInfo.startOffset = result.startOffset;
  }

  const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(rangeInfo);
  // console.log(behindNodeList, nextNodeList, rangeInfo);

  const clNodes = dom.cloneNodes(nextNodeList);

  if (clNodes.length) {
    dom.toTargetAddNodes(lineDom, clNodes, false);

    dom.removeNodes(nextNodeList);
  } else {
    const br = document.createElement("br");
    dom.toTargetAddNodes(lineDom, [br]);
  }

  if (behindNodeList.length == 0 && nextNodeList.length) {
    const br = document.createElement("br");
    dom.toTargetAddNodes(rowElementNode, [br]);
  }

  dom.toTargetAfterInsertNodes(rowElementNode, [lineDom]);

  if (isNode.isDOMNode(lineDom.firstChild)) {
    this.fishEditor.selection.setCursorPosition(lineDom.firstChild, "before");
    callBack(true);
    return;
  }

  callBack(false);
}

function isContentChangingKey(evt: KeyboardEvent): boolean {
  const keyCode = evt.keyCode;

  // console.log(keyCode, evt)

  // 检查是否为组合键（如 Ctrl, Alt, Shift, Meta）
  if (evt.ctrlKey || evt.altKey || evt.shiftKey || evt.metaKey) {
    return false;
  }

  // 检查是否为字母键
  if (keyCode >= 65 && keyCode <= 90) {
    return true;
  }

  // 检查是否为数字键
  if (keyCode >= 48 && keyCode <= 57) {
    return true;
  }

  // 检查是否为数字键盘上的数字键
  if (keyCode >= 96 && keyCode <= 105) {
    return true;
  }

  // 检查是否为符号键
  if (keyCode >= 186 && keyCode <= 222) {
    return true;
  }

  // 拼音打字的时候
  if (keyCode == 229 && evt.key == "Process") {
    return true;
  }

  // 检查是否为空格键
  if (keyCode === 32) {
    return true;
  }

  // 检查是否为退格键或删除键
  if (keyCode === 8 || keyCode === 46) {
    return false;
  }

  return false;
}

export default Keyboard;
