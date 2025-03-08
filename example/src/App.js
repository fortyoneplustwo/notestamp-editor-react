import React, { useState, useEffect } from 'react'

import { Notestamp, useEditor } from 'notestamp'

const App = () => {
  const [count, setCount] = useState(0)
  const [editorContent, setEditorContent] = useState(null)
  const [stampData, setStampData] = useState(null)

  const { editor } = useEditor()

  useEffect(() => {
    handleCaptureEditorContent()
  }, [])

  // Set the label (type: string) and value (type: any) of the new stamp
  const onStampInsert = () => {
    setCount(n => n + 1)

    return {
      label: count.toString(),
      value: count
    }
  }

  // Define action to take when a stamp is clicked
  const onStampClick = (label, _) => setStampData(label)

  // Save the current content of the editor
  const handleCaptureEditorContent = () => {
    setEditorContent(editor.getChildren())
  }

  // Set editor's content to the previously saved contents
  const handleRestoreEditorContent = () => {
    editorContent && editor.setChildren(editorContent)
  }

  return (
    <div style={{ margin: '5px', padding: '0', height: '300px' }}>
      <Notestamp
        editor={editor}
        onStampInsert={onStampInsert}
        onStampClick={onStampClick}
        borderSize='1px'
        borderColor='lightgray'
        borderStyle='solid'
        toolbarBackgroundColor='whitesmoke'
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button onClick={handleCaptureEditorContent}>
          Capture editor content
        </button>
        <button onClick={handleRestoreEditorContent}>
          Restore last captured content
        </button>
        <button 
          onClick={editor.clear}>
          Clear editor
        </button>
      </div>
      <pre style={{ marginTop: '10px' }}>
        { `Last stamp clicked: ${stampData}` }
      </pre>
    </div>
  )
}

export default App
