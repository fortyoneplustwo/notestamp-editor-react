import React from 'react'
import { Editor, Transforms, Element, Range, Node, Path, Point } from "slate"
import { css } from "@emotion/css"

export const withStamps = (editor, onStampInsert, onStampClick) => {
  const { insertBreak, insertText, deleteFragment, deleteBackward } = editor

  const StampedBlock = ({ attributes, children, element }) => {
    return (
      <div
        {...attributes}
        className={css`
          display: flex;
          flex-direction: row;
          align-items: center;
          overflow-wrap: break-word;
          & + & {
            margin-top: 0;
          }
        `}
      >
        <span
          onClick={() => onStampClick(element.label, element.value)}
          contentEditable={false}
          className={css`
            margin-right: 0.75em;
            color: red;
            user-select: none;
            pointer-events: pointer;
          `}
        >
          <button
            className={css`
              background-color: transparent;
              font-size: 10px;
              border: none;
              color: red;
              user-select: none;
              padding: 0;
            `}
          >
            {element.label}
          </button>
        </span>
        <span
          contentEditable={true}
          suppressContentEditableWarning
          className={css`
            flex: 1;
            &:focus {
              outline: none;
            }
          `}
        >
          {children}
        </span>
      </div>
    )
  }
  editor.StampedBlock = StampedBlock
  editor.stampedBlockType = 'stamped-item'

  editor.insertBreak = () => {
    const stampData = onStampInsert()
    let { selection } = editor
    
    // If the selection is expanded, delete it
    if (Range.isExpanded(selection)) {
      deleteFragment()
      const newPoint = Point.isBefore(selection.anchor, selection.focus)
        ? selection.anchor
        : selection.focus
      Transforms.setSelection(editor, {
        anchor: newPoint,
        focus: newPoint,
      })
    }
    selection = editor.selection // Make sure we get the updated selection

    // Get closest ancestor that is not a stamped node
    let match = Editor.above(editor, {
      match: (n) => 
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        Editor.isBlock(editor, n) &&
        n.type !== 'stamped-item',
        mode: 'lowest',
    })
    if (!match) {
      insertBreak()
      return
    }
    const [closestNonStampedAncestor, closestNonStampedAncestorPath] = match

    // Get enclosing block at selection
    const [currBlock, currBlockPath] = Editor.above(editor, {
      match: (n) => !Editor.isEditor(n) && Editor.isBlock(editor, n),
    })
    if (!currBlock) {
      insertBreak()
      return
    }
    const blockStart = Editor.start(editor, currBlockPath)
    const blockEnd = Editor.end(editor, currBlockPath)

    // If caret is at end of current block, insert an unstamped line below
    if (Range.equals(selection, Editor.range(editor, blockEnd))) {
      Transforms.insertNodes(editor, {
        type: closestNonStampedAncestor.type,
        children: [{ text: '' }],
      }, { at: Path.next(closestNonStampedAncestorPath) })
      Transforms.setSelection(
        editor, 
        Editor.range(editor, Path.next(closestNonStampedAncestorPath))
      )
      return
    }

    // Otherwise we need to split the content at selection,
    // delete the content after selection from the current line,
    // and temporarily store it to paste into the next line
    let contentAfterSelection
    if (Range.equals(selection, Editor.range(editor, blockStart))) {
      Transforms.delete(editor, { at: { anchor: blockStart, focus: blockEnd } })
      contentAfterSelection = currBlock.children
    } else {
      contentAfterSelection = Node.fragment(currBlock, {
        anchor: {
          path: [selection.focus.path[selection.focus.path.length - 1]],
          offset: selection.focus.offset,
        },
        focus: {
          path: [blockEnd.path[blockEnd.path.length - 1]],
          offset: blockEnd.offset,
        }
      })
      Transforms.delete(editor, { at: {
        anchor: selection.anchor,
        focus: blockEnd
      }})
    }

    // If stamp data is available, then the next line should be stamped
    const children = (stampData && stampData?.value !== null) 
      ? [{
          type: 'stamped-item', 
          label: stampData.label,
          value: stampData.value,
          children: structuredClone(contentAfterSelection),
        }]
      : structuredClone(contentAfterSelection)

    // Insert new line
    Transforms.insertNodes(editor, {
      type: closestNonStampedAncestor.type, 
      children: children
    }, { at: Path.next(closestNonStampedAncestorPath) })
    Transforms.setSelection(editor, {
      anchor: Editor.start(editor, Path.next(closestNonStampedAncestorPath)),
      focus: Editor.start(editor, Path.next(closestNonStampedAncestorPath)),
    })
    return
  }

  editor.insertText = (text) => {
    const [currBlock, currBlockPath] = Editor.above(editor, {
      match: (n) => 
        !Editor.isEditor(n) &&
        Element.isElement(n) && 
        Editor.isBlock(editor, n)
    })
    if (!currBlock) {
      insertText(text)
      return
    }
    if (currBlock?.type === 'stamped-item') {
      Transforms.insertText(editor, text)
      return
    }
    if (!(currBlock.children.length === 1 && currBlock.children[0]?.text === '')) {
      insertText(text)
      return
    }

    const stampData = onStampInsert()
    if (!stampData || stampData?.value === null) {
      Transforms.insertText(editor, text)
      return
    }

    Transforms.insertNodes(editor, { 
      type: currBlock.type,
      children: [{
        type: 'stamped-item',
        label: stampData.label,
        value: stampData.value,
        children: [{ text: '' }],
      }]}, { at: Path.next(currBlockPath) })
    Transforms.removeNodes(editor, { at: currBlockPath })
    Transforms.insertText(editor, text)
    return
  }

  editor.deleteFragment = () => {
    const { selection } = editor
    const { anchor, focus } = selection
    const selectionStart = Point.compare(anchor, focus) < 0 ? anchor : focus
    const [
      blockAtSelectionStartBeforeDelete, 
      blockPathAtSelectionStartBeforeDelete
    ] = Editor.above(editor, {
      match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
      at: selectionStart
    })

    if (blockAtSelectionStartBeforeDelete.type === 'stamped-item') {
      Transforms.delete(editor)
      return
    }
    if (!Point.equals(selectionStart, 
        Editor.start(editor, blockPathAtSelectionStartBeforeDelete))) {
      Transforms.delete(editor)
      return
    }

    Transforms.delete(editor)

    // Block at selection after deletion should not be a stamped node,
    // but of the same type as blockPathAtSelectionStartBeforeDelete
    const [currBlockAfterDel, currBlockPathAfterDel] = Editor.above(editor, {
      match: (n) => 
        !Editor.isEditor(n) &&
        Element.isElement(n) && 
        Editor.isBlock(editor, n),
      at: editor.selection
    })
    if (currBlockAfterDel?.type !== 'stamped-item') return
    Transforms.setNodes(editor, {
      type: blockAtSelectionStartBeforeDelete.type 
    }, { at: currBlockPathAfterDel })
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor
    const match = Editor.above(editor, {
      match: (n) => 
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        n.type === 'stamped-item'
    })
    if (match) {
      const [, path] = match
      const start = Editor.start(editor, path)
      if (Point.equals(selection.anchor, start)) {
        Transforms.unwrapNodes(editor)
        return
      }
    }
    deleteBackward(...args)
  }

  // editor.insertStamp(text)
  // stamps the current node
  //

  return editor
}

