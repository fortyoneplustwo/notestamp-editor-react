import React from 'react'
import { Editor, Transforms, Element, Range, Node, Path, Point } from "slate"
import { css } from "@emotion/css"

export const withStamps = (editor, onStampInsert, onStampClick) => {
  const stampedBlockType = 'stamped-item'
  const { deleteBackward } = editor

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

  editor.insertBreak = () => {
    const stampData = onStampInsert()
    let { selection } = editor
    
    if (Range.isExpanded(selection)) {
      editor.deleteFragment()
      const selectionStart = Point.isBefore(selection.anchor, selection.focus)
        ? selection.anchor
        : selection.focus
      Transforms.setSelection(editor, {
        anchor: selectionStart,
        focus: selectionStart,
      })
    }
    selection = editor.selection

    let match = Editor.above(editor, {
      match: (n) => 
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        Editor.isBlock(editor, n) &&
        n.type !== stampedBlockType,
    })
    if (!match) {
      throw Error('Invalid node: Could not find non-editor, non-stamped ancestor at selection')
    }

    const [closestNonStampedAncestor, closestNonStampedAncestorPath] = match

    match = getWrappingBlock(editor)
    if (!match) throw Error('Invalid node: Could not find non-editor block at selection')

    const [currBlock, currBlockPath] = match
    const blockStart = Editor.start(editor, currBlockPath)
    const blockEnd = Editor.end(editor, currBlockPath)

    if (Point.equals(selection.focus, blockEnd)) {
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

    let contentAfterSelection
    if (Point.equals(selection.focus, blockStart)) {
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
      Transforms.delete(editor, { 
        at: {
          anchor: selection.anchor,
          focus: blockEnd,
      }})
    }

    const children = (stampData && stampData?.value !== null) 
      ? [{
          type: stampedBlockType, 
          label: stampData.label,
          value: stampData.value,
          children: structuredClone(contentAfterSelection),
        }]
      : structuredClone(contentAfterSelection)

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
    const match = getWrappingBlock(editor)
    if (!match) throw Error('Invalid node: Text nodes must be wrapped inside a non-editor block element')

    const [currBlock, currBlockPath] = match

    if (currBlock.type === stampedBlockType) {
      Transforms.insertText(editor, text)
      return
    }
    if (!(currBlock.children.length === 1 && currBlock.children[0]?.text === '')) {
      Transforms.insertText(editor, text)
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
        type: stampedBlockType,
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
    const selectionStart = Point.isBefore(anchor, focus) ? anchor : focus

    let match = getWrappingBlock(editor, { at: selectionStart })
    if (!match) {
      throw Error('Invalid node: Selection before delete is not wrapped in a non-editor block')
    }

    const [blockAtSelectionStart, blockPathAtSelectionStart] = match
    if (blockAtSelectionStart.type === stampedBlockType) {
      Transforms.delete(editor)
      return
    }
    if (!Point.equals(selectionStart, 
        Editor.start(editor, blockPathAtSelectionStart))) {
      Transforms.delete(editor)
      return
    }

    Transforms.delete(editor)

    match = getWrappingBlock(editor)
    if (!match) throw Error('Selection after deletion is not inside a non-editor block')

    const [currBlockAfterDel, currBlockPathAfterDel] = match
    if (currBlockAfterDel.type !== stampedBlockType) return
    Transforms.setNodes(editor, {
      type: blockAtSelectionStart.type 
    }, { at: currBlockPathAfterDel })
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor
    let match = getWrappingBlock(editor)
    if (match) {
      const [currBlock, currBlockPath] = match
      const currBlockStart = Editor.start(editor, currBlockPath)
      if (currBlock.type === stampedBlockType) {
        if (Point.equals(selection.anchor, currBlockStart)) {
          Transforms.unwrapNodes(editor)
          return
        }
      }

      const pointBefore = Editor.before(editor, selection.anchor)
      if (pointBefore && Point.equals(selection.anchor, currBlockStart)) {
        match = Editor.above(editor, { 
          match: (n) => 
            !Editor.isEditor(n) &&
            Element.isElement(n) &&
            n.type === stampedBlockType,
          at: pointBefore,
        })

        if (match) {
          const [, blockPathAtPointBefore] = match
          if (Point.equals(pointBefore, Editor.start(editor, blockPathAtPointBefore))) {
            const children = currBlock.children
            Transforms.removeNodes(editor)
            Transforms.setSelection(editor, {
              anchor: pointBefore, 
              focus: pointBefore,
            })

            if (!(children.length === 1 && children[0].text === '')) {
              Transforms.insertNodes(editor, children, { at: pointBefore })
            }
            return
          }
        }
      }
    }
    deleteBackward(...args)
  }

  editor.StampedElementComponent = StampedBlock
  editor.stampedElementType = stampedBlockType

  return editor
}

// Helpers
const getWrappingBlock = (editor, options) => {
  return Editor.above(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      Editor.isBlock(editor, n),
    at: options?.at ?? editor.selection
  })
}
