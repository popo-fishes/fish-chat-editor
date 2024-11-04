/*
 * @Date: 2024-11-04 09:26:21
 * @Description: Modify here please
 */
import FishEditor from "./core/fish-editor";
import Input from "./modules/input";
import OtherEvent from "./modules/other-event";
import Clipboard from "./modules/clipboard";
import Uploader from "./modules/uploader";

FishEditor.register({
  "modules/input": Input,
  "modules/other-event": OtherEvent,
  "modules/clipboard": Clipboard,
  "modules/uploader": Uploader
});

export default FishEditor;
