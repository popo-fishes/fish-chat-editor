/* eslint-disable @typescript-eslint/ban-types */
/*
 * @Date: 2025-02-11 09:20:06
 * @Description: Modify here please
 */
import store from './store'

interface SubscribeEvent {
  fn: Function
  once: boolean
}

export interface IEmitter {
  addEvent(type: string, callback: Function, once?: boolean): void

  on(type: string, callback: Function): void

  emit(type: string, ...args: Array<any>): void

  off(type: string, callback: Function): void

  once(type: string, callback: Function): void
}

const EVENTS = ['selectionchange', 'mousedown', 'mouseup', 'click']

EVENTS.forEach((eventName) => {
  document.addEventListener(eventName, (...args) => {
    Array.from(document.querySelectorAll('.fb-editor-container')).forEach((node) => {
      const fishEditor = store.instances.get(node)
      if (fishEditor && fishEditor.emitter) {
        fishEditor.emitter.handleDOM(...args)
      }
    })
  })
})

class Emitter {
  static events = {
    EDITOR_CHANGE: 'editor-change',
    EDITOR_ENTER_DOWN: 'editor-enter-down',
    COMPOSITION_START: 'composition-start',
    COMPOSITION_END: 'composition-end',
    /** When rich text operations change, quickly trigger changes, such as line breaks and pasting */
    EDITOR_INPUT_CHANGE: 'editor-input-change',
    /** on maxlength */
    EDITOR_MAXLENGTH: 'maxlength',
  } as const

  subscribes: Map<string, Array<SubscribeEvent>>

  protected domListeners: Record<string, { node: Node; handler: Function }[]>

  constructor() {
    this.subscribes = new Map()
    this.domListeners = {}
  }

  addEvent(type: string, callback: Function, once = false) {
    const sub = this.subscribes.get(type) || []
    sub.push({ fn: callback, once })
    this.subscribes.set(type, sub)
  }

  /**
   * event subscriptions
   * @param type
   * @param callback
   */
  on(type: string, callback: Function) {
    this.addEvent(type, callback)
  }

  emit(type: string, ...args: Array<any>) {
    const sub = this.subscribes.get(type) || []

    sub.forEach(({ fn }) => {
      fn.call(this, ...args)
    })

    const newSub = sub.filter((item) => !item.once)
    this.subscribes.set(type, newSub)

    // editor 销毁时，off 掉 destroyed listeners
    if (type === 'destroyed') {
      this.subscribes.clear()
    }
  }

  off(type: string, callback: Function) {
    const sub = this.subscribes.get(type)

    if (sub) {
      const newSub = sub.filter(({ fn }) => fn !== callback)
      this.subscribes.set(type, newSub)
    }
  }

  once(type: string, callback: Function) {
    this.addEvent(type, callback, true)
  }

  handleDOM(event: Event, ...args: unknown[]) {
    ;(this.domListeners[event.type] || []).forEach(({ node, handler }) => {
      if (event.target === node || node.contains(event.target as Node)) {
        handler(event, ...args)
      }
    })
  }

  listenDOM(eventName: string, node: Node, handler: EventListener) {
    if (!this.domListeners[eventName]) {
      this.domListeners[eventName] = []
    }
    this.domListeners[eventName].push({ node, handler })
  }
}

export default Emitter
