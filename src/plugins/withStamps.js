import React from "react"
import {
  Editor,
  Transforms,
  Element,
  Range,
  Node,
  Path,
  Point,
  Text,
} from "slate"
import { css } from "@emotion/css"

export const withStamps = (editor, onStampInsert, onStampClick) => {
  const stampedBlockType = "stamped-item"
  const { deleteBackward, normalizeNode } = editor

  const StampedBlock = ({ attributes, children, element }) => {
    return (
      <span
        {...attributes}
        className={css`
          display: flex;
          flex-direction: row;
          overflow-y: none;
          & + & {
            margin-top: 0;
          }
        `}
      >
        <span
          onClick={() => onStampClick(element.label, element.value)}
          contentEditable={false}
          className={css`
            display: inline-block;
            height: 100%;
            margin-right: 0.75em;
            color: red;
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
              &focus: {
                outline: none;
              }
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
            width: 100%;
            overflow-wrap: break-word;
            word-break: break-word;
            &:focus {
              outline: none;
            }
          `}
        >
          {children}
        </span>
      </span>
    )
  }

  editor.insertBreak = () => {
    const stampData = onStampInsert()
    let { selection } = editor

    if (Range.isExpanded(selection)) {
      editor.deleteFragment()
      // NOTE: not sure this is necessary
      const selectionStart = Editor.start(editor, selection)
      Transforms.setSelection(editor, {
        anchor: selectionStart,
        focus: selectionStart,
      })
    }
    selection = editor.selection

    let match = getWrappingUnstampedAncestor(editor)
    if (!match) {
      throw Error(
        "Invalid node: Could not find non-editor, non-stamped ancestor at selection"
      )
    }

    const [unstampedAncestor, unstampedAncestorPath] = match

    match = getWrappingBlock(editor)
    if (!match)
      throw Error("Invalid node: Could not find non-editor block at selection")

    const [block, blockPath] = match
    const blockStart = Editor.start(editor, blockPath)
    const blockEnd = Editor.end(editor, blockPath)

    if (Point.equals(selection.focus, blockEnd)) {
      Transforms.insertNodes(
        editor,
        {
          type: unstampedAncestor.type,
          children: [{ text: "" }],
        },
        { at: Path.next(unstampedAncestorPath) }
      )
      Transforms.setSelection(
        editor,
        Editor.range(editor, Path.next(unstampedAncestorPath))
      )
      return
    }

    let contentAfterSelection
    if (Point.equals(selection.focus, blockStart)) {
      Transforms.delete(editor, {
        at: { anchor: blockStart, focus: blockEnd },
      })
      contentAfterSelection = block.children
    } else {
      contentAfterSelection = Node.fragment(block, {
        anchor: {
          path: [selection.focus.path[selection.focus.path.length - 1]],
          offset: selection.focus.offset,
        },
        focus: {
          path: [blockEnd.path[blockEnd.path.length - 1]],
          offset: blockEnd.offset,
        },
      })
      Transforms.delete(editor, {
        at: {
          anchor: selection.anchor,
          focus: blockEnd,
        },
      })
    }

    const children =
      stampData && stampData?.value !== null
        ? [
            {
              type: stampedBlockType,
              label: stampData.label,
              value: stampData.value,
              children: structuredClone(contentAfterSelection),
            },
          ]
        : structuredClone(contentAfterSelection)

    Transforms.insertNodes(
      editor,
      {
        type: unstampedAncestor.type,
        children: children,
      },
      { at: Path.next(unstampedAncestorPath) }
    )
    Transforms.setSelection(editor, {
      anchor: Editor.start(editor, Path.next(unstampedAncestorPath)),
      focus: Editor.start(editor, Path.next(unstampedAncestorPath)),
    })
    return
  }

  editor.insertText = text => {
    const match = getWrappingBlock(editor)
    if (!match)
      throw Error(
        "Invalid node: Text nodes must be wrapped inside a non-editor block element"
      )

    const [block, blockPath] = match

    if (block.type === stampedBlockType) {
      Transforms.insertText(editor, text)
      return
    }
    if (!isBlockEmpty(block)) {
      Transforms.insertText(editor, text)
      return
    }

    const stampData = onStampInsert()
    if (!stampData || stampData?.value === null) {
      Transforms.insertText(editor, text)
      return
    }

    Transforms.insertNodes(
      editor,
      {
        type: block.type,
        children: [
          {
            type: stampedBlockType,
            label: stampData.label,
            value: stampData.value,
            children: [{ text: "" }],
          },
        ],
      },
      { at: Path.next(blockPath) }
    )
    Transforms.removeNodes(editor, { at: blockPath })
    Transforms.insertText(editor, text)
    return
  }

  editor.deleteFragment = () => {
    const { selection } = editor
    const selectionStart = Editor.start(editor, selection)

    let match = getWrappingBlock(editor, { at: selectionStart })
    if (!match) {
      throw Error(
        "Invalid node: Selection before delete is not wrapped in a non-editor block"
      )
    }

    const [blockAtSelectionStart, blockPathAtSelectionStart] = match
    if (blockAtSelectionStart.type === stampedBlockType) {
      Transforms.delete(editor)
      return
    }
    if (
      !Point.equals(
        selectionStart,
        Editor.start(editor, blockPathAtSelectionStart)
      )
    ) {
      Transforms.delete(editor)
      return
    }

    Transforms.delete(editor)

    match = getWrappingBlock(editor)
    if (!match)
      throw Error("Selection after deletion is not inside a non-editor block")

    const [blockAfterDelete, blockPathAfterDelete] = match
    if (blockAfterDelete.type !== stampedBlockType) return
    Transforms.setNodes(
      editor,
      {
        type: blockAtSelectionStart.type,
      },
      { at: blockPathAfterDelete }
    )
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor
    let match = getWrappingBlock(editor)
    if (match) {
      const [block, blockPath] = match
      const blockStart = Editor.start(editor, blockPath)
      if (block.type === stampedBlockType) {
        if (Point.equals(selection.anchor, blockStart)) {
          Transforms.unwrapNodes(editor)
          return
        }
      }

      const pointBefore = Editor.before(editor, selection.anchor)
      if (pointBefore && Point.equals(selection.anchor, blockStart)) {
        match = Editor.above(editor, {
          match: n =>
            !Editor.isEditor(n) &&
            Element.isElement(n) &&
            n.type === stampedBlockType,
          at: pointBefore,
        })

        if (match) {
          const [, blockPathAtPointBefore] = match
          if (
            Point.equals(
              pointBefore,
              Editor.start(editor, blockPathAtPointBefore)
            )
          ) {
            Transforms.removeNodes(editor)
            Transforms.setSelection(editor, {
              anchor: pointBefore,
              focus: pointBefore,
            })

            if (!isBlockEmpty(block)) {
              Transforms.insertNodes(editor, block.children, {
                at: pointBefore,
              })
            }
            return
          }
        }
      }
    }
    deleteBackward(...args)
  }

  editor.normalizeNode = entry => {
    const [node, path] = entry
    if (Text.isText(node)) {
      const newlineIndex = node.text.search(/(?<!\\)\n/)
      if (newlineIndex >= 0) {
        let match = getWrappingUnstampedAncestor(editor, { at: path })
        if (match) {
          const [unstampedAncestor, unstampedAncestorPath] = match
          Transforms.splitNodes(editor, {
            at: { path: path, offset: newlineIndex + 1 },
          })
          Transforms.delete(editor, {
            at: { path: path, offset: newlineIndex },
            distance: 1,
            unit: "character",
          })

          if (!Node.has(editor, Path.next(Path.parent(path)))) return

          match = Editor.above(editor, {
            match: n =>
              !Editor.isEditor(n) &&
              Element.isElement(n) &&
              n.type === stampedBlockType,
            at: path,
          })
          if (match) {
            const [, pathOfLeftBlock] = match
            Transforms.moveNodes(editor, {
              at: Path.next(pathOfLeftBlock),
              to: Path.next(unstampedAncestorPath),
            })
            Transforms.wrapNodes(
              editor,
              { type: unstampedAncestor.type },
              { at: Path.next(unstampedAncestorPath) }
            )
          }
        }
      }
      return
    }
    normalizeNode(entry)
  }

  editor.StampedElementComponent = StampedBlock
  editor.stampedElementType = stampedBlockType

  return editor
}

// Helpers
const getWrappingBlock = (editor, options) => {
  return Editor.above(editor, {
    match: n =>
      !Editor.isEditor(n) && Element.isElement(n) && Editor.isBlock(editor, n),
    at: options?.at ?? editor.selection,
  })
}

const getWrappingUnstampedAncestor = (editor, options) => {
  return Editor.above(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      n.type !== stampedBlockType,
    at: options?.at ?? editor.selection,
  })
}

const isBlockEmpty = block =>
  block.children.length === 1 && block.children[0].text === ""
