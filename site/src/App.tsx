/*
 * @Date: 2024-05-14 11:15:12
 * @Description: Modify here please
 */
import { useRef, useState } from "react";
// 正式使用时应该：
// import FbChatEditor, { type IChatEditorRef, type FishEditor } from "fish-chat-editor";
import FbChatEditor, { TextAreaEditor, type IChatEditorRef, type FishEditor } from "../../src";
import "./App.css";

function App() {
  const [html, setHtml] = useState("");
  const editorRef = useRef<IChatEditorRef>(null);
  const textAreaEditorRef = useRef<any>(null);

  // 发送文本消息
  const onSend = async (editor: FishEditor["editor"]) => {
    // 清空输入框
    editorRef.current?.clear();

    editorRef.current?.focus();
  };

  return (
    <>
      <p style={{ fontSize: "30px", textAlign: "center", fontWeight: "bold" }}>fish-chat-editor</p>
      <a href="https://github.com/popo-fishes/fish-chat-editor/blob/main/README.md" target="_blank">
        fish-chat-editor文档
      </a>
      <a style={{ marginLeft: "20px" }} href="https://github.com/popo-fishes/fish-chat-editor/blob/main/demo/src/App.tsx" target="_blank">
        demo源码
      </a>
      <div style={{ marginTop: "180px" }}>
        <FbChatEditor
          onEnterDown={onSend}
          emojiList={[]}
          onSend={onSend}
          ref={editorRef}
          onChange={(editor: FishEditor["editor"]) => {
            const html = editor.getProtoHTML();
            // const text = editor.getText();
            // console.log(html);
            setHtml(html);
          }}
        />
      </div>
      <p style={{ marginTop: "15px" }}>
        <button
          onClick={() => {
            if (editorRef.current && editorRef.current) {
              editorRef.current.setText("哈哈哈");
            }
          }}
        >
          设置值
        </button>
      </p>
      {/*  显示内容 */}
      <p style={{ marginTop: "15px" }}>富文本内容:</p>

      <div style={{ marginTop: "20px" }}>
        <textarea className="editor-textarea-view" readOnly value={html} />
      </div>
      {html && html !== "<p><br></p>" && <div className="editor-content-view" dangerouslySetInnerHTML={{ __html: html }} />}

      <h2>Text Area Editor</h2>
      <TextAreaEditor textAreaEditorRef={textAreaEditorRef} placeholder={"我是TextAreaEditor"} minHeight={200} maxHeight={540} maxLength={5000} />
    </>
  );
}

export default App;
