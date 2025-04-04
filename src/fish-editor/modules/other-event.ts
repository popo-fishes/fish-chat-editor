/*
 * @Date: 2024-11-04 16:34:52
 * @Description: Modify here please
 */
import Module from "../core/module";
import type Clipboard from "./clipboard";
import type FishEditor from "../core/fish-editor";

import { util, helper, isNode, ua } from "../utils";

const isShowCustomizeMenu = (open: boolean) => {
  let isShow = false;
  // 在外包传递开始时，还需要判断浏览器类型
  if (open) {
    if (ua.IS_FIREFOX) {
      isShow = false;
    } else {
      isShow = true;
    }
  }

  return isShow;
};

class OtherEvent extends Module {
  isInputFocused: boolean;
  root: (typeof FishEditor)["prototype"]["root"];
  /** @name editor Menu Wrap Dom */
  editorMenuWrap: HTMLDivElement;
  constructor(fishEditor: FishEditor, options: Record<string, never>) {
    super(fishEditor, options);
    this.root = this.fishEditor.root;
    // change this direction
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleDocumentkeydown = this.handleDocumentkeydown.bind(this);
    // create
    this.editorMenuWrap = isShowCustomizeMenu(this.fishEditor.options.showCustomizeMenu) ? createMenuWrapDom() : null;
    // listeners
    this.setupListeners();
  }
  private setupListeners() {
    this.root.addEventListener("click", (e) => {
      e.preventDefault();
      this.onClick(e);
    });
    this.root.addEventListener("focus", () => {
      this.isInputFocused = true;
    });

    this.root.addEventListener("drop", (e) => {
      // Disable drag and drop operations. Dragging images in the editor will cause the image's address to be entered into rich text
      e.preventDefault();
    });
    this.root.addEventListener("dragover", (e) => {
      // Disable drag and drop operations. Dragging images in the editor will cause the image's address to be entered into rich text
      e.preventDefault();
    });

    // Right click to trigger menu
    this.root.addEventListener("contextmenu", (e) => {
      /**
       * 开启右键菜单的, editorMenuWrap节点存在。
       */
      if (this.editorMenuWrap) {
        if (isNode.isImageNode(e.target as any) || isNode.isEmojiImgNode(e.target as any)) {
          this.hideContextMenu();
          e.preventDefault();
          return;
        }
        this.showContextMenu(e);
        e.preventDefault();
      }
    });

    // Monitor global keydown events
    document.addEventListener("keydown", this.handleDocumentkeydown);

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

  private onClick(e: MouseEvent) {
    const target = e?.target as any;
    const emojiNode = util.getNodeOfEditorEmojiNode(target);
    if (emojiNode) {
      this.fishEditor.selection.selectNode(emojiNode);
    }
    const imageNode = util.getNodeOfEditorImageNode(target);
    if (imageNode) {
      // range.selectNode(imageNode);
    }
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
      console.error("Failed to read clipboard:", error);
    }
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

      if (this.fishEditor.selection.isSelected()) {
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

  private handleDocumentkeydown(evt: KeyboardEvent) {
    const isUndoKey = (evt.ctrlKey && evt.key == "z") || (evt.metaKey && evt.key == "z");
    if (isUndoKey && !this.isInputFocused) {
      evt.preventDefault();
    }
  }

  public destroy() {
    this.editorMenuWrap?.remove();
    // Remove the click event listener from the document
    document.removeEventListener("click", this.handleClickOutside);
    document.removeEventListener("keydown", this.handleDocumentkeydown);
    this.editorMenuWrap = null;
  }
}

function createMenuWrapDom() {
  const menuWrapDom = document.createElement("div");
  menuWrapDom.className = "fb-editor-menu-wrap";
  const cdn = "https://cdn.yupaowang.com/yupao_pc/images/im/icon";
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

export default OtherEvent;
