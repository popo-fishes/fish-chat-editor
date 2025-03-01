/*
 * @Date: 2024-11-04 18:58:37
 * @Description: Modify here please
 */
import throttle from "lodash/throttle";
import isObject from "lodash/isObject";
import Module from "../core/module";
import Emitter from "../core/emitter";
import type Uploader from "./uploader";
import type FishEditor from "../core/fish-editor";
import { range, transforms } from "../utils";

interface IClipboardOptions {
  /** Can I paste the image */
  isPasteFile?: boolean;
}

class Clipboard extends Module<IClipboardOptions> {
  static DEFAULTS: IClipboardOptions = {
    isPasteFile: true
  };

  isPasteLock = false;
  /** throttle */
  emitThrottled = throttle(() => {
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor);
  }, 300);
  constructor(fishEditor: FishEditor, options: Partial<IClipboardOptions>) {
    super(fishEditor, options);
    this.fishEditor.root.addEventListener("copy", (e) => this.onCaptureCopy(e, false));
    this.fishEditor.root.addEventListener("cut", (e) => this.onCaptureCopy(e, true));
    this.fishEditor.root.addEventListener("paste", this.onCapturePaste.bind(this));
  }

  onCaptureCopy(event: ClipboardEvent, isCut = false) {
    if (event.defaultPrevented) return;
    event.preventDefault();

    if (!range.isSelected()) {
      return;
    }

    const selection = range.getSelection();

    const contents = selection.getRangeAt(0)?.cloneContents();

    if (!contents) return;

    const odiv = contents.ownerDocument.createElement("div");
    odiv.appendChild(contents);

    odiv.setAttribute("hidden", "true");
    contents.ownerDocument.body.appendChild(odiv);

    const content = transforms.getNodePlainText(odiv);

    // event.clipboardData.setData("text/html", odiv.innerHTML);
    event.clipboardData?.setData("text/plain", content);
    contents.ownerDocument.body.removeChild(odiv);

    if (isCut) {
      document.execCommand("delete", false, undefined);
    }
  }
  onCapturePaste(e: ClipboardEvent) {
    if (e.defaultPrevented || !this.fishEditor.isEnabled()) return;
    e.preventDefault();

    const rangeInfo = range.getRange();

    if (rangeInfo == null || !this.fishEditor.root || this.isPasteLock) return;

    // @ts-expect-error
    const clp = e.clipboardData || (e.originalEvent && (e.originalEvent as any).clipboardData);
    const isFile = clp?.types?.includes("Files");
    const isHtml = clp?.types?.includes("text/html");
    const isPlain = clp?.types?.includes("text/plain");

    if (isFile && this.options.isPasteFile) {
      const files = isObject(clp.files) ? Object.values(clp.files) : clp.files;
      const vfiles = Array.from(files || []);
      if (vfiles.length > 0) {
        const uploader = this.fishEditor.getModule("uploader") as Uploader;
        this.isPasteLock = true;
        // @ts-expect-error
        uploader.upload(rangeInfo, vfiles, (success) => {
          if (success) {
            Promise.resolve().then(() => {
              this.emitThrottled();
            });
          }
          this.isPasteLock = false;
        });
        return;
      }
    }

    if ((isHtml || isPlain) && !isFile) {
      const content = clp.getData("text/plain");

      if (!content) {
        return;
      }

      if (range.isSelected()) {
        document.execCommand("delete", false, undefined);
      }

      this.isPasteLock = true;

      {
        this.fishEditor.editor.insertText(
          content,
          rangeInfo,
          (success) => {
            if (success) {
              Promise.resolve().then(() => {
                this.fishEditor.emit(Emitter.events.EDITOR_INPUT_CHANGE);
                this.emitThrottled();
              });
            }
            this.isPasteLock = false;
          },
          true
        );
      }
    }
  }
}
export default Clipboard;
