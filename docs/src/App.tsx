/*
 * @Date: 2024-05-14 11:15:12
 * @Description: Modify here please
 */
import { useState } from "react";
import { ChatEditor } from "../../src";
import "./App.css";

function App() {
  const [v, setVal] = useState("");

  return (
    <>
      <div style={{ marginTop: "300px" }}>
        <ChatEditor onChange={(v) => setVal(v)} />
      </div>
      <p style={{ marginTop: "15px" }}>富文本内容:</p>
      <p style={{ marginTop: "15px" }}>{v}</p>
    </>
  );
}

export default App;
