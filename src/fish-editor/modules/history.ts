/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from 'lodash/throttle'
import { dom, transforms, helper, isNode } from '../utils'
import Module from '../core/module'
import Emitter from '../core/emitter'
import type FishEditor from '../core/fish-editor'

export interface HistoryOptions {
  maxStack: number
  delay: number
}

export interface StackItem {
  editorHtml: string
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
    // console.log(lastItem)
    if (lastItem?.editorHtml) {
      this.fishEditor.setHtml(lastItem.editorHtml)
      // console.log(lastItem)
      const referenceNode = getNodeByIndexPaths(this.fishEditor.root, lastItem.range.nodeIndexPaths)
      if (referenceNode && isNode.isDOMElement(referenceNode)) {
        this.fishEditor.selection.setCursorPosition(referenceNode, 'after')
      } else {
        this.fishEditor.selection.setCursorPosition(referenceNode, null, lastItem.range.endOffset)
      }
    } else {
      this.fishEditor.clear()
      this.fishEditor.focus()
    }

    this.ignoreChange = false
  }

  record() {
    this.stack.redo = []
    let undoVal = this.fishEditor.editor.getProtoHTML()
    const currentRange = this.fishEditor.selection.getRange()

    if (!currentRange) return

    let undoRange: StackItem['range'] = {
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

    this.stack.undo.push({ editorHtml: undoVal, range: undoRange })
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

function getNodeByIndexPaths(root: any, paths: number[]) {
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

export default History
