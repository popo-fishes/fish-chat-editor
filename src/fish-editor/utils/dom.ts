/*
 * @Date: 2024-10-12 14:24:28
 * @Description: dom
 */
import { isNode, util } from '.'
const { isDOMText, isDOMElement, isDOMNode, isNodeNotTtxt } = isNode

const getDomPreviousOrnextSibling = (targetElement: Node): [][] => {
  if (!isDOMNode(targetElement)) return [[], []]

  const previousNodes: any = []
  let currentElement = targetElement.previousSibling
  while (currentElement) {
    if (currentElement.nodeType === Node.ELEMENT_NODE || currentElement.nodeType === Node.TEXT_NODE) {
      previousNodes.push(currentElement)
    }
    currentElement = currentElement.previousSibling
  }

  const nextNodes: any = []
  currentElement = targetElement.nextSibling
  while (currentElement) {
    if (currentElement.nodeType === Node.ELEMENT_NODE || currentElement.nodeType === Node.TEXT_NODE) {
      nextNodes.push(currentElement)
    }
    currentElement = currentElement.nextSibling
  }
  return [previousNodes, nextNodes]
}

export const cloneNodes = (childNodes: HTMLElement[]) => {
  const nodes: any[] = []
  for (let i = 0; i < childNodes.length; i++) {
    const clonedNode = childNodes[i].cloneNode(true)
    nodes.push(clonedNode)
  }
  return nodes
}

export const removeNodes = (childNodes: HTMLElement[]) => {
  const nodes: HTMLElement[] = Array.from(childNodes)
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    node?.remove()
  }
}

/**
 *@name is passed into the target node, and multiple nodes are inserted after the target node
 *@desc, for example:< p><a></p>, Enter node a. Then insert after a: become<p><a><b></ p>
 */
export const toTargetAfterInsertNodes = (targetElement: HTMLElement, childNodes: HTMLElement[]) => {
  if (!targetElement || !childNodes || !childNodes?.length) return
  const fragment = new DocumentFragment()
  for (let i = 0; i < childNodes.length; i++) {
    if (childNodes[i]) {
      fragment.appendChild(childNodes[i])
    }
  }
  const parentNode = targetElement.parentNode

  const nextSibling = targetElement.nextSibling

  if (parentNode) {
    parentNode.insertBefore(fragment, nextSibling)
  }
}

/**
 *@name is passed to the target node, and multiple nodes are inserted before the target node
 *@desc for example:< p><a></p>, Enter node a. Then insert before a: become<p>< b><a></p>
 */
export const toTargetBeforeInsertNodes = (targetElement: HTMLElement, childNodes: HTMLElement[]) => {
  if (!targetElement || !childNodes || !childNodes?.length) return
  const fragment = new DocumentFragment()
  for (let i = 0; i < childNodes.length; i++) {
    if (childNodes[i]) {
      fragment.appendChild(childNodes[i])
    }
  }
  const parentNode = targetElement.parentNode

  if (parentNode) {
    parentNode.insertBefore(fragment, targetElement)
  }
}

export const toTargetAddNodes = (targetNode: HTMLElement, childNodes: HTMLElement[], clear: boolean = true) => {
  if (isDOMElement(targetNode)) {
    if (childNodes && childNodes.length && clear) {
      targetNode.innerHTML = ''
    }
    const fragment = new DocumentFragment()
    for (let i = 0; i < childNodes.length; i++) {
      fragment.appendChild(childNodes[i])
    }
    targetNode.appendChild(fragment)
  }
  return targetNode
}

export const getRangeAroundNode = (range: { startContainer: Node | null; startOffset: number }) => {
  let behindNodeList: any[] = []

  let nextNodeList: any[] = []

  if (!range || !range?.startContainer) return [behindNodeList, nextNodeList]

  const targetNode: any = range.startContainer

  const editTextNode = util.getNodeOfEditorElementNode(targetNode)

  if (!editTextNode) {
    return [behindNodeList, nextNodeList]
  }
  // console.log(range);

  try {
    if (isDOMElement(targetNode)) {
      const startNode = range.startContainer

      const anchorOffset = range.startOffset

      if (anchorOffset == 0) {
        nextNodeList = startNode?.childNodes ? [...(startNode as any).childNodes] : []
      } else {
        const currentNode = startNode?.childNodes?.[anchorOffset - 1] || null

        if (currentNode) {
          const [pNode, nNode] = getDomPreviousOrnextSibling(currentNode)
          behindNodeList = [currentNode, ...pNode]
          nextNodeList = [...nNode]
        }
      }
    }

    if (isDOMText(targetNode)) {
      const anchorOffset = range.startOffset

      const afterNode = (range.startContainer as any)?.splitText?.(anchorOffset) || null

      const [pNode, nNode] = getDomPreviousOrnextSibling(afterNode)

      behindNodeList = [...pNode]

      nextNodeList = afterNode ? [afterNode, ...nNode] : [...nNode]
    }

    const tempPrev = behindNodeList?.filter((node: any) => {
      if (isNodeNotTtxt(node)) {
        node?.remove()
      }
      return node.nodeName !== 'BR' && !isNodeNotTtxt(node)
    })
    const tempNext = nextNodeList?.filter((node: any) => {
      if (isNodeNotTtxt(node)) {
        node?.remove()
      }
      return node.nodeName !== 'BR' && !isNodeNotTtxt(node)
    })

    return [tempPrev, tempNext]
  } catch (err) {
    return [behindNodeList, nextNodeList]
  }
}
