/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import merge from 'lodash/merge'
import { helper, base, dom, isNode, util, transforms } from '../utils'
import type { IRange } from './selection'
import type { IEmojiType } from '../../types'
import type OtherEventType from '../modules/other-event'
import type InputType from '../modules/input'
import { emojiSize } from '../../config'
import Emitter from './emitter'
import Selection from './selection'
import Composition from './composition'
import Theme from './theme'
import Editor from './editor'
import store from './store'
import { removeEditorImageBse64Map } from './helper'

export interface IFishEditorOptions {
  /** Configuration options for each module in the editor */
  modules?: Record<string, unknown>
  /** Do you want to disable editing */
  readOnly?: boolean
  /** Display custom menu */
  showCustomizeMenu?: boolean
  /** placeholder */
  placeholder?: string
  /** maxLength */
  maxLength?: number | null
  /** maxHeight? The maximum height value has been set, and if exceeded, a scrollbar will automatically appear */
  maxHeight?: number | null
  /** minHeight? Minimum height of editor; When the maximum height is not applicable; Editor height self increasing */
  minHeight?: number | null
}

export type ExpandedFishEditorOptions = Required<IFishEditorOptions> & {}

class FishEditor {
  static DEFAULTS: IFishEditorOptions = {
    modules: {
      clipboard: true,
      input: true,
      keyboard: true,
      uploader: true,
      history: true,
    },
    placeholder: '请输入内容',
    maxLength: null,
    showCustomizeMenu: false,
    readOnly: false,
    maxHeight: null,
    minHeight: 75,
  }
  static events = Emitter.events

  static imports: Record<string, unknown> = {}
  static import(name: string) {
    if (this.imports[name] == null) {
      console.warn(`Unable to import ${name}. Are you sure it has already been registered?`)
    }
    return this.imports[name]
  }
  static register(...args: any[]): void {
    if (typeof args[0] !== 'string') {
      const target = args[0]
      Object.keys(target).forEach((key) => {
        this.register(key, target[key])
      })
    } else {
      const path = args[0]
      const target = args[1]
      this.imports[path] = target
    }
  }
  options: ExpandedFishEditorOptions
  /** @name Editor outermost container node */
  container: HTMLElement
  /** @name root*/
  root: HTMLDivElement
  /** @name scroll Dom */
  scrollDom: HTMLDivElement
  /** @name Composition Event */
  composition: Composition
  emitter: Emitter
  selection: Selection
  theme: Theme
  editor: Editor
  rangeInfo: IRange
  isDestroyed: boolean
  constructor(container: HTMLElement | string, options: IFishEditorOptions = {}) {
    this.container = resolveSelector(container)
    this.options = expandConfig(options)
    this.isDestroyed = false
    this.scrollDom = null
    // range Info
    this.rangeInfo = {
      startContainer: null,
      startOffset: 0,
      endContainer: null,
      endOffset: 0,
      collapsed: true,
    }

    if (this.container == null) {
      console.error('Invalid Editor container', container)
      return
    }
    // add instance
    store.instances.set(this.container, this)
    // add root dom
    this.root = this.addContainer()
    this.emitter = new Emitter()
    this.editor = new Editor(this)
    this.selection = new Selection(this.root, this.emitter)
    this.composition = new Composition(this.root, this.emitter)
    this.theme = new Theme(this, this.options)
    this.theme.addModule('keyboard')
    this.theme.addModule('clipboard')
    this.theme.addModule('other-event')
    this.theme.addModule('uploader')
    this.theme.addModule('history')
    this.theme.addModule('input')
    this.theme.init()

    this.emitter.on(Emitter.events.EDITOR_CHANGE, ({ editor }, notChange?: boolean) => {
      if (!notChange) {
        const length = this.editor.getLength()
        const maxLength = this.options.maxLength
        if (maxLength && length && length > maxLength) {
          const text = this.editor.getText()
          const ntext = text.substring(0, maxLength)
          this.editor.setHtml(`<p>${ntext}</p>`, true)
          this.blur()
          this.emit(Emitter.events.EDITOR_MAXLENGTH)
        }
      }

      // console.log(editor);
      // Update placeholder visibility
      const hasEmpty = (editor as Editor).isEditorEmptyNode()
      this.container.classList.toggle('is-placeholder-visible', hasEmpty)
      // removeEditorImageBse64Map Promise asynchronous execution
      return new Promise((resolve, reject) => {
        removeEditorImageBse64Map(hasEmpty, this.root)
          .then(() => {
            resolve(true)
          })
          .catch((error) => {
            reject(error)
          })
      })
    })

    if (this.options.readOnly) {
      this.disable()
    } else {
      this.enable()
    }

    // setTimeout(() => {
    //   this.setHtml(
    //     '<p>哈哈<span style="color: red">1212</span><strong>湿哒哒</strong><em>我是斜体</em><u>下划线</u><del>我被删除了</del><a target="_blank">link</a></p>',
    //   )
    // })
  }

  addContainer(): HTMLDivElement {
    this.container.classList.add(...['fb-editor-container', 'is-placeholder-visible'])

    // add editor dom
    const editorDom = document.createElement('div')
    editorDom.classList.add('fb-editor')
    editorDom.setAttribute('data-fish-editor', 'true')
    editorDom.setAttribute('spellCheck', 'false')
    if (this.options.minHeight) {
      editorDom.style.minHeight = `${this.options.minHeight}px`
    }

    // add scroll dom
    this.scrollDom = document.createElement('div')
    this.scrollDom.classList.add('fb-editor-scroll')
    if (this.options.maxHeight) {
      this.scrollDom.style.maxHeight = `${this.options.maxHeight}px`
    }

    dom.toTargetAddNodes(this.scrollDom, [editorDom], false)

    // add placeholder dom
    const placeholderDom = document.createElement('div')
    placeholderDom.classList.add('fb-placeholder')
    if (this.options.placeholder) {
      placeholderDom.innerHTML = this.options.placeholder
    }
    dom.toTargetAddNodes(this.container, [this.scrollDom, placeholderDom], false)
    return editorDom
  }

  setScrollDomHeight(maxHeight: number) {
    if (maxHeight) {
      this.scrollDom.style.maxHeight = `${maxHeight}px`
    }
  }

  isEnabled() {
    return this.editor.isEnabled()
  }

  disable() {
    this.editor.enable(false)
  }
  enable() {
    this.editor.enable()
  }

  getModule(name: string) {
    return this.theme.modules[name]
  }
  clear() {
    this.editor.clear()
  }
  blur() {
    this.editor.blur()
  }
  focus() {
    this.editor.focus()
  }
  setText(value: string) {
    return this.editor.setText(value)
  }
  getText() {
    return this.editor.getText()
  }

  getHtml() {
    return this.editor.getProtoHTML()
  }

  setHtml(value: string) {
    this.editor.setHtml(value)
  }
  isEmpty() {
    return this.editor.isEmpty()
  }

  off(...args: Parameters<(typeof Emitter)['prototype']['off']>) {
    return this.emitter.off(...args)
  }
  on(...args: Parameters<(typeof Emitter)['prototype']['on']>) {
    return this.emitter.on(...args)
  }
  once(...args: Parameters<(typeof Emitter)['prototype']['once']>) {
    return this.emitter.once(...args)
  }

  emit(...args: Parameters<(typeof Emitter)['prototype']['emit']>) {
    return this.emitter.emit(...args)
  }

  backupRangePosition(node: HTMLElement, startOffset: number, isReset?: boolean) {
    let targetDom = node
    if (isNode.isEditElement(node) && isReset) {
      targetDom = (node as any).firstChild
    }
    this.rangeInfo = {
      startContainer: targetDom,
      startOffset: startOffset || 0,
      endContainer: targetDom,
      endOffset: startOffset || 0,
      collapsed: true,
    }
  }

  insertEmoji(item: IEmojiType) {
    if (!this.editor) return

    const imgNode = base.createChunkEmojiElement(item.url, emojiSize, item.name)

    const currentRange = this.rangeInfo

    const editorElementNode = util.getNodeOfEditorElementNode(currentRange.startContainer)

    if (!editorElementNode) {
      this.editor.setCursorEditorLast((rowNode) => {
        if (rowNode) {
          const rangeInfo = this.selection.getRange()
          this.editor.insertNode([imgNode], rangeInfo, (success) => {
            if (success) {
              this.emit(Emitter.events.EDITOR_CHANGE, this)
            }
          })
        }
      })
      return
    } else {
      this.editor.insertNode([imgNode], currentRange, (success) => {
        if (success) {
          this.emit(Emitter.events.EDITOR_CHANGE, this)
        }
      })
    }
  }

  destroy() {
    if (this.isDestroyed) return
    ;(this.getModule('other-event') as OtherEventType).destroy()
    ;(this.getModule('input') as InputType).destroy()
    // del dom
    this.root?.remove()
    this.container?.remove()
    this.emit('destroyed')
    this.isDestroyed = true
  }
}

function expandConfig(options: IFishEditorOptions): ExpandedFishEditorOptions {
  const { modules: moduleDefaults, ...restDefaults } = FishEditor.DEFAULTS

  const modules: ExpandedFishEditorOptions['modules'] = merge(
    {},
    expandModuleConfig(moduleDefaults),
    expandModuleConfig(options.modules),
  )

  const config = {
    ...restDefaults,
    ...omitUndefinedValuesFromOptions(options),
  }

  return {
    ...config,
    modules: Object.entries(modules).reduce((modulesWithDefaults, [name, value]) => {
      if (!value) return modulesWithDefaults

      const moduleClass = FishEditor.import(`modules/${name}`)

      if (moduleClass == null) {
        console.warn(`Unable to import ${name}. Are you sure it has already been registered?`)
        return modulesWithDefaults
      }

      return {
        ...modulesWithDefaults,
        // @ts-expect-error Module class may not have DEFAULTS property, but we still want to merge with defaults if available
        [name]: merge({}, moduleClass.DEFAULTS || {}, value),
      }
    }, {}),
  } as any
}

function omitUndefinedValuesFromOptions(obj: IFishEditorOptions) {
  return Object.fromEntries(Object.entries(obj).filter((entry) => entry[1] !== undefined))
}

function expandModuleConfig(config: Record<string, unknown> | undefined) {
  return Object.entries(config ?? {}).reduce(
    (expanded, [key, value]) => ({
      ...expanded,
      [key]: value === true ? {} : value,
    }),
    {} as Record<string, unknown>,
  )
}

function resolveSelector(selector: string | HTMLElement | null | undefined) {
  return typeof selector === 'string' ? document.querySelector<HTMLElement>(selector) : selector
}

export type IFishEditorInstance = InstanceType<typeof FishEditor>

export { FishEditor as default }
