/*
 * @Date: 2024-05-14 11:15:12
 * @Description: Modify here please
 */
import { useRef, useState } from "react";
import ChatEditor, { Version } from "../../src";
import "./App.css";

function App() {
  const [v, setVal] = useState("");
  const editorRef = useRef();

  // 发送文本消息
  const onSend = async (v) => {
    // 清空输入框
    editorRef.current?.clear();
    // 延迟
    editorRef.current?.focus();
  };

  console.log(v);

  return (
    <>
      <p style={{ fontSize: "30px", textAlign: "center", fontWeight: "bold" }}>fish-chat-editor</p>
      <div style={{ marginTop: "180px" }}>
        <ChatEditor onEnterDown={onSend} onSend={onSend} ref={editorRef} onChange={(v) => setVal(v)} />
      </div>
      <p style={{ marginTop: "15px" }}>富文本内容:</p>
      <p style={{ marginTop: "15px" }}>{v}</p>
    </>
  );
}

export default App;
