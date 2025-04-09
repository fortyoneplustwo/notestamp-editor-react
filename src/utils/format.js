import { Editor, Element } from "slate"

const MARKS = ["bold", "italic", "underline", "code"]
const BLOCKS = ["numbered-list", "bulleted-list"]

export const isMark = format => MARKS.includes(format)

export const isBlock = format => BLOCKS.includes(format)

export const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

export const isBlockActive = (editor, format, blockType = "type") => {
  const { selection } = editor
  if (!selection) return false
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) && Element.isElement(n) && n[blockType] === format,
    })
  )
  return !!match
}

export const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)
  editor.toggleMark(isActive, format)
}

export const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format)
  const isList = editor.LIST_TYPES.includes(format)
  if (isList) {
    editor.toggleList(isActive, format)
  }
}

export class Format {
  static bold = "bold"
  static italic = "italic"
  static underline = "underline"
  static code = "code"
  static orderedList = "numbered-list"
  static unorderedList = "bulleted-list"

  static toggle(editor, format) {
    if (isBlock(format)) {
      toggleBlock(editor, format)
    }
    if (isMark(format)) {
      toggleMark(editor, format)
    }
  }
}
