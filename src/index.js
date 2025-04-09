import "material-icons/iconfont/material-icons.css"
import React, { useMemo, useCallback, useState } from "react"
import { Slate, Editable, withReact } from "slate-react"
import { Editor, Element as SlateElement, Point, Transforms } from "slate"
import { useEditor } from "./hooks/useEditor"
import { useFormatActiveState } from "./hooks/useFormat"
import { withStamps } from "./plugins/withStamps"
import { withLists } from "./plugins/withLists"
import { withMarks } from "./plugins/withMarks"
import { withHistory } from "slate-history"
import { Format } from "./utils/format"

const Notestamp = ({
  editor: baseEditor,
  placeholder,
  borderSize,
  borderStyle,
  borderColor,
  toolbarBackgroundColor,
  onChange,
  onStampInsert,
  onStampClick,
  onKeyDown,
}) => {
  const [editor] = useState(() =>
    withMarks(
      withLists(
        withStamps(
          withReact(withHistory(baseEditor)),
          onStampInsert,
          onStampClick
        )
      )
    )
  )

  const initialValue = useMemo(
    () => [
      {
        type: "paragraph",
        children: [{ text: "" }],
      },
    ],
    []
  )

  /**
   * Override editor methods
   */
  const { deleteBackward } = editor

  editor.deleteBackward = (...args) => {
    const { selection } = editor
    let match = Editor.above(editor, {
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        Editor.isBlock(editor, n),
    })
    if (!match) throw Error("Could not find non-editor wrapping block")

    const [block, blockPath] = match
    const isSelectionAtBlockStart = Point.equals(
      selection.anchor,
      Editor.start(editor, blockPath)
    )
    const pointBefore = Editor.before(editor, selection.anchor)
    const isBlockEmpty = block =>
      block.children.length === 1 && block.children[0].text === ""

    match =
      pointBefore &&
      Editor.above(editor, {
        at: pointBefore,
        match: n => !Editor.isEditor(n) && Editor.isBlock(editor, n),
        mode: "lowest",
      })

    if (match) {
      const [blockAtPointBefore, blockPathAtPointBefore] = match
      if (
        isSelectionAtBlockStart &&
        block.type === editor.stampedElementType &&
        blockAtPointBefore.type === "paragraph" &&
        isBlockEmpty(blockAtPointBefore)
      ) {
        Transforms.removeNodes(editor, { at: blockPathAtPointBefore })
        return
      }
    }
    deleteBackward(...args)
  }

  /**
   * Rendering
   */
  const Element = props => {
    const { children, element, attributes } = props
    switch (element.type) {
      case editor.stampedElementType:
        const { StampedElementComponent } = editor
        return <StampedElementComponent {...props} />
      case editor.BULLETED_LIST_TYPE:
        return <ul {...attributes}>{children}</ul>
      case editor.LIST_ITEM_TYPE:
        return <li {...attributes}>{children}</li>
      case editor.NUMBERED_LIST_TYPE:
        return <ol {...attributes}>{children}</ol>
      default:
        return (
          <p {...attributes} style={{ margin: "0", padding: "0" }}>
            {children}
          </p>
        )
    }
  }

  const Leaf = props => {
    let { attributes, children, leaf } = props
    const {
      BoldMarkComponent,
      ItalicMarkComponent,
      UnderlineMarkComponent,
      CodeMarkComponent,
      MARKS,
    } = editor

    if (leaf[MARKS.bold])
      children = <BoldMarkComponent>{children}</BoldMarkComponent>
    if (leaf[MARKS.code])
      children = <CodeMarkComponent>{children}</CodeMarkComponent>
    if (leaf[MARKS.italic])
      children = <ItalicMarkComponent>{children}</ItalicMarkComponent>
    if (leaf[MARKS.underline])
      children = <UnderlineMarkComponent>{children}</UnderlineMarkComponent>

    return (
      <span
        // The following is a workaround for a Chromium bug where,
        // if you have an inline at the end of a block,
        // clicking the end of a block puts the cursor inside the inline
        // instead of inside the final {text: ''} node
        // https://github.com/ianstormtaylor/slate/issues/4704#issuecomment-1006696364
        style={{ paddingLeft: leaf.text === "" ? "0.1px" : "null" }}
        {...attributes}
      >
        {children}
      </span>
    )
  }

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  return (
    <div
      style={{
        backgroundColor: `${toolbarBackgroundColor}`,
        border: `${borderSize} ${borderStyle} ${borderColor}`,
        height: "100%",
      }}
    >
      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={value => {
          const isAstChange = editor.operations.some(
            op => "set_selection" !== op.type
          )
          isAstChange && onChange && onChange(value)
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Editable
            style={{
              outline: `${borderSize} ${borderStyle} ${borderColor}`,
              tabSize: "2",
              background: "white",
              color: "black",
              height: "100%",
              padding: "5px",
              overflow: "auto",
              overflowX: "hidden",
            }}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder ?? ""}
            spellCheck
            onCopy={editor.handleCopy}
            onPaste={editor.handlePaste}
            onKeyDown={onKeyDown}
          />
        </div>
      </Slate>
    </div>
  )
}

export { Notestamp, Format, useEditor, useFormatActiveState }
