/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from "lodash/throttle";
import { range as fishRange, dom } from "../utils";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";

interface InputOptions {
  /** Match word highlighted color */
  highlightColor?: string;
  /** Need to match the text array of highlighted words */
  matchWordsList?: string[];
  /** Throttle duration */
  throttleTime?: number;
}

class Input extends Module<InputOptions> {
  static DEFAULTS: InputOptions = {
    highlightColor: "red",
    throttleTime: 300
  };
  /** @name highlight cover node*/
  highlightCoverDom: HTMLElement;
  /** @name Match words data */
  matchWordsList: string[];
  /** @name throttle */
  emitThrottled = throttle(async () => {
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, this.options.throttleTime);
  constructor(fishEditor: FishEditor, options: Partial<InputOptions>) {
    super(fishEditor, options);
    this.matchWordsList = this.options.matchWordsList;
    // change this direction
    this.handleInputChange = this.handleInputChange.bind(this);
    this.onScrollChange = this.onScrollChange.bind(this);

    this.handleComposition();

    // add cover-mask dom
    if (this.matchWordsList?.length && this.fishEditor.container) {
      if (this.highlightCoverDom) {
        this.removeHighlightCoverDom();
        requestAnimationFrame(() => {
          this.addHighlightCoverDom();
        });
      } else {
        this.addHighlightCoverDom();
      }
    }

    fishEditor.root.addEventListener("beforeinput", (event: InputEvent) => {
      this.handleBeforeInput(event);
    });

    fishEditor.root.addEventListener("input", this.handleInput.bind(this, true));
  }
  /** Monitor editor scrolling */
  private onScrollChange() {
    const scrollTop = this.fishEditor.scrollDom.scrollTop;
    this.highlightCoverDom.scrollTop = scrollTop;
  }

  /** trigger text conversion event listening */
  private handleInputChange() {
    // Promise asynchronous execution
    Promise.resolve().then(() => {
      handleInputTransforms.call(this);
    });
  }
  /** add matching word mask nodes */
  private addHighlightCoverDom() {
    this.highlightCoverDom = document.createElement("div");
    this.highlightCoverDom.classList.add("fb-cover-mask-box");
    this.fishEditor.container.classList.add("is-highlight");
    this.fishEditor.container.appendChild(this.highlightCoverDom);
    this.fishEditor.scrollDom.addEventListener("scroll", this.onScrollChange);

    // When the monitoring value changes, we actively trigger text conversion
    this.fishEditor.on(Emitter.events.EDITOR_CHANGE, this.handleInputChange);

    this.fishEditor.on(Emitter.events.EDITOR_INPUT_CHANGE, this.handleInputChange);
  }

  /** @name Delete matching word mask node */
  private removeHighlightCoverDom() {
    if (this.highlightCoverDom) {
      this.fishEditor.container.removeChild(this.highlightCoverDom);
    }
    this.fishEditor.container.classList.remove("is-highlight");
    this.fishEditor.scrollDom.removeEventListener("scroll", this.onScrollChange);
    this.fishEditor.off(Emitter.events.EDITOR_CHANGE, this.handleInputChange);
    this.fishEditor.off(Emitter.events.EDITOR_INPUT_CHANGE, this.handleInputChange);
    // set null
    this.matchWordsList = null;
    this.highlightCoverDom = null;
  }

  /** Set matching word data */
  public setMatchWords(list: string[]) {
    if (list.length) {
      this.removeHighlightCoverDom();
      this.fishEditor.clear();
      this.matchWordsList = list;
      requestAnimationFrame(() => {
        this.addHighlightCoverDom();
      });
    } else {
      this.removeHighlightCoverDom();
    }
  }

  private handleComposition() {
    this.fishEditor.on(Emitter.events.COMPOSITION_END, () => {
      this.handleInput(false);
    });
  }

  private handleInput(isOriginalEvent: boolean) {
    if (isOriginalEvent) {
      Promise.resolve().then(() => {
        // Update placeholder visibility
        const hasEmpty = this.fishEditor.editor.isEditorEmptyNode();
        this.fishEditor.container.classList.toggle("is-placeholder-visible", hasEmpty);

        if (this.matchWordsList?.length) {
          handleInputTransforms.call(this);
        }
      });
    }
    /** isComposing ?? */
    if (this.fishEditor.composition.isComposing) return;
    this.emitThrottled();
  }

  private handleBeforeInput(event: InputEvent) {
    const rangeInfo = fishRange.getRange();
    // console.log(event, rangeInfo);
  }
}

/**
 * @name Text Conver
 */
const handleInputTransforms = async function () {
  const content = this.fishEditor.getText();
  let strCont = content;
  this.matchWordsList?.forEach((item: string) => {
    const reg = new RegExp(item, "g");
    // replace
    strCont = strCont?.replace(reg, () => {
      return `<span style="color: ${this.options.highlightColor};">${item}</span>`;
    });
  });

  const lines = strCont?.split(/\r\n|\r|\n/) || [];
  const nodes = [];
  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const dom_p = document.createElement("p");
    dom_p.innerHTML = lineContent == "" ? "<br>" : lineContent;
    nodes.push(dom_p);
  }
  dom.toTargetAddNodes(this.highlightCoverDom, nodes as any[]);
  return true;
};

export default Input;
