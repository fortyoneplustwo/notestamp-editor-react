import React, { useState, useEffect, useCallback, useRef } from "react"

import { Notestamp, Format, useEditor } from "notestamp"
import { Toolbar } from "./components/Toolbar/Toolbar"
import isHotkey from "is-hotkey"

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

  const handleLogStampData = useCallback(
    (label, val) => console.log(`clicked: ${label}, ${val}`),
    []
  )

  const setStampDataRef = useRef(setStampData)
  const handleLogStampDataRef = useRef(handleLogStampData)

  useEffect(() => {
    setStampDataRef.current = setStampData
  }, [setStampData])

  useEffect(() => {
    handleLogStampDataRef.current = handleLogStampData
  }, [handleLogStampData])

  const { editor } = useEditor()

  const formatHotkeys = {
    "mod+shift+8": Format.orderedList,
    "mod+shift+9": Format.unorderedList,
    "mod+b": Format.bold,
    "mod+i": Format.italic,
    "mod+u": Format.underline,
    "mod+`": Format.code,
  }

  const handleKeyDown = event => {
    switch (event.key) {
      case "Tab":
        event.preventDefault()
        editor.insertText("\t")
        break
      default:
        for (const [hotkey, format] of Object.entries(formatHotkeys)) {
          if (isHotkey(hotkey, event)) {
            event.preventDefault()
            Format.toggle(editor, format)
            return
          }
        }
    }
  }

  // Save the current content of the editor
  const handleCaptureEditorContent = useCallback(() => {
    setEditorContent(editor.getChildren())
  }, [editor, setEditorContent])

  useEffect(() => {
    handleCaptureEditorContent()
  }, [handleCaptureEditorContent, setEditorContent])

  // Set editor's content to the previously saved contents
  const handleRestoreEditorContent = () => {
    editorContent && editor.setChildren(editorContent)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        margin: "5px",
        gap: "5px",
      }}
    >
      <Toolbar editor={editor} style={{ border: "1px solid lightgrey" }} />
      <Notestamp
        editor={editor}
        onStampInsert={setStampDataRef}
        onStampClick={handleLogStampDataRef}
        onKeyDown={handleKeyDown}
        style={{
          height: "300px",
          border: "1px solid lightgrey",
        }}
      />
      <div style={{ display: "flex", gap: "10px" }}>
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
