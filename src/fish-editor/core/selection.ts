/*
 * @Date: 2025-03-31 10:39:59
 * @Description: Modify here please
 */
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import isNumber from 'lodash/isNumber'
import Emitter from './emitter'
import { util, base, isNode, dom, transforms } from '../utils'

export interface IRange {
  /** Range starting node */
  startContainer: Node | null
  /** range.startOffset: It is a read-only property used to return a number representing the starting position of Range in startContainer*/
  startOffset: number
  /** Node at the end of Range */
  endContainer: Node | null
  /** The number of offset values in Range.EndContainer */
  endOffset: number
  /** If the start and end nodes are in the same position in the DOM, this property returns true; Otherwise, return false */
  collapsed: boolean
}

class Selection {
  /** @name Editor Node */
  root: HTMLElement
  emitter: Emitter

  composing: boolean
  mouseDown: boolean
  savedRange: IRange
  lastRange: IRange | null

  constructor(root: HTMLElement, emitter: Emitter) {
    this.emitter = emitter
    this.root = root
    this.savedRange = null
    this.lastRange = null
    this.composing = false
    this.mouseDown = false

    this.initRange()
    this.handleComposition()
    this.handleDragging()

    this.emitter.listenDOM('selectionchange', document, () => {
      if (!this.mouseDown && !this.composing) {
        setTimeout(this.update.bind(this), 1)
      }
    })
    this.update()
  }

  initRange() {
    if (!this.root.firstChild) return
    if (isNode.isEditElement(this.root.firstChild as any)) {
      const targetDom = this.root.firstChild
      if (targetDom.firstChild) {
        // savedRange is last non-null range
        this.savedRange = {
          startContainer: targetDom.firstChild,
          startOffset: 0,
          endContainer: targetDom.firstChild,
          endOffset: 0,
          collapsed: true,
        }
        this.lastRange = this.savedRange
      }
    }
  }
  handleComposition() {
    this.emitter.on(Emitter.events.COMPOSITION_START, () => {
      this.composing = true
    })
    this.emitter.on(Emitter.events.COMPOSITION_END, () => {
      this.composing = false
    })
  }

  handleDragging() {
    this.emitter.listenDOM('mousedown', document.body, () => {
      this.mouseDown = true
    })
    this.emitter.listenDOM('mouseup', document.body, () => {
      this.mouseDown = false
      this.update()
    })
  }

  private update() {
    const oldRange = cloneDeep(this.lastRange)
    const lastRange = this.getRange()
    this.lastRange = lastRange
    if (this.lastRange != null) {
      this.savedRange = this.lastRange
    }
    // console.log(lastRange, 2);
    if (!isEqual(oldRange, this.lastRange)) {
      //  console.log(3);
    }
  }

  private getSelection() {
    return document.getSelection() || null
  }

  public hasFocus(): boolean {
    return (
      document.activeElement === this.root ||
      (document.activeElement != null && contains(this.root, document.activeElement))
    )
  }

  public getLineRow(index: number): HTMLElement | null {
    const row = (this.root?.childNodes[index] as HTMLElement) || null
    if (isNode.isEditElement(row)) {
      return row
    }
    return null
  }
  /** @name Get the number of rows */
  public getLines() {
    if (!this.root || !this.root?.childNodes) return 0
    return this.root.childNodes.length
  }

  public getLine(node: Node): number | null {
    const elementRowNode = util.getNodeOfEditorElementNode(node)
    if (!elementRowNode) return null

    const parent = elementRowNode.parentNode
    if (!parent) {
      return null
    }

    const children = this.root?.childNodes || []

    for (let i = 0; i < children.length; i++) {
      if (children[i] === elementRowNode) {
        return i
      }
    }
    return null
  }

  public deleteRange(range: IRange, cb?: () => void): void {
    if (
      !range ||
      !contains(this.root, range.startContainer) ||
      (!range.collapsed && !contains(this.root, range.endContainer)) ||
      // The representative did not select any content
      range.collapsed
    ) {
      cb?.()
      return
    }

    // The position of the starting node in the editing line
    const startLine = this.getLine(range.startContainer)
    const endLine = this.getLine(range.endContainer)
    if (startLine == null || endLine == null) {
      cb?.()
      return
    }

    try {
      /**
       * Option 1: Use the range. deleteContents() method - discard
       * Option 2: Manual operation
       */
      if (startLine === endLine) {
        // start
        const [startBehindNodeList, startNextNodeList] = dom.getRangeAroundNode({
          startContainer: range.startContainer,
          startOffset: range.startOffset,
        })
        // console.log(startBehindNodeList, startNextNodeList);
        // Retrieve the position again, otherwise calling getRangeAroundNode by the starting node will change the cursor node,
        //  causing the endContainer position to be incorrect
        const resetRange = this.getRange()
        // end
        const [endBehindNodeList, endNextNodeList] = dom.getRangeAroundNode({
          startContainer: resetRange.endContainer,
          startOffset: resetRange.endOffset,
        })
        // console.log(endBehindNodeList, endNextNodeList);
        // intersection 交集
        const collective = startNextNodeList.filter((item) => endBehindNodeList.includes(item))
        // console.log(collective)
        // console.log(startBehindNodeList, endNextNodeList);

        // If all the content of the current line has been deleted, add a br tag to the line
        if (startBehindNodeList.length == 0 && endNextNodeList.length == 0) {
          const rowNode = this.root.childNodes[startLine]

          dom.removeNodes(collective)

          // If the content of the starting line is empty, delete the br tag of the starting line
          const currContent = transforms.getEditElementContent(rowNode as any)

          if (currContent == '' || currContent == '\n') {
            util.deleteTargetNodeOfBrNode(rowNode as any)
          }

          const dom_br = document.createElement('br')
          rowNode.appendChild(dom_br)

          this.setCursorPosition(rowNode.firstChild, 'before')
        } else {
          dom.removeNodes(collective)
          // Update cursor
          if (startBehindNodeList.length) {
            this.setCursorPosition(startBehindNodeList[0], 'after')
          } else {
            this.setCursorPosition(endNextNodeList[0], 'before')
          }
        }
        cb?.()
      }

      if (startLine !== endLine) {
        // Middle row
        const middleRowNum = getRangeBetween(startLine, endLine)
        // start
        const [startBehindNodeList, startNextNodeList] = dom.getRangeAroundNode({
          startContainer: range.startContainer,
          startOffset: range.startOffset,
        })
        // console.log(startBehindNodeList, startNextNodeList)
        // end
        const [endBehindNodeList, endNextNodeList] = dom.getRangeAroundNode({
          startContainer: range.endContainer,
          startOffset: range.endOffset,
        })
        // console.log(endBehindNodeList, endNextNodeList)

        // Delete the content after the cursor position of the beginning line and the content before the cursor position of the end line
        if (startNextNodeList.length || endBehindNodeList.length) {
          dom.removeNodes(startNextNodeList || [])
          dom.removeNodes(endBehindNodeList || [])
        }

        // If there is no content before the cursor position of the end line, the end line is also deleted
        if (endNextNodeList.length == 0) {
          middleRowNum.push(endLine)
        }

        // If the middle line also exists, it needs to be removed.
        if (middleRowNum.length) {
          const RowNodes = []
          middleRowNum.forEach((index) => {
            if (this.root.childNodes[index]) {
              RowNodes.push(this.root.childNodes[index])
            }
          })
          dom.removeNodes(RowNodes)
        }

        // If there is no content on either the start or end lines, add a br label to the start line
        if (startBehindNodeList.length == 0 && endNextNodeList.length == 0) {
          const rowNode = this.root.childNodes[startLine]
          const currContent = transforms.getEditElementContent(rowNode as any)
          if (currContent == '' || currContent == '\n') {
            util.deleteTargetNodeOfBrNode(rowNode as any)
          }
          // add br
          const dom_br = document.createElement('br')
          rowNode.appendChild(dom_br)
          // Update cursor
          this.setCursorPosition(rowNode.firstChild, 'before')
        } else {
          // Merge row contents operation
          const rowNode = this.root.childNodes[startLine]
          // If there is content before the cursor position of the end line, add the content to the end of the start line
          if (endNextNodeList.length) {
            const currContent = transforms.getEditElementContent(rowNode as any)
            if (currContent == '' || currContent == '\n') {
              util.deleteTargetNodeOfBrNode(rowNode as any)
            }

            dom.toTargetAddNodes(rowNode as any, dom.cloneNodes(endNextNodeList), false)
            /**
             * Delete the end line
             *
             * 结束行的获取是，因为中间行上面删除了，所以结束行位置变了，这里就用结束行的索引，减去中间删除的几行，就得到当前的结束行位置。
             */
            this.getLineRow(endLine - middleRowNum.length)?.remove()
          }
          /**
           * Update cursor
           * startBehindNodeList Exists? Later nodes are used to update the location
           */
          if (startBehindNodeList.length) {
            this.setCursorPosition(startBehindNodeList[0], 'after')
          } else if (rowNode.firstChild) {
            this.setCursorPosition(rowNode.firstChild, 'before')
          }
        }
        cb?.()
      }
      // console.log(startLine, endLine)
    } catch (error) {
      cb?.()
      console.error(error)
    }
  }

  public setCursorPosition(
    referenceNode: Node,
    type?: 'before' | 'after',
    startOffset?: number,
    endOffset?: number,
  ): Range | null {
    if (!isNode.isDOMNode(referenceNode)) return null
    // No transmission, return directly
    if (!type && !isNumber(startOffset) && !isNumber(endOffset)) return null
    try {
      const selection = this.getSelection()
      const range = document.createRange()
      if (isNumber(startOffset) || isNumber(endOffset)) {
        isNumber(startOffset) && range.setStart(referenceNode, startOffset)
        isNumber(endOffset) && range.setEnd(referenceNode, endOffset)
      } else {
        if (type == 'after') {
          range.setStartAfter(referenceNode)
        }
        if (type == 'before') {
          range.setStartBefore(referenceNode)
        }
      }

      selection?.removeAllRanges()

      selection?.addRange(range)

      return range
    } catch (err) {
      console.warn(err)
      return null
    }
  }

  public getNativeRange(isNative = false): IRange | Range | null {
    const selection = this.getSelection()
    if (selection == null || selection.rangeCount <= 0) return null
    const nativeRange = selection.getRangeAt(0)
    if (nativeRange == null) return null
    // 直接返回原始的
    if (isNative) {
      if (
        !contains(this.root, nativeRange.startContainer) ||
        (!nativeRange.collapsed && !contains(this.root, nativeRange.endContainer))
      ) {
        return null
      }
      return nativeRange
    }
    // 使其标准化
    const range = this.normalizeNative(nativeRange)
    return range
  }

  public getRange(): IRange | null {
    try {
      const range = this.getNativeRange()

      if (!range) return null

      return {
        startContainer: range.startContainer || null,
        startOffset: range.startOffset || 0,
        endContainer: range.endContainer || null,
        endOffset: range.endOffset || 0,
        collapsed: range.collapsed,
      }
    } catch (err) {
      return null
    }
  }

  public normalizeNative(nativeRange: Range): IRange {
    if (
      !contains(this.root, nativeRange.startContainer) ||
      (!nativeRange.collapsed && !contains(this.root, nativeRange.endContainer))
    ) {
      return null
    }
    const range = {
      start: {
        node: nativeRange.startContainer,
        offset: nativeRange.startOffset,
      },
      end: { node: nativeRange.endContainer, offset: nativeRange.endOffset },
    }

    /**
     * 解决火狐浏览器光标节点异常问题
     */
    ;[range.start, range.end].forEach((position) => {
      let { node, offset } = position
      while (!(node instanceof Text) && node.childNodes.length > 0) {
        // console.log(node, offset, node.childNodes.length > offset);
        if (node.childNodes.length > offset) {
          node = node.childNodes[offset]
          offset = 0
        } else if (node.childNodes.length === offset) {
          // @ts-expect-error Fix me later
          node = node.lastChild
          if (node instanceof Text) {
            offset = node.data.length
          } else if (node.childNodes.length > 0) {
            // Container case
            offset = node.childNodes.length
          } else {
            // Embed case
            offset = node.childNodes.length + 1
          }
        } else {
          break
        }
      }
      position.node = node
      position.offset = offset
    })

    return {
      startContainer: range.start.node || null,
      startOffset: range.start.offset,
      endContainer: range.end.node || null,
      endOffset: range.end.offset,
      collapsed: nativeRange.collapsed,
    }
  }

  public isSelected() {
    const selection = this.getSelection()
    return !selection?.isCollapsed
  }

  public removeAllRanges() {
    const selection = this.getSelection()
    selection?.removeAllRanges?.()
  }

  public selectNode(node: Node) {
    const range = document.createRange()
    if (node) {
      range.selectNode(node)
    }

    const selection = this.getSelection()
    selection?.removeAllRanges()

    selection.addRange(range)
  }
}

function normalize(sNode: Node[], eNode: Node[]) {
  console.log(sNode, eNode)
}

function getRangeBetween(start: number, end: number): number[] {
  if (start >= end) {
    return []
  }

  const result: number[] = []
  for (let i = start + 1; i < end; i++) {
    result.push(i)
  }

  return result
}

function contains(parent: Node, descendant: Node) {
  try {
    // Firefox inserts inaccessible nodes around video elements
    descendant.parentNode // eslint-disable-line @typescript-eslint/no-unused-expressions
  } catch (e) {
    return false
  }
  return parent.contains(descendant)
}

export default Selection
