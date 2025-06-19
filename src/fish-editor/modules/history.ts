/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from 'lodash/throttle'
import { dom, transforms, helper, isNode, base } from '../utils'
import Module from '../core/module'
import Emitter from '../core/emitter'
import type FishEditor from '../core/fish-editor'

export type IDeltaSchemaContent = {
  type: 'text' | 'image' | 'br'
  text?: string
  attrs?: { [key: string]: any }
}

export type IDeltaSchema = {
  type: 'row'
  content: IDeltaSchemaContent[]
}

export interface HistoryOptions {
  maxStack: number
  delay: number
}

export interface StackItem {
  editorDelta: IDeltaSchema[]
  range: {
    nodeIndexPaths: number[]
    endOffset: number
  }
}

interface Stack {
  undo: StackItem[]
  redo: StackItem[]
}

class History extends Module<HistoryOptions> {
  static DEFAULTS: HistoryOptions = {
    delay: 1000,
    maxStack: 50,
  }

  lastRecorded = 0
  ignoreChange = false
  stack: Stack = { undo: [], redo: [] }
  constructor(fishEditor: FishEditor, options: Partial<HistoryOptions>) {
    super(fishEditor, options)

    this.fishEditor.on(Emitter.events.EDITOR_CHANGE, () => {
      if (!this.ignoreChange) {
        this.record()
      }
    })
    // throttle
    const throttleUndo = throttle(this.undo.bind(this), 300)
    const throttleRedo = throttle(this.redo.bind(this), 300)

    this.fishEditor.keyboard.addBinding({ key: 'z', shortKey: true }, throttleUndo)
    this.fishEditor.keyboard.addBinding({ key: 'z', shortKey: true, shiftKey: true }, throttleRedo)
    this.fishEditor.keyboard.addBinding({ key: 'Z', shortKey: true, shiftKey: true }, throttleRedo)

    fishEditor.root.addEventListener('beforeinput', (event) => {
      if (event.inputType === 'historyUndo') {
        this.undo()
        event.preventDefault()
      } else if (event.inputType === 'historyRedo') {
        this.redo()
        event.preventDefault()
      }
    })
  }

  change(source: 'undo' | 'redo', dest: 'redo' | 'undo') {
    if (this.stack[source].length === 0) return
    const item = this.stack[source].pop()
    if (!item) return
    this.stack[dest].push(item)

    this.lastRecorded = 0
    this.ignoreChange = true

    const lastItem = source == 'undo' ? this.stack[source][this.stack[source].length - 1] : item
    if (lastItem?.editorDelta) {
      renderDeltaSchema.call(this, lastItem.editorDelta, () => {
        const referenceNode = getNodeByIndexPaths(this.fishEditor.root, lastItem.range.nodeIndexPaths)
        if (referenceNode && isNode.isDOMElement(referenceNode)) {
          this.fishEditor.selection.setCursorPosition(referenceNode, 'after')
        } else {
          this.fishEditor.selection.setCursorPosition(referenceNode, null, lastItem.range.endOffset)
        }
        this.fishEditor.scrollSelectionIntoView()
        this.ignoreChange = false
      })
    } else {
      this.fishEditor.clear()
      this.fishEditor.focus()
      this.ignoreChange = false
    }
  }

  record() {
    this.stack.redo = []
    const cloneEditeNode = this.fishEditor.root.cloneNode(true) as any
    const undoVal = createDeltaSchema(cloneEditeNode)
    const currentRange = this.fishEditor.selection.getRange()

    if (!currentRange) return

    const undoRange: StackItem['range'] = {
      endOffset: currentRange.endOffset,
      nodeIndexPaths: getIndexPathToParentWithElementNode.call(this, currentRange.startContainer),
    }

    const timestamp = Date.now()
    if (this.lastRecorded + this.options.delay > timestamp && this.stack.undo.length > 0) {
      this.stack.undo.pop()
    } else {
      this.lastRecorded = timestamp
    }
    if (!undoVal) return

    this.stack.undo.push({ editorDelta: undoVal, range: undoRange })
    if (this.stack.undo.length > this.options.maxStack) {
      this.stack.undo.shift()
    }
  }

  clear() {
    this.stack = { undo: [], redo: [] }
  }

  redo() {
    this.change('redo', 'undo')
  }

  undo() {
    this.change('undo', 'redo')
  }
}

function getIndexPathToParentWithElementNode(node, indexes = []) {
  // If the current node is document or has no parent node, terminate the recursion
  if (!node) {
    return []
  }

  const parent = node.parentElement

  if (!parent) {
    return []
  }

  // Obtain the index of the current node in the parent node
  const siblings = Array.from(parent.childNodes)

  const index = siblings.indexOf(node)

  if (isNode.isEditElement(parent)) {
    indexes.push(index)
    indexes.push(this.fishEditor.selection.getLine(parent))
    return indexes.reverse()
  } else {
    indexes.push(index)
    return getIndexPathToParentWithElementNode(parent, indexes)
  }
}

function getNodeByIndexPaths(root: HTMLDivElement, paths: number[]) {
  if (!paths || paths.length == 0) return null

  let currentNode: Node | null = root

  try {
    for (const index of paths) {
      if (!currentNode || !currentNode.childNodes || currentNode.childNodes.length <= index) {
        return null
      }
      currentNode = currentNode.childNodes[index] || null
    }
  } catch (error) {
    return null
  }

  return currentNode
}

function createDeltaSchema(root: HTMLDivElement) {
  const result: IDeltaSchema[] = []
  if (!root || !root?.childNodes) return []

  const nodes: ChildNode[] = Array.from(root.childNodes)

  function createEditElementContent(node: HTMLElement) {
    const content: IDeltaSchemaContent[] = []
    const nodes = Array.from(node.childNodes)

    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        // 文本节点
        content.push({
          type: 'text',
          text: node.textContent,
        })
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (isNode.isEmojiImgNode(el)) {
          // 图片
          content.push({
            type: 'image',
            attrs: serializeAttributes(el),
          })
        }
        if (isNode.isImageNode(el)) {
          // 图片
          content.push({
            type: 'image',
            attrs: serializeAttributes(el),
          })
        }
      }
    }

    return content
  }

  for (const cld of Array.from(nodes)) {
    if (isNode.isEditElement(cld as HTMLElement)) {
      const content = createEditElementContent(cld as any)
      if (content.length) {
        result.push({
          type: 'row',
          content: content,
        })
      } else {
        result.push({
          type: 'row',
          content: [{ type: 'br' }],
        })
      }
    }
  }
  // console.log(result)
  return result
}

function renderDeltaSchema(schema: IDeltaSchema[], cb: () => void) {
  const nodes = []

  for (const item of schema) {
    if (item.type === 'row') {
      const row = base.createLineElement(true)
      if (item.content.length == 1 && item.content[0].type === 'br') {
        const dom_br = document.createElement('br')
        row.appendChild(dom_br)
      } else {
        for (const content of item.content) {
          if (content.type === 'text') {
            const text = document.createTextNode(content.text)
            row.appendChild(text)
          } else if (content.type === 'image') {
            const img = document.createElement('img')
            for (const [key, value] of Object.entries(content.attrs)) {
              img.setAttribute(key, value)
            }
            row.appendChild(img)
          }
        }
      }
      nodes.push(row)
    }
  }
  dom.toTargetAddNodes(this.fishEditor.root, nodes)
  this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor)
  requestAnimationFrame(cb)
}

function serializeAttributes(el: HTMLElement): Record<string, any> {
  const attrs: Record<string, any> = {}
  for (const attr of Array.from(el.attributes)) {
    attrs[attr.name] = attr.value
  }
  return attrs
}

export default History
