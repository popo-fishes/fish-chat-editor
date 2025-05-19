/*
 * @Date: 2025-01-18 09:27:42
 * @Description: Modify here please
 */
import { base, dom, transforms, isNode } from '.'
import isArray from 'lodash/isArray'

/** Format - Optimize Conversion */
export const createNodeOptimize = (node: HTMLElement): (Text | HTMLElement)[] => {
  let formatNode: HTMLElement | Text | null | (Text | HTMLElement)[] = null
  if (!isNode.isDOMNode(node)) return []

  const clnode = dom.cloneNodes([node])[0]
  const nodeName = (clnode.nodeName || '').toLowerCase()
  // console.log(clnode.nodeType, nodeName)
  if (isNode.isDOMText(clnode)) {
    const strCont = dom.cloneNodes([clnode])[0]?.textContent || null
    if (strCont) {
      // 转换
      formatNode = transforms.transformTextToNodes(strCont) as any
    }
  } else if (nodeName == 'span') {
    if (clnode.style.color) {
      formatNode = base.createChunkTextElement('span')
      formatNode.innerText = clnode.innerText
      formatNode.style.color = clnode.style.color
    } else {
      formatNode = document.createTextNode(clnode.innerText || '')
    }
  } else if (nodeName == 'strong') {
    formatNode = base.createChunkTextElement('strong')
    formatNode.innerText = clnode.innerText
  } else if (nodeName == 'img') {
    formatNode = base.createChunkImgElement(clnode.getAttribute('src') || '')
  } else if (nodeName == 'em') {
    formatNode = base.createChunkTextElement('em')
    formatNode.innerText = clnode.innerText
  } else if (nodeName == 'u') {
    formatNode = base.createChunkTextElement('u')
    formatNode.innerText = clnode.innerText
  } else if (nodeName == 'del') {
    formatNode = base.createChunkTextElement('del')
    formatNode.innerText = clnode.innerText
  } else if (nodeName == 'a') {
    formatNode = base.createChunkTextElement('a')
    formatNode.innerText = clnode.innerText
  }

  return isArray(formatNode) ? formatNode : formatNode ? [formatNode] : []
}
