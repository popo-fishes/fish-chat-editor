/*
 * @Date: 2024-11-04 18:58:37
 * @Description: Modify here please
 */
import throttle from 'lodash/throttle'
import isObject from 'lodash/isObject'
import Module from '../core/module'
import Emitter from '../core/emitter'
import type Uploader from './uploader'
import type FishEditor from '../core/fish-editor'
import { base, isNode } from '../utils'

interface IClipboardOptions {
  /** Can I paste the image */
  isPasteFile?: boolean
}

class Clipboard extends Module<IClipboardOptions> {
  static DEFAULTS: IClipboardOptions = {
    isPasteFile: true,
  }

  isPasteLock = false
  /** throttle */
  emitThrottled = throttle(() => {
    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor)
  }, 300)
  constructor(fishEditor: FishEditor, options: Partial<IClipboardOptions>) {
    super(fishEditor, options)
    this.fishEditor.root.addEventListener('copy', (e) => this.captureCopy(e, false))
    this.fishEditor.root.addEventListener('cut', (e) => this.captureCopy(e, true))
    this.fishEditor.root.addEventListener('paste', this.onCapturePaste.bind(this))
  }

  public getIsPasteFile() {
    return this.options.isPasteFile
  }

  public async captureCopy(event: ClipboardEvent | null, isCut = false) {
    if (event) {
      if (event.defaultPrevented) return
      event.preventDefault()
    }

    if (this.fishEditor.selection.getRange().collapsed) {
      return
    }

    const normalized = this.fishEditor.selection.getNativeRange(true) as Range | null

    const contentsDom = normalized?.cloneContents() || null

    if (!contentsDom) return

    const odiv = contentsDom.ownerDocument.createElement('div')

    odiv.appendChild(contentsDom)

    odiv.setAttribute('hidden', 'true')

    try {
      contentsDom.ownerDocument.body.appendChild(odiv)

      const content = getCursorSelectedNodePlainText(odiv)

      contentsDom.ownerDocument.body.removeChild(odiv)

      await copyToClipboard(content)

      if (isCut) {
        this.fishEditor.selection.deleteRange(this.fishEditor.selection.getRange(), () => {
          Promise.resolve().then(() => {
            this.emitThrottled()
          })
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  private onCapturePaste(e: ClipboardEvent) {
    if (e.defaultPrevented || !this.fishEditor.isEnabled()) return
    e.preventDefault()

    // @ts-expect-error
    const clp = e.clipboardData || (e.originalEvent && (e.originalEvent as any).clipboardData)
    const isFile = clp?.types?.includes('Files')
    const isHtml = clp?.types?.includes('text/html')
    const isPlain = clp?.types?.includes('text/plain')

    if (isFile && this.options.isPasteFile) {
      const files = isObject(clp.files) ? Object.values(clp.files) : clp.files
      this.capturePaste(files, null)
    }

    if ((isHtml || isPlain) && !isFile) {
      const content = clp.getData('text/plain')
      this.capturePaste(null, content)
    }
  }

  public capturePaste(files: File[] | null, content: string | null) {
    if (!this.fishEditor.root || this.isPasteLock) return
    if (files) {
      const vfiles = Array.from(files || [])
      if (vfiles.length > 0) {
        const uploader = this.fishEditor.getModule('uploader') as Uploader
        this.isPasteLock = true
        uploader.upload(vfiles, (success) => {
          if (success) {
            Promise.resolve().then(() => {
              this.emitThrottled()
            })
            this.fishEditor.scrollSelectionIntoView()
          }
          this.isPasteLock = false
        })
        return
      }
    } else if (content) {
      this.fishEditor.selection.deleteRange(this.fishEditor.selection.getRange(), () => {
        this.isPasteLock = true
        // delay insert
        requestAnimationFrame(() => {
          this.fishEditor.editor.insertText(
            content,
            this.fishEditor.selection.getRange(),
            (success) => {
              if (success) {
                Promise.resolve().then(() => {
                  this.fishEditor.emit(Emitter.events.EDITOR_BEFORE_CHANGE)
                  this.emitThrottled()
                })
                this.fishEditor.scrollSelectionIntoView()
              }
              this.isPasteLock = false
            },
            true,
          )
        })
      })
    }
  }
}

/**
 * @name get the plain text of the selected node with the cursor
 */
function getCursorSelectedNodePlainText(node: HTMLElement) {
  let text = ''

  if (isNode.isDOMText(node) && node.nodeValue) {
    return node.nodeValue
  }

  if (isNode.isDOMElement(node)) {
    for (const childNode of Array.from(node.childNodes)) {
      text += getCursorSelectedNodePlainText(childNode as any)
    }

    const display = getComputedStyle(node).getPropertyValue('display')

    if (isNode.isEmojiImgNode(node)) {
      const emojiNodeAttrName = base.getElementAttributeDatasetName('emojiNode')

      const isEmojiVal = node.dataset?.[emojiNodeAttrName] || ''
      if (isEmojiVal) {
        text += isEmojiVal
      }
    }

    if (display === 'block') {
      text += '\n'
    }
  }

  return text
}

/**
 * copy To Clipboard
 * @param content
 */
async function copyToClipboard(textToCopy: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy)
    } else {
      // Use the 'out of viewport hidden text area' trick
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy

      // Move textarea out of the viewport so it's not visible
      textArea.style.position = 'absolute'
      textArea.style.left = '-999999px'

      document.body.prepend(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
      } catch (error) {
        console.error(error)
      } finally {
        textArea.remove()
      }
    }
  } catch (err) {
    // Use the 'out of viewport hidden text area' trick
    const textArea = document.createElement('textarea')
    textArea.value = textToCopy

    // Move textarea out of the viewport so it's not visible
    textArea.style.position = 'absolute'
    textArea.style.left = '-999999px'

    document.body.prepend(textArea)
    textArea.select()

    try {
      document.execCommand('copy')
    } catch (error) {
      console.error(error)
    } finally {
      textArea.remove()
    }
  }
}

export default Clipboard
