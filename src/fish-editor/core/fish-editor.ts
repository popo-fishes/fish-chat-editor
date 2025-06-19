/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import merge from 'lodash/merge'
import { helper, base, dom, util } from '../utils'
import type { IEmojiType } from '../../types'
import type OtherEventType from '../modules/other-event'
import type Keyboard from '../modules/keyboard'
import type InputType from '../modules/input'
import { emojiSize } from '../../config'
import Emitter from './emitter'
import Selection from './selection'
import Composition from './composition'
import Module from './module'
import Theme from './theme'
import Editor from './editor'
import store from './store'
import scrollRectIntoView, { type Rect } from './utils/scroll-rectInto-view'
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

export type ExpandedFishEditorOptions = Required<IFishEditorOptions> & Record<string, unknown>

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

  static imports: Record<string, unknown> = {
    'core/module': Module,
    'core/theme': Theme,
  }

  static import(name: 'core/module'): typeof Module
  static import(name: string): unknown
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
  keyboard: Keyboard
  editor: Editor
  isDestroyed: boolean
  constructor(container: HTMLElement | string, options: IFishEditorOptions = {}) {
    this.container = resolveSelector(container)
    this.options = expandConfig(options)
    this.isDestroyed = false
    this.scrollDom = null

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
    this.keyboard = this.theme.addModule('keyboard')
    this.theme.addModule('clipboard')
    this.theme.addModule('other-event')
    this.theme.addModule('uploader')
    this.theme.addModule('history')
    this.theme.addModule('input')
    this.theme.init()

    this.emitter.on(Emitter.events.EDITOR_CHANGE, ({ editor }, notChange?: boolean) => {
      // Update placeholder visibility
      const hasEmpty = (editor as Editor).isEmpty()
      this.container.classList.toggle('is-placeholder-visible', hasEmpty)
      // removeEditorImageBse64Map Promise asynchronous execution
      return new Promise((resolve, reject) => {
        if (!notChange) {
          const length = this.editor.getLength()
          const maxLength = this.options.maxLength
          if (maxLength && length && length > maxLength) {
            console.time('truncate-editor-string')
            const editorText = this.editor.getText()
            const ntext = helper.truncateString(editorText, maxLength)
            const lines = ntext?.split(/\r\n|\r|\n/) || []
            const data = []
            for (let i = 0; i < lines.length; i++) {
              data.push(`<p>${lines[i] || ''}</p>`)
            }
            this.editor.setHtml(data.join(''), true)
            console.timeEnd('truncate-editor-string')
            this.blur()
            this.emit(Emitter.events.EDITOR_MAXLENGTH)
          }
        }

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
  getText(isPure = false) {
    return this.editor.getText(isPure)
  }
  getLength() {
    return this.editor.getLength()
  }

  getHtml() {
    return this.editor.getProtoHTML()
  }

  setHtml(value: string) {
    this.editor.setHtml(value)
  }
  isPureTextAndInlineElement() {
    return this.editor.isPureTextAndInlineElement()
  }
  scrollRectIntoView(rect: Rect) {
    scrollRectIntoView(this.root, rect)
  }
  /**
   * Scroll the current selection into the visible area.
   * If the selection is already visible, no scrolling will occur.
   */
  scrollSelectionIntoView() {
    const range = this.selection.getRange()
    const bounds = range && this.selection.getBounds(range)
    // console.log(range, bounds)
    if (bounds) {
      this.scrollRectIntoView(bounds)
    }
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

  insertEmoji(item: IEmojiType) {
    if (!this.editor) return

    const imgNode = base.createChunkEmojiElement(item.url, emojiSize, item.name)

    const currentRange = this.selection.savedRange

    const editorElementNode = util.getNodeOfEditorElementNode(currentRange.startContainer)

    if (!editorElementNode) return

    this.editor.insertNode([imgNode], currentRange, (success) => {
      if (success) {
        this.emit(Emitter.events.EDITOR_CHANGE, this)
        this.scrollSelectionIntoView()
      }
    })
  }

  destroy() {
    if (this.isDestroyed) return
    ;(this.getModule('other-event') as OtherEventType).destroy()
    ;(this.getModule('input') as InputType).destroy()
    // del dom
    this.root?.remove()
    this.scrollDom?.remove()

    if (this.container) {
      this.container.innerHTML = ''
    }

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
