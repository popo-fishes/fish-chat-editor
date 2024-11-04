import Module from "../core/module";
import Emitter from "../core/emitter";
import type FishEditor from "../core/fish-editor";
import { helper, base, dom, isNode, util, range, transforms } from "../../core";

class Clipboard extends Module {
  constructor(fishEditor: FishEditor, options: Record<string, never>) {
    super(fishEditor, options);
    this.fishEditor.root.addEventListener("copy", (e) => this.onCaptureCopy(e, false));
    this.fishEditor.root.addEventListener("cut", (e) => this.onCaptureCopy(e, true));
    // this.fishEditor.root.addEventListener("paste", this.onCapturePaste.bind(this));
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

    // 将内容添加到＜div＞中，这样我们就可以获得它的内部HTML。
    const odiv = contents.ownerDocument.createElement("div");
    odiv.appendChild(contents);

    odiv.setAttribute("hidden", "true");
    contents.ownerDocument.body.appendChild(odiv);

    const content = transforms.getNodePlainText(odiv);

    // event.clipboardData.setData("text/html", odiv.innerHTML);
    event.clipboardData?.setData("text/plain", content);
    contents.ownerDocument.body.removeChild(odiv);

    if (isCut) {
      // 后续可以拓展删除节点方法，先原生的
      document.execCommand("delete", false, undefined);
    }
  }
}
export default Clipboard;
