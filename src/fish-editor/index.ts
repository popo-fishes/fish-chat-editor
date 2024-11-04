/*
 * @Date: 2024-11-04 09:26:21
 * @Description: Modify here please
 */
import FishEditor from "./core/fish-editor";
import Input from "./modules/input";
import OtherEvent from "./modules/other-event";

FishEditor.register({
  "modules/input": Input,
  "modules/other-event": OtherEvent
});

export default FishEditor;
