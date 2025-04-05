import React, { useState, useEffect, useCallback, useRef } from "react"

import { Notestamp, useEditor } from "notestamp"

const App = () => {
  const [editorContent, setEditorContent] = useState(null)
  const [count, setCount] = useState(0)

  const setStampData = useCallback(() => {
    setCount(c => c + 1)
    if (count % 5 === 0) {
      return null
    }
    return { label: count.toString(), value: count }
  }, [count])

  const handleLogStampData = (label, val) =>
    console.log(`clicked: ${label}, ${val}`)

  const setStampDataRef = useRef(setStampData)
  const handleLogStampDataRef = useRef(handleLogStampData)

  useEffect(() => {
    setStampDataRef.current = setStampData
  }, [setStampData])

  useEffect(() => {
    handleLogStampDataRef.current = handleLogStampData
  }, [])

  const { editor } = useEditor()

  // Save the current content of the editor
  const handleCaptureEditorContent = useCallback(() => {
    setEditorContent(editor.getChildren())
  }, [editor])

  useEffect(() => {
    handleCaptureEditorContent()
  }, [handleCaptureEditorContent])

  // Set editor's content to the previously saved contents
  const handleRestoreEditorContent = () => {
    editorContent && editor.setChildren(editorContent)
  }

  return (
    <div style={{ margin: "5px", padding: "0", height: "300px" }}>
      <Notestamp
        baseEditor={editor}
        borderSize="1px"
        borderColor="lightgray"
        borderStyle="solid"
        toolbarBackgroundColor="whitesmoke"
        onStampInsert={setStampDataRef}
        onStampClick={handleLogStampDataRef}
      />
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <button onClick={handleCaptureEditorContent}>
          Capture editor content
        </button>
        <button onClick={handleRestoreEditorContent}>
          Restore last captured content
        </button>
        <button onClick={editor.clear}>Clear editor</button>
      </div>
    </div>
  )
}

export default App
