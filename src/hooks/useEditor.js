import { useState, useMemo } from "react"
import {
  createEditor,
  Node,
  Transforms,
  Editor,
  Element as SlateElement,
  Path,
  Range,
  Point,
} from "slate"
import { withHistory } from "slate-history"
import { withReact } from "slate-react"
import { getLines, linesToString } from "../utils/lines"
import { withLists } from "../plugins/withLists"

export const useEditor = props => {
  const [internalClipboard, setInternalClipboard] = useState([])

  const editor = useMemo(
    () => withReact(withHistory(createEditor())),
    []
  )

  editor.getChildren = () => editor.children

  editor.getTextContent = options => {
    const fragment = editor.children
    const lines = fragment.flatMap(node => getLines(editor, node, options))
    const contentString = linesToString(lines)
    return contentString
  }

  editor.setTextContent = contentString => {
    if (typeof contentString === "string") {
      editor.clear()
      Transforms.insertText(editor, contentString, { at: [0, 0] })
    }
  }

  editor.setChildren = children => {
    if (!Node.isNodeList(children)) {
      console.error("children is not of type Node[]")
      return
    }
    Transforms.removeNodes(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      },
    })
    Transforms.insertNodes(editor, children)
  }

  editor.handleCopy = event => {
    event?.preventDefault()
    const { selection } = editor
    if (selection) {
      const fragment = editor.getFragment()
      const copiedLines = fragment.flatMap(node => getLines(editor, node))
      const copiedString = linesToString(copiedLines)
      event.clipboardData.setData("text/plain", copiedString)
      setInternalClipboard(copiedLines)
    }
  }

  editor.handlePaste = event => {
    event?.preventDefault()

    const { selection } = editor
    if (Range.isExpanded(selection)) editor.deleteFragment()

    const internalClipboardToString = linesToString(internalClipboard)
    const deviceClipboardData = event.clipboardData.getData("Text")
    if (internalClipboardToString !== deviceClipboardData) {
      Transforms.insertText(editor, deviceClipboardData.toString())
      return // TODO: add this return statement to main
    }

    let match = Editor.above(editor, {
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        Editor.isBlock(editor, n) &&
        n.type !== editor.stampedElementType,
    })
    if (!match) return
    const [closestNonStampedAncestor, closestNonStampedAncestorPath] = match

    match = Editor.above(editor, {
      match: n =>
        Editor.isBlock(editor, n) &&
        SlateElement.isElement(n) &&
        n.type === editor.stampedElementType,
    })
    let stampedBlock, stampedBlockPath
    if (match) [stampedBlock, stampedBlockPath] = match

    const [first, ...rest] = internalClipboard
    const nodesRest = rest.map(line => {
      return {
        type: closestNonStampedAncestor.type,
        children: !match ? line : [{ ...stampedBlock, children: line }],
      }
    })

    Transforms.insertNodes(editor, first)

    const isSelectionAtEndOfLine = Point.equals(
      editor.selection.anchor,
      Editor.end(
        editor,
        match ? stampedBlockPath : closestNonStampedAncestorPath
      )
    )
    if (!isSelectionAtEndOfLine && rest.length > 0) {
      Transforms.splitNodes(editor)
      if (match) {
        Transforms.moveNodes(editor, {
          at: Path.next(stampedBlockPath),
          to: Path.next(closestNonStampedAncestorPath),
        })
        Transforms.wrapNodes(
          editor,
          { type: closestNonStampedAncestor.type },
          { at: Path.next(closestNonStampedAncestorPath) }
        )
      }
    }

    let path = closestNonStampedAncestorPath
    for (let i = 0; i < nodesRest.length; i++) {
      const node = nodesRest[i]
      if (i === nodesRest.length - 1 && !isSelectionAtEndOfLine) {
        Transforms.insertNodes(editor, rest[i], {
          at: Editor.start(editor, Path.next(path)),
        })
      }
      Transforms.insertNodes(editor, node, { at: Path.next(path) })
      Transforms.setSelection(editor, {
        anchor: Editor.end(editor, Path.next(path)),
        focus: Editor.end(editor, Path.next(path)),
      })
      path = Path.next(path)
    }
  }

  editor.clear = () => {
    Transforms.removeNodes(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      },
    })
    Transforms.insertNodes(editor, {
      type: "paragraph",
      children: [{ text: "" }],
    })
  }

  return { editor }
}
