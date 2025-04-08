/*
 * @Date: 2024-3-14 15:40:27
 * @LastEditors: Please set LastEditors
 */
import cloneDeep from 'lodash/cloneDeep'
import { helper, base, dom, isNode, util, transforms, split, formats } from '../utils'
import type { IRange } from './selection'
import type FishEditor from './fish-editor'
import Emitter from './emitter'

class Editor {
  /** @name Editor Node */
  container: HTMLElement
  constructor(protected fishEditor: FishEditor) {
    this.container = fishEditor.root
    this.init()
  }

  private init() {
    if (this.container) {
      const node = base.createLineElement()
      dom.toTargetAddNodes(this.container, [node])
    }
  }
  enable(enabled = true) {
    this.container.setAttribute('contenteditable', enabled ? 'true' : 'false')
  }

  isEnabled() {
    return this.container.getAttribute('contenteditable') === 'true'
  }

  /**
   * @name Detect whether there is pure text content
   * @desc Only line breaks or input spaces are considered empty content
   */
  public isPureTextAndInlineElement() {
    const editorNode = this.container
    if (!editorNode || !editorNode?.childNodes) return true
    /**
     * There is no plain text content and no image block nodes. Represents an empty content
     */
    const text = this.getText(true)
    const result = helper.contentReplaceEmpty(text)

    if (result == '' && !hasEditorExistInlineNode(editorNode)) return true

    return false
  }
  /**
   * @name Check if the editor is empty
   * @desc If there is a line break or input space, it is considered as having content
   * @desc Only one '<p><br></p>' represents emptiness.
   */
  public isEmpty() {
    const editorNode = this.container
    if (!editorNode || !editorNode?.childNodes) return true

    if (editorNode?.childNodes && editorNode?.childNodes.length > 1) {
      return false
    }

    if (this.getText() == '' && this.getProtoHTML() == base.emptyEditHtmlText) return true

    return false
  }

  /** @name Retrieve the plain text content of the editor */
  public getText(isPure = false) {
    const result = transforms.handleEditTransformsPlainText(this.container, isPure)

    // console.log(JSON.stringify(result))

    return result
  }
  /**
   * @name Retrieve semantic HTML of editor content
   */
  public getSemanticHTML() {
    const cloneEditeNode = this.container.cloneNode(true) as any

    const contentResult = transforms.handleEditTransformsSemanticHtml(cloneEditeNode)

    return contentResult
  }
  /**
   * @name Retrieve the original HTML of the editor content, mainly used for judging value scenarios or internal use of rich text
   */
  public getProtoHTML() {
    const cloneEditeNode = this.container.cloneNode(true) as any

    const contentResult = transforms.handleEditTransformsProtoHtml(cloneEditeNode)

    return contentResult
  }
  /**
   * @name Insert text in the selection area
   * @param contentText
   * @param range
   * @param callBack （success?）=> void
   * @param showCursor Do I need to set a cursor after successful insertion
   */
  public insertText(
    contentText: string,
    range: IRange,
    callBack?: (success: boolean) => void,
    showCursor?: boolean,
  ): void {
    const cloneRange = cloneDeep(range) as IRange

    if (!contentText || !cloneRange) {
      callBack?.(false)
      return
    }

    const splitNodes = (startContainer: HTMLElement, node: HTMLElement) => {
      dom.toTargetAfterInsertNodes(startContainer, [node])
    }

    // Retrieve the row editing node of the cursor
    const rowElementNode: HTMLElement = util.getNodeOfEditorElementNode(cloneRange.startContainer)

    if (!rowElementNode) {
      console.warn('No editing line node, cannot be inserted')
      callBack?.(false)
      return
    }

    if (util.getNodeOfEditorTextNode(cloneRange.startContainer)) {
      const result = split.splitEditTextNode(cloneRange)
      cloneRange.startContainer = result.parentNode
      cloneRange.startOffset = result.startOffset
    }

    const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(cloneRange)

    // console.log(behindNodeList, nextNodeList);

    /** Processing Content Insertion */
    try {
      const semanticContent = transforms.labelRep(contentText)

      const lines = semanticContent?.split(/\r\n|\r|\n/) || []

      let split = false

      let initialNode = rowElementNode

      let firstNode: any = null
      // The last node that needs to be inserted (if there is only one node to be inserted, then this value is the same as the first node)
      let lastNode: any = null

      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i]
        const childNodes = transforms.transformTextToNodes(lineContent)
        const node = base.createLineElement()
        // Only add child nodes, If not, the line content will only have the br tag
        if (childNodes.length) {
          dom.toTargetAddNodes(node, childNodes as any[])
        }

        if (i === lines.length - 1) {
          lastNode = node
        }

        if (split) {
          splitNodes(initialNode, node)
          initialNode = node
        } else {
          split = true
          firstNode = node
        }
      }

      const keyId = 'editorFocusHack' + new Date().getTime() + helper.generateRandomString()
      const iElement = document.createElement('i')
      iElement.id = keyId

      if (firstNode === lastNode) {
        firstNode.appendChild(iElement)
      } else {
        lastNode.appendChild(iElement)
      }

      /** Process the content of the original cursor line node */
      {
        const content = transforms.getEditElementContent(rowElementNode)
        // Empty Text??
        if (content == '\n' || content == '') {
          if (isNode.isDOMElement(firstNode)) {
            dom.toTargetAddNodes(rowElementNode, dom.cloneNodes(firstNode.childNodes))
          }
        } else {
          const firstContent = transforms.getEditElementContent(firstNode)
          if (firstContent !== '\n' && firstContent !== '') {
            const prevLast = behindNodeList[0]
            if (prevLast) {
              dom.toTargetAfterInsertNodes(prevLast, dom.cloneNodes(firstNode.childNodes))
            } else {
              /**
               * If there is no node before the cursor position, select the first node after the cursor and insert the node
               */
              if (nextNodeList[0]) {
                const nodes: any = Array.from(dom.cloneNodes(firstNode.childNodes))
                const fragment = new DocumentFragment()
                for (let i = 0; i < nodes.length; i++) {
                  fragment.appendChild(nodes[i])
                }
                rowElementNode.insertBefore(fragment, nextNodeList[0])
              }
            }
          }

          /**
              *2.1 If the first inserted node and the last inserted node are the same, it means that a node has been inserted.
                If it is a node, the nodes after the original node cannot be deleted because there is no line break.
              *2.2 If it is not a node, we will delete the following nodes
             */
          if (firstNode !== lastNode && nextNodeList.length) {
            const lastContent = transforms.getEditElementContent(lastNode)
            dom.toTargetAddNodes(lastNode, dom.cloneNodes(nextNodeList), false)
            /**
             *If the added node itself has no content, you need to clear the node first and delete the BR tag
             *If there is no content, lastNode will have a br labeled child node. If not processed, it will result in a 2-line BUG visual effect
             */
            if (lastContent == '' || lastContent == '\n') {
              util.deleteTargetNodeOfBrNode(lastNode)
            }
            dom.removeNodes(nextNodeList)
          }
        }
      }

      {
        const focusNode = document.getElementById(keyId) as any

        if (showCursor) {
          const referenceNode = focusNode.parentNode
          if (referenceNode) {
            referenceNode?.scrollIntoView({ block: 'end', inline: 'end' })
            this.fishEditor.selection.setCursorPosition(focusNode, 'after')
          }
        }
        focusNode?.remove()

        callBack?.(true)
        return
      }
    } catch (error) {
      console.error(error)
      callBack?.(false)
    }
  }
  /**
   * @name Insert a node at the target location (currently an image)
   * @param nodes
   * @param range
   * @param callBack（success?）=> void
   * @returns
   */
  public insertNode(nodes: HTMLElement[], range: IRange, callBack?: (success: boolean) => void): void {
    if (!nodes || nodes?.length == 0) return callBack?.(false)
    const cloneRange = cloneDeep(range) as IRange
    // No cursor exists
    if (!cloneRange) {
      callBack?.(false)
      return
    }

    const rowElementNode: any = util.getNodeOfEditorElementNode(cloneRange.startContainer)

    if (!rowElementNode) {
      console.warn('No editing line node, cannot be inserted')
      callBack?.(false)
      return
    }

    if (util.getNodeOfEditorTextNode(cloneRange.startContainer)) {
      const result = split.splitEditTextNode(cloneRange)
      cloneRange.startContainer = result.parentNode
      cloneRange.startOffset = result.startOffset
    }

    // console.log(cloneRange);

    const [behindNodeList, nextNodeList] = dom.getRangeAroundNode(cloneRange)
    // console.log(behindNodeList, nextNodeList);

    /** Processing Content Insertion */
    try {
      {
        if (behindNodeList.length == 0 && nextNodeList.length == 0) {
          dom.toTargetAddNodes(rowElementNode, nodes)
        } else if (behindNodeList.length) {
          dom.toTargetAfterInsertNodes(behindNodeList[0], nodes)
        } else if (nextNodeList.length) {
          dom.toTargetBeforeInsertNodes(nextNodeList[0], nodes)
        }
      }

      {
        const referenceNode = nodes[nodes.length - 1] as any
        if (isNode.isDOMElement(referenceNode)) {
          referenceNode?.scrollIntoView({ block: 'end', inline: 'end' })
          this.fishEditor.selection.setCursorPosition(referenceNode, 'after')
          callBack?.(true)
          return
        }
      }
    } catch (error) {
      console.error(error)
      callBack?.(false)
    }
  }

  public getLength() {
    return this.getText(true)?.length || 0
  }

  public setText(content: string) {
    if (!content || !this.container) return
    this.setCursorEditorLast((node) => {
      if (node) {
        const rangeInfo = this.fishEditor.selection.getRange()
        this.insertText(
          content,
          rangeInfo,
          (success) => {
            if (success) {
              this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor)
              this.blur()
            }
          },
          true,
        )
      }
    })
  }

  public setHtml(html: string, notChange?: boolean) {
    if (!html) return null

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    const pElements = tempDiv.querySelectorAll('p')

    const nodes = Array.from(pElements)

    if (nodes.length == 0) return null

    const newNode = []
    // nodes
    for (let i = 0; i < nodes.length; i++) {
      const pldNode = nodes[i]
      if (pldNode.childNodes.length > 0) {
        const lineDom = base.createLineElement(true)
        for (let c = 0; c < pldNode.childNodes.length; c++) {
          const cldNode = pldNode.childNodes[c] as any
          const formatNode = formats.createNodeOptimize(cldNode)
          if (formatNode) {
            lineDom.appendChild(formatNode)
          }
        }
        newNode.push(lineDom)
      } else {
        newNode.push(base.createLineElement())
      }
    }

    dom.toTargetAddNodes(this.container, newNode)

    this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor, notChange)
  }

  public clear() {
    if (!this.container) return null
    const node = base.createLineElement()
    dom.toTargetAddNodes(this.container, [node])
    this.setCursorEditorLast((targetNode) => {
      if (targetNode) {
        this.fishEditor.emit(Emitter.events.EDITOR_CHANGE, this.fishEditor)
        this.blur()
      }
    })
  }

  public blur() {
    this.fishEditor.selection.removeAllRanges()
    this.container?.blur?.()
  }

  public focus() {
    requestAnimationFrame(() => this.setCursorEditorLast())
  }
  /**
   * @name Set the cursor to the last child node below the last line node in the editor
   */
  public setCursorEditorLast = (callBack?: (node?: HTMLElement) => void) => {
    if (!this.container || !this.container.childNodes) {
      callBack?.()
      return
    }

    const lastRowElement = this.container.childNodes[this.container.childNodes.length - 1]

    if (!lastRowElement) {
      console.warn('Rich text does not have nodes, please investigate the issue')
      callBack?.()
      return
    }

    if (isNode.isEditElement(lastRowElement as HTMLElement)) {
      const referenceElement = lastRowElement.childNodes[lastRowElement.childNodes.length - 1]
      if (referenceElement) {
        /**
         * When there is only one 'br' in the rich text during initialization,
          the cursor point cannot be set at the end position of the 'br' Otherwise, it will not take effect when entering Chinese
         *Especially when clearing the input content: and then getting the focus again, there will be bugs when entering again
         *For example: sending text messages

         const onSend = async (_) => {
           editorRef.current?.clear();

           editorRef.current?.focus();
          };
       */
        if (referenceElement.nodeName == 'BR') {
          this.fishEditor.selection.setCursorPosition(referenceElement, 'before')
        } else {
          this.fishEditor.selection.setCursorPosition(referenceElement, 'after')
        }
        callBack?.(referenceElement as HTMLElement)
        return
      }
    }

    console.warn('Rich text does not have nodes, please investigate the issue')
    callBack?.()

    return
  }
}

function hasEditorExistInlineNode(node: HTMLElement): boolean {
  if (isNode.isImageNode(node) || isNode.isEmojiImgNode(node)) {
    return true
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    if (hasEditorExistInlineNode(node.childNodes[i] as HTMLElement)) {
      return true
    }
  }
  return false
}

export type IEditorInstance = InstanceType<typeof Editor>

export { Editor as default }
