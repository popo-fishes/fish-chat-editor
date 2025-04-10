/*
 * @Date: 2024-10-12 14:42:00
 * @Description: Modify here please
 */
export const generateRandomString = (length = 5) => {
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export const contentReplaceEmpty = (content: string) => {
  const cStr = content.replace(/\s/g, '')

  const lStr = cStr.replace(/\n/g, '')

  if (lStr == '') {
    content = ''
  }

  return content
}

/** @name 去掉字符串尾部的\n换行符 */
export const removeTailLineFeed = (content: string) => {
  if (!content) return ''

  if (content.endsWith('\n')) {
    content = content.slice(0, -1)
  }
  return content
}

export const truncateString = (str: string, x: number) => {
  let result = ''
  let count = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\n') {
      result += str[i]
      continue
    }
    result += str[i]
    count++
    if (count === x) {
      break
    }
  }
  return result
}
