/*
 * @Date: 2024-10-09 09:43:04
 * @Description: Modify here please
 */
import { base } from '.'

export const getDefaultView = (value: any): Window | null => {
  return (value && value.ownerDocument && value.ownerDocument.defaultView) || null
}

export const isDOMNode = (value: any) => {
  const window = getDefaultView(value)
  return !!window && value
}

export const isDOMElement = (value: any) => {
  return isDOMNode(value) && value.nodeType === 1
}

export const isDOMText = (value: any) => {
  return isDOMNode(value) && value.nodeType === 3
}

export const isEditElement = (node: HTMLElement): boolean => {
  if (!node) return false
  if (!isDOMElement(node)) return false
  const key = base.getElementAttributeKey('fishNode')
  const attrName = base.getElementAttributeDatasetName('fishNode')
  const hasAttr = node.hasAttribute(key)
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[attrName] || ''
    if (elementAttrVal == 'element') {
      return true
    }
    return false
  }
  return false
}

export const isEditTextNode = (node: HTMLElement): boolean => {
  if (!node) return false
  if (!isDOMElement(node)) return false
  const key = base.getElementAttributeKey('fishNode')
  const attrName = base.getElementAttributeDatasetName('fishNode')
  const hasAttr = node.hasAttribute(key)
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[attrName] || ''
    if (elementAttrVal == 'text') {
      return true
    }
    return false
  }
  return false
}

export const isImageNode = (node: HTMLElement): boolean => {
  if (!node || !isDOMElement(node)) return false
  const key = base.getElementAttributeKey('imageNode')
  const attrName = base.getElementAttributeDatasetName('imageNode')
  const hasAttr = node.hasAttribute(key)
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[attrName] || ''
    if (elementAttrVal == 'true') {
      return true
    }
    return false
  }
  return false
}

export const isEmojiImgNode = (node: HTMLElement): boolean => {
  if (!node || !isDOMElement(node)) return false
  const key = base.getElementAttributeKey('emojiNode')
  const attrName = base.getElementAttributeDatasetName('emojiNode')
  const hasAttr = node.hasAttribute(key)
  if (hasAttr) {
    const elementAttrVal = node?.dataset?.[attrName] || ''
    if (elementAttrVal) return true
    return false
  }
  return false
}

export const isNodeNotTtxt = (node: HTMLElement): boolean => {
  if (isDOMText(node)) {
    if (node?.nodeValue == '') {
      return true
    }
  }
  return false
}

/** @name Determine if a node is a zero width text node */
export const isNodeZeroSpace = (node: HTMLElement): boolean => {
  if (isDOMText(node)) {
    const tranText = node.nodeValue.replace(new RegExp(base.zeroWidthNoBreakSpace, 'g'), '')
    if (tranText == '') {
      return true
    }
  }
  return false
}
