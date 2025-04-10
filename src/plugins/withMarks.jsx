import React from "react"
import { Editor } from "slate"

export const withMarks = editor => {
  const { insertBreak } = editor

  const bold = "bold"
  const italic = "italic"
  const underline = "underline"
  const code = "code"
  const MARKS = { bold, italic, underline, code }

  const Bold = ({ children }) => <strong>{children}</strong>
  const Italic = ({ children }) => <em>{children}</em>
  const Underline = ({ children }) => <u>{children}</u>
  const Code = ({ children }) => (
    <code style={{ color: "grey" }}>{children}</code>
  )

  editor.toggleMark = (isActive, format) => {
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  }

  editor.insertBreak = () => {
    const marks = Editor.marks(editor)
    insertBreak()
    for (const mark in marks) {
      if (marks[mark]) Editor.addMark(editor, mark, true)
    }
  }

  editor.MARKS = MARKS
  editor.BoldMarkComponent = Bold
  editor.ItalicMarkComponent = Italic
  editor.UnderlineMarkComponent = Underline
  editor.CodeMarkComponent = Code

  return editor
}
