/*
 * @Date: 2024-05-14 11:15:12
 * @Description: Modify here please
 */
import { useRef, useState } from "react";
import ChatEditor, { IChatEditorRef } from "../../src";
import "./App.css";

function App() {
  const [html, setHtml] = useState("");
  const editorRef = useRef<IChatEditorRef>(null);

  // 发送文本消息
  const onSend = async (_) => {
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
      <div style={{ marginTop: "180px" }}>
        <ChatEditor
          onEnterDown={onSend}
          onSend={onSend}
          ref={editorRef}
          onChange={(editor) => {
            const html = editor.getHtml();
            setHtml(html);
          }}
        />
      </div>
      {/*  显示内容 */}
      <p style={{ marginTop: "15px" }}>富文本内容:</p>

      <div style={{ marginTop: "20px" }}>
        <textarea className="editor-textarea-view" readOnly value={html} />
      </div>
      <div className="editor-content-view" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

export default App;
