import { useState, useMemo } from 'react'
import { createEditor, Node, Transforms, Editor, Element as SlateElement } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import { withSplitBlocksAtNewLines } from '../plugins/withSplitBlocksAtNewLines'
import { withStamps } from '../plugins/withStamps'
import { getLines, linesToString } from '../utils/lines'

export const useEditor = (props) => {
  const [internalClipboard, setInternalClipboard] = useState([])
  

  const editor = useMemo(() => 
    withStamps(
      withSplitBlocksAtNewLines(
        withReact(
          withHistory(
            createEditor()))), props), [])

  editor.getChildren = () => editor.children

  editor.getTextContent = (options) => {
    const fragment = editor.children
    const lines = fragment.flatMap((node) => getLines(editor, node, options))
    const contentString = linesToString(lines)
    return contentString
  }

  editor.setTextContent = (contentString) => {
    if (typeof contentString === "string") {
      editor.clear()
      Transforms.insertText(editor, contentString, { at: [0, 0] })
    }
  }

  editor.setChildren = (children) => {
    if (!Node.isNodeList(children)) {
      console.error("children is not of type Node[]")
      return
    }
    Transforms.removeNodes(editor, { at: {
      anchor: Editor.start(editor, []),
      focus: Editor.end(editor, []),
    }})
    Transforms.insertNodes(editor, children)
  }

  editor.handleCopy = (event) => {
    event?.preventDefault()
    const { selection } = editor
    if (selection) {
      const fragment = editor.getFragment() 
      const copiedLines = fragment.flatMap((node) => getLines(editor, node))
      const copiedString = linesToString(copiedLines)
      event.clipboardData.setData('text/plain', copiedString)
      setInternalClipboard(copiedLines)
    }
  }

  editor.handlePaste = (event) => {
    event?.preventDefault()
    const internalClipboardToString = linesToString(internalClipboard)
    const deviceClipboardData = event.clipboardData.getData('Text')
    if (internalClipboardToString !== deviceClipboardData) {
      Transforms.insertText(editor, deviceClipboardData.toString())
    }

    const { selection } = editor
    const enclosingBlockEntry = Editor.above(editor, {
      at: selection.anchor,
      match: (n) => Editor.isBlock(editor, n) && SlateElement.isElement(n)
    })
    if (!enclosingBlockEntry) return
    const [enclosingBlock] = enclosingBlockEntry
    const [first, ...rest] = internalClipboard
    Transforms.insertNodes(editor, first)
    for (const line of rest) {
      Transforms.insertNodes(editor, {
        type: enclosingBlock.type,
        children: line
      })
    }
  }

  editor.clear = () => {
    Transforms.removeNodes(editor, {
      at : {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      }
    })
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    })
  }

  return { editor }
}
