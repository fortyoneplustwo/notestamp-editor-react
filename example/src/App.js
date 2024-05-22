import React, { useRef, useState } from 'react'

import { Notestamp } from 'notestamp'
import 'notestamp/dist/index.css'


const App = () => {
  const editorRef = useRef(null)
  const [count, setCount] = useState(0)
  const [editorContent, setEditorContent] = useState(null)
  const initialEditorContent = [{
    type: 'paragraph',
    children: [{ text: '' }]
  }]
  const [stampData, setStampData] = useState(null)

  // Set the label (type: string) and value (type: any) of the new stamp
  const onStampInsert = dateStampRequested => {
    console.log(dateStampRequested)
    setCount(n => n + 1)

    return {
      label: count.toString(),
      value: count
    }
  }

  // Define action to take when a stamp is clicked
  const onStampClick = (label, value) => {
    // Update our record of the last stamp that was clicked
    setStampData(label)
    // Log the state of the clicked stamp and the content of the editor
    console.log(`label: ${label}, value: ${value}`)
    console.log(editorRef.current.getJsonContent())
    console.log(editorRef.current.getHtmlContent())
  }

  const changeContent = () => {
    if (editorContent !== null) editorRef.current.setContent(editorContent)
  }

  return (
    <div style={{ margin: '5px', padding: '5px', height: '300px' }}>
      <Notestamp
        onStampInsert={onStampInsert}
        onStampClick={onStampClick}
        ref={editorRef}
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button onClick={() => setEditorContent(editorRef.current.getJsonContent())}>Capture editor content</button>
        <button onClick={changeContent}>Restore last captured content</button>
        <button onClick={() => editorRef.current.setContent(initialEditorContent)}>Clear editor</button>
      </div>
      <pre style={{ marginTop: '10px' }}>{ `Last stamp clicked: ${stampData}` }</pre>

    </div>
  )
}

export default App
