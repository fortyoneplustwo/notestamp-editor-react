import React from 'react'
import { Editor, Transforms, Element, Range, Node, Path, Point } from "slate"
import { css } from "@emotion/css"

export const withStamps = (editor, onStampInsert, onStampClick) => {
  const { insertBreak, normalizeNode, deleteFragment, insertText } = editor

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
    // Get Stamp Data
    const stampData = onStampInsert()
    
    let { selection } = editor
    
    // If the selection is expanded, delete it
    if (Range.isExpanded(selection)) {
      Transforms.delete(editor)
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
      match: (n) => Editor.isBlock(editor, n),
    })
    if (!currBlock) {
      insertBreak()
      return
    }
    const blockStart = Editor.start(editor, currBlockPath)
    const blockEnd = Editor.end(editor, currBlockPath)

    // If current block is empty and unstamped, insert a stamped node inside
    if (currBlock.type !== 'stamped-item' && 
      currBlock.children.length === 1 && 
      currBlock.children[0].text === '') {
      Transforms.insertNodes(
        editor, 
        { 
          type: closestNonStampedAncestor.type,
          children: [{
            type: 'stamped-item',
            label: stampData.label,
            value: stampData.value,
            children: [{ text: '' }],
          }]
        }, 
        {
          at: Path.next(closestNonStampedAncestorPath),
        },
      )
      Transforms.removeNodes(editor, { at: currBlockPath })
      return
    }

    // Insert new block and handle text splitting depending on 
    // whether the selection is at the start, end or middle
    // of the current block
    let childrenOnNewLine
    if (Range.equals(selection, Editor.range(editor, blockStart))) {
      if (!Range.equals(selection, Editor.range(editor, blockEnd))) {
        Transforms.delete(editor, { 
          at: {
            anchor: blockStart,
            focus: blockEnd
          }
        })
      }
      childrenOnNewLine = currBlock.children
    } else if (Range.equals(selection, Editor.range(editor, blockEnd))) {
      childrenOnNewLine = [{ text: '' }]
    } else {
      childrenOnNewLine = Node.fragment(currBlock, {
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
    Transforms.insertNodes(editor, {
      type: closestNonStampedAncestor.type, 
      children: [{ 
        type: 'stamped-item', 
        label: stampData.label,
        value: stampData.value,
        children: structuredClone(childrenOnNewLine),
      }] 
    }, { at: Path.next(closestNonStampedAncestorPath) })
    Transforms.setSelection(editor, {
      anchor: Editor.end(editor, Path.next(closestNonStampedAncestorPath)),
      focus: Editor.end(editor, Path.next(closestNonStampedAncestorPath)),
    })
  }

  // editor.normalizeNode = ([node, path]) => {
  //   // Rule: A stamped nodes must be wrapped in a block node 
  //   // that is not the editor.
  //   // Otherwise, wrap the stamped node in a paragraph block
  //   if (Element.isElement(node) && node.type === 'stamped-item') {
  //     const match = Editor.above(editor, {
  //       match: (n) => 
  //         !Editor.isEditor(n) &&
  //         Element.isElement(n) &&
  //         Editor.isBlock(editor, n) &&
  //         n.type !== 'stamped-item'
  //     })
  //     if (!match) {
  //       Transforms.wrapNodes(editor, { type: 'paragraph' }, { at: path })
  //       return
  //     }
  //   }
  //   normalizeNode([node, path])
  // }

  editor.insertText = () => {

  }

  editor.deleteFragment = () => {
    const { selection } = editor
    if (
      Point.equals(selection.anchor, Editor.start(editor, [])) ||
      Point.equals(selection.focus, Editor.start(editor, []))
    ) {
      const [blockAtEditorStart] = Editor.above(editor, {
        match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
        at: Editor.start(editor, [])
      })
      const newBlockType = blockAtEditorStart.type
      Transforms.delete(editor)
      if (newBlockType === 'stamped-item') return
      if (Point.equals(editor.selection.focus, Editor.start(editor, []))) {
        const [currBlock, currBlockPath] = Editor.above(editor, {
          match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
          at: Editor.start(editor, [])
        })
        if (Element.isElement(currBlock) && currBlock.type === 'stamped-item') {
          const match = Editor.above(editor, {
            match: (n) => 
              Element.isElement(n) &&
              Editor.isBlock(editor, n) &&
              n.type !== 'stamped-item' &&
              n.type === newBlockType
          })
          if (!match) {
            Transforms.wrapNodes(editor, { type: newBlockType }, { at: currBlockPath })
            return
          }
        }
      }
    } else {
      deleteFragment()
    }
  }

  return editor
}

