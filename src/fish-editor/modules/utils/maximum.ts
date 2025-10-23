/*
 * @Date: 2025-10-22 10:39:09
 * @Description: Modify here please
 */
import { isNode } from '../../utils'
import type FishEditor from '../../core/fish-editor'
import type { IRange } from '../../core/selection'

export const EDITOR_TO_START_CONTAINER: WeakMap<
  FishEditor,
  {
    startOffset: number
    startContainer: globalThis.Node
    type: 'text' | 'element'
    text: string | null
  }
> = new WeakMap()

export const getSubstringFromEnd = (str: string, match: string) => {
  const lastIndex = str.lastIndexOf(match)
  if (lastIndex !== -1) {
    return str.slice(0, lastIndex)
  }
  return str
}
/**
 * @name 处理CompositionStart记录下当前选区信息，以便触发 maxLength 时使用
 * @param flag 是否删除过选区
 * @param range 当前选区
 * @param contextFishEditor 上下文编辑器对象
 */
const recordCompositionStartContainer = (flag: boolean, range: IRange, contextFishEditor: any) => {
  // 如果删除了选区，则目标dom取之后的节点
  if (flag && isNode.isDOMText(range.startContainer)) {
    const targetNode = range.startContainer
    const previousSibling = targetNode?.previousSibling as any
    if (previousSibling && isNode.isDOMText(previousSibling)) {
      EDITOR_TO_START_CONTAINER.set(contextFishEditor, {
        startOffset: previousSibling.data.length,
        startContainer: previousSibling,
        type: 'text',
        text: isNode.isDOMText(previousSibling) ? previousSibling.textContent || '' : null,
      })
    }
  } else {
    if (isNode.isDOMElement(range.startContainer)) {
      EDITOR_TO_START_CONTAINER.set(contextFishEditor, {
        startOffset: range.startOffset,
        startContainer: range.startContainer,
        type: 'element',
        text: null,
      })
    } else {
      EDITOR_TO_START_CONTAINER.set(contextFishEditor, {
        startOffset: range.startOffset,
        startContainer: range.startContainer,
        type: 'text',
        text: isNode.isDOMText(range.startContainer) ? range.startContainer.textContent || '' : null,
      })
    }
  }
}

/**
 * @name Handle the maxLength logic of CompositionEnd
 */
function handleMaxLengthFn(data: string, contextFishEditor: any) {
  const fishEditor = this.fishEditor as FishEditor
  try {
    const leftLengthOfMaxLength = fishEditor.getLeftLengthOfMaxLength() + data.length
    // console.log(leftLengthOfMaxLength)
    // 如果剩余长度小于插入的长度，则截取插入
    if (leftLengthOfMaxLength < data.length) {
      // 先给之前的选区内容还原
      const oldRange = EDITOR_TO_START_CONTAINER.get(contextFishEditor)
      // console.log(oldRange, data)
      // 1. 如果是元素节点
      if (oldRange && oldRange.type == 'element') {
        // 当前选区
        const curRange = fishEditor.selection.getRange()
        // 删除当前选区内容
        ;(curRange.startContainer as any)?.remove()
        // 重新定位光标
        fishEditor.selection.setCursorPosition(oldRange.startContainer, oldRange.startOffset == 1 ? 'after' : 'before')
        // 如果剩余长度大于0，则插入
        if (leftLengthOfMaxLength > 0) {
          const curText = data.slice(0, leftLengthOfMaxLength)
          fishEditor.insertTextInterceptor(curText, true, (success) => {
            if (success) {
              // _this.fishEditor.scrollSelectionIntoView()
            }
          })
        }
      } else {
        // 当前选区
        const curRange = fishEditor.selection.getRange()
        // 相同选区
        const isSameNode = curRange.startContainer.isSameNode(oldRange.startContainer)
        if (isSameNode) {
          // 重置为输入完毕之前的内容
          curRange.startContainer.textContent = oldRange.text
          // 重新定位光标
          fishEditor.selection.setCursorPosition(curRange.startContainer, null, oldRange.startOffset)
          // 如果剩余长度大于0，则插入
          if (leftLengthOfMaxLength > 0) {
            const curText = data.slice(0, leftLengthOfMaxLength)
            fishEditor.insertTextInterceptor(curText, true, (success) => {
              if (success) {
                fishEditor.scrollSelectionIntoView()
              }
            })
          }
        } else {
          // 不是同一个选区，把刚刚输入的内容过滤掉
          const curtext = getSubstringFromEnd(curRange.startContainer.textContent, data)
          // 重置为输入完毕之前的内容
          curRange.startContainer.textContent = curtext
          // 重新定位光标
          fishEditor.selection.setCursorPosition(curRange.startContainer, null, curtext.length)
          // 如果剩余长度大于0，则插入
          if (leftLengthOfMaxLength > 0) {
            const curText = data.slice(0, leftLengthOfMaxLength)
            fishEditor.insertTextInterceptor(curText, true, (success) => {
              if (success) {
                fishEditor.scrollSelectionIntoView()
              }
            })
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
  }
}

export { recordCompositionStartContainer, handleMaxLengthFn }
