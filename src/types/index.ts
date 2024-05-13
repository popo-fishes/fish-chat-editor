/*
 * @Date: 2024-3-14 15:40:27
 * @Description: file content
 */
export type ItemType = {
  url: string;
  name: string;
  title: string;
};

export interface IEditInputRef {
  /**
   * @添加表情方法
   */
  insertEmoji: (item: ItemType) => void;
  /**
   * @获取输入框值
   */
  getValue: () => string;
  /**
   * @清空输入框值
   */
  clear: () => void;
  /**
   * @获取焦点
   */
  focus: () => void;
  /**
   * @失去焦点
   */
  blur: () => void;
  /**
   * @设置输入框值
   */
  setValue: (val: string) => void;
}
