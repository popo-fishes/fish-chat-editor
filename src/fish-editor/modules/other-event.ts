/*
 * @Date: 2024-11-04 16:34:52
 * @Description: Modify here please
 */
import Module from "../core/module";
import type Clipboard from "./clipboard";
import type FishEditor from "../core/fish-editor";

import { util, range, helper, isNode } from "../utils";

class OtherEvent extends Module {
  root: (typeof FishEditor)["prototype"]["root"];
  /** @name editor Menu Wrap Dom */
  editorMenuWrap: HTMLDivElement;
  constructor(fishEditor: FishEditor, options: Record<string, never>) {
    super(fishEditor, options);
    this.root = this.fishEditor.root;
    // change this direction
    this.handleClickOutside = this.handleClickOutside.bind(this);
    // create
    this.editorMenuWrap = this.fishEditor.options.showCustomizeMenu ? createMenuWrapDom() : null;
    // listeners
    this.setupListeners();
  }
  private setupListeners() {
    this.root.addEventListener("click", (e) => {
      e.preventDefault();
      this.onClick(e);
    });
    this.root.addEventListener("blur", this.onBlur.bind(this));

    this.root.addEventListener("drop", (e) => {
      // Disable drag and drop operations. Dragging images in the editor will cause the image's address to be entered into rich text
      e.preventDefault();
    });
    this.root.addEventListener("dragover", (e) => {
      // Disable drag and drop operations. Dragging images in the editor will cause the image's address to be entered into rich text
      e.preventDefault();
    });
    this.root.addEventListener("contextmenu", (e) => {
      if (this.fishEditor.options.disableRightMenu) {
        e.preventDefault();
      }

      if (this.editorMenuWrap) {
        if (isNode.isImageNode(e.target as any) || isNode.isEmojiImgNode(e.target as any)) {
          this.hideContextMenu();
          return;
        }
        this.showContextMenu(e);
      }
    });

    // Menu Dom Event
    if (this.editorMenuWrap) {
      this.editorMenuWrap.addEventListener("click", (e) => {
        this.handleMenuItemClick(e);
      });
      this.editorMenuWrap.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });
      // Add click event listener for document
      document.addEventListener("click", this.handleClickOutside);
    }
  }

  private onBlur(e: FocusEvent) {
    const rangeInfo = range.getRange();
    // console.log(rangeInfo);
    if (rangeInfo) {
      this.fishEditor.backupRangePosition(rangeInfo.startContainer as HTMLElement, rangeInfo.startOffset);
    }
    if (range.isSelected()) {
      // range?.removeAllRanges()
    }
  }

  private onClick(e: MouseEvent) {
    const target = e?.target as any;
    const emojiNode = util.getNodeOfEditorEmojiNode(target);
    if (emojiNode) {
      range.selectNode(emojiNode);
    }
    const imageNode = util.getNodeOfEditorImageNode(target);
    if (imageNode) {
      // range.selectNode(imageNode);
    }

    /**
     *If there is a cursor present
     *After clicking on the editor, if the cursor position node is a block node and an image node, move the cursor to its preceding sibling node.
     *1: It is necessary to ensure that the block nodes of the image cannot input content
     *When pasting images, we will insert a text input node in front of the image node.
     */

    // if (isDOMElement(target) && findNodeWithImg(target)) {

    //   if (pnode) {

    //     const selection = window.getSelection();

    //     selection?.removeAllRanges();

    //     const textNode = base.createChunkTextElement();

    //     pnode.insertAdjacentElement("afterend", textNode);

    //     range.setRangeNode(textNode, "after", () => {});
    //   }
    // }
  }

  private handleMenuItemClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    let menuItem = null;
    if (target.classList.contains("fb-menu-item")) {
      menuItem = target;
    } else {
      // Match a specific selector with the ancestor element closest to the current element
      menuItem = target.closest(".fb-menu-item") as HTMLElement | null;
    }

    if (menuItem) {
      const dataType = menuItem.getAttribute("data-type");

      switch (dataType) {
        case "copy":
          (this.fishEditor.getModule("clipboard") as Clipboard).captureCopy(null, false);
          break;
        case "cut":
          (this.fishEditor.getModule("clipboard") as Clipboard).captureCopy(null, true);
          break;
        case "paste":
          this.handlePaste();
          break;
        default:
          break;
      }

      this.hideContextMenu();
    }
  }

  /** Can the paste button be displayed */
  private async isShowPasteBtn() {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        const text = await navigator.clipboard.readText();
        const items = await navigator.clipboard.read();
        // There are images or content present
        if (text) return true;
        for (const item of items) {
          if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error("Unable to read the content of the clipboard: ", err);
        return false;
      }
    }
    return false;
  }

  private async handlePaste() {
    const showPaste = await this.isShowPasteBtn();
    if (!showPaste) return;

    try {
      /**
       * !! New browser: Clipboard API
       * Browsers commonly support reading text, HTML, and PNG image data.
       * read()? Unable to process JPEG format
       */
      const clipboardItems = await navigator.clipboard.read();
      const text = await navigator.clipboard.readText();
      const clipboardModule = this.fishEditor.getModule("clipboard") as Clipboard;
      //  console.log(clipboardItems)

      if (text) {
        clipboardModule.capturePaste(null, text);
        return;
      }

      let file = null;
      for (const item of clipboardItems) {
        if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
          const blob = (await item.getType("image/png")) || (await item.getType("image/jpeg"));
          const fileName = "clipboard-image" + helper.generateRandomString() + ".png";
          file = new File([blob], fileName, { type: blob.type });
        }
      }

      const isPasteFile = clipboardModule.getIsPasteFile();
      if (file && isPasteFile) {
        // console.log(file)
        clipboardModule.capturePaste([file], null);
      }
    } catch (error) {
      // this.fallbackHandlePaste()
      console.error("Failed to read clipboard:", error);
    }
  }

  private fallbackHandlePaste() {
    // Create a hidden textarea to capture paste content
    const textArea = document.createElement("textarea");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);

    textArea.addEventListener("paste", (e) => {
      e.preventDefault();
      // @ts-expect-error
      const clp = e.clipboardData || (e.originalEvent && (e.originalEvent as any).clipboardData);
      const isFile = clp?.types?.includes("Files");
      const isHtml = clp?.types?.includes("text/html");
      const isPlain = clp?.types?.includes("text/plain");

      const content = clp.getData("text/plain");
      console.log(clp, content);
      // if (isFile && this.options.isPasteFile) {
      //   const files = isObject(clp.files) ? Object.values(clp.files) : clp.files
      //   this.capturePaste(files, null)
      // }
    });
    // 创建 DataTransfer 对象并设置数据
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", "Hello, Paste!");

    // 创建 paste 事件
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer
    });

    textArea.dispatchEvent(pasteEvent);
  }

  private async showContextMenu(e: MouseEvent) {
    // Has it already been displayed?
    // if (isElementVisible(this.editorMenuWrap)) {
    //   return
    // }
    const showPaste = await this.isShowPasteBtn();
    let isShoweditorMenuWrap = false;
    if (this.editorMenuWrap) {
      const copyDom = getMenuItemsByDataType.call(this, "copy");
      const cutDom = getMenuItemsByDataType.call(this, "cut");
      const pasteDom = getMenuItemsByDataType.call(this, "paste");

      if (range.isSelected()) {
        copyDom.style.display = "inline-flex";
        cutDom.style.display = "inline-flex";
        isShoweditorMenuWrap = true;
      } else {
        copyDom.style.display = "none";
        cutDom.style.display = "none";
      }

      if (showPaste) {
        pasteDom.style.display = "inline-flex";
        isShoweditorMenuWrap = true;
      } else {
        pasteDom.style.display = "none";
      }
    }

    if (this.editorMenuWrap && isShoweditorMenuWrap) {
      this.editorMenuWrap.style.display = "flex";
      // Obtain the height of the menu and the height of the screen
      const menuHeight = this.editorMenuWrap.offsetHeight;
      const screenHeight = window.innerHeight;

      let top = e.clientY;
      let left = e.clientX;

      // Check if the menu extends beyond the bottom of the screen
      if (top + menuHeight > screenHeight) {
        // top = screenHeight - menuHeight
        top = e.clientY - menuHeight;
      }

      // Check if the menu extends beyond the right side of the screen
      const menuWidth = this.editorMenuWrap.offsetWidth;
      const screenWidth = window.innerWidth;
      if (left + menuWidth > screenWidth) {
        left = screenWidth - menuWidth;
      }

      this.editorMenuWrap.style.left = `${left}px`;
      this.editorMenuWrap.style.top = `${top}px`;
    }
  }

  private hideContextMenu() {
    if (this.editorMenuWrap) {
      this.editorMenuWrap.style.display = "none";
    }
  }

  private handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (this.editorMenuWrap && !this.editorMenuWrap.contains(target)) {
      this.hideContextMenu();
    }
  }

  public destroy() {
    this.editorMenuWrap?.remove();
    // Remove the click event listener from the document
    document.removeEventListener("click", this.handleClickOutside);

    this.editorMenuWrap = null;
  }
}

function createMenuWrapDom() {
  const menuWrapDom = document.createElement("div");
  menuWrapDom.className = "fb-editor-menu-wrap";
  const cdn = "http://43.136.119.145:83/image";
  const _html = `
  <div class="fb-menu-item" data-type="copy">
    <img src="${cdn}/editor-copy.png"/>
    <span>复制</span>
  </div>
  <div class="fb-menu-item" data-type="cut">
    <img src="${cdn}/editor-cut.png"/>
    <span>剪切</span>
  </div>
  <div class="fb-menu-item" data-type="paste">
    <img src="${cdn}/editor-paste.png"/>
    <span>粘贴</span>
  </div>
`;
  menuWrapDom.innerHTML = _html;

  if (document?.body) {
    document.body.appendChild(menuWrapDom);
    return menuWrapDom;
  }

  return null;
}

function getMenuItemsByDataType(dataType: string): HTMLElement {
  if (this.editorMenuWrap) {
    return this.editorMenuWrap.querySelector(`.fb-menu-item[data-type="${dataType}"]`) as HTMLElement | null;
  }
  return null;
}

function isElementVisible(element: HTMLDivElement) {
  if (!element) return false;

  // Check if the element is hidden by CSS
  const style = window.getComputedStyle(element);

  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  // Check if the element is hidden by getBoundingClientRect
  const rect = element.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  return true;
}

/**
 * issue：
 * js 自定义右键菜单 点击粘贴按钮 ，如何获取剪切板的内容，当剪切板的内容是 jpeg图片格式 如何获取
 * js 点击按钮主动获取剪切板的内容，当剪切板的内容是 jpeg图片格式 如何获取
 */

export default OtherEvent;
