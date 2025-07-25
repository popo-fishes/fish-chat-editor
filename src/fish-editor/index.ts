/*
 * @Date: 2024-11-04 09:26:21
 * @Description: Modify here please
 */
import FishEditor from './core/fish-editor'
import Input from './modules/input'
import OtherEvent from './modules/other-event'
import Clipboard from './modules/clipboard'
import Uploader from './modules/uploader'
import Keyboard from './modules/keyboard'
import History from './modules/history'

export { labelRep } from './utils/transforms'
export { default as Emitter } from './core/emitter'

export type { IEmitter } from './core/emitter'

FishEditor.register({
  'modules/input': Input,
  'modules/other-event': OtherEvent,
  'modules/clipboard': Clipboard,
  'modules/uploader': Uploader,
  'modules/keyboard': Keyboard,
  'modules/history': History,
})

export { default as Module } from './core/module'

export default FishEditor
