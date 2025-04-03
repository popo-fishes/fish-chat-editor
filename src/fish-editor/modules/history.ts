/*
 * @Date: 2024-11-05 09:00:23
 * @Description: Modify here please
 */
import throttle from 'lodash/throttle'
import { dom, transforms, helper } from '../utils'
import Module from '../core/module'
import Emitter from '../core/emitter'
import type FishEditor from '../core/fish-editor'

export interface HistoryOptions {
  maxStack: number
}

class History extends Module<HistoryOptions> {
  static DEFAULTS: HistoryOptions = {
    maxStack: 100,
  }
  constructor(fishEditor: FishEditor, options: Partial<HistoryOptions>) {
    super(fishEditor, options)

    fishEditor.root.addEventListener('beforeinput', (event) => {
      console.log(event.inputType)
      if (event.inputType === 'historyUndo') {
        event.preventDefault()
      } else if (event.inputType === 'historyRedo') {
        event.preventDefault()
      }
    })
  }
}

export default History
