import "material-icons/iconfont/material-icons.css"
import React, { useMemo, useCallback } from "react"
import { isHotkey } from "is-hotkey"
import { Editable, useSlate } from "slate-react"
import * as SlateReact from "slate-react"
import { Editor, Transforms, Element as SlateElement } from "slate"
import { Toolbar, Button, Icon } from "./Toolbar"
import { useEditor } from "./hooks/useEditor"
import { withStamps } from "./plugins/withStamps"
import { withLists } from "./plugins/withLists"
import { withMarks } from "./plugins/withMarks"

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
}) => {
  const editor = useMemo(
    () =>
      withMarks(withLists(withStamps(baseEditor, onStampInsert, onStampClick))),
    [onStampInsert, onStampClick]
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
  const blockButtonHotkeys = {
    "mod+shift+8": editor.NUMBERED_LIST_TYPE,
    "mod+shift+9": editor.BULLETED_LIST_TYPE,
  }
  const markButtonHotkeys = {
    "mod+b": editor.MARKS.bold,
    "mod+i": editor.MARKS.italic,
    "mod+u": editor.MARKS.underline,
    "mod+`": editor.MARKS.code,
  }

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

  const dispatchKeyEvent = event => {
    switch (event.key) {
      case "Tab":
        event.preventDefault()
        editor.insertText("\t")
        break
      default:
        for (let hotkey in markButtonHotkeys) {
          if (isHotkey(hotkey, event)) {
            event.preventDefault()
            editor.toggleMark(markButtonHotkeys[hotkey])
            return
          }
        }

        for (let hotkey in blockButtonHotkeys) {
          if (isHotkey(hotkey, event)) {
            event.preventDefault()
            toggleBlock(editor, blockButtonHotkeys[hotkey])
            return
          }
        }
    }
  }

  return (
    <div
      style={{
        backgroundColor: `${toolbarBackgroundColor}`,
        border: `${borderSize} ${borderStyle} ${borderColor}`,
        height: "100%",
      }}
    >
      <SlateReact.Slate
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
          <Toolbar>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "30px",
                padding: "10px",
                height: "100%",
              }}
            >
              <MarkButton
                format={editor.MARKS.bold}
                icon="format_bold"
                description="Bold (Ctrl+B)"
              />
              <MarkButton
                format={editor.MARKS.italic}
                icon="format_italic"
                description="Italic (Ctrl+I)"
              />
              <MarkButton
                format={editor.MARKS.underline}
                icon="format_underlined"
                description="Underline (Ctrl+U)"
              />
              <MarkButton
                format={editor.MARKS.code}
                icon="code"
                description="Code (Ctrl+`)"
              />
              <BlockButton
                format={editor.NUMBERED_LIST_TYPE}
                icon="format_list_numbered"
                description="Toggle numbered list (Ctrl+Shift+8)"
              />
              <BlockButton
                format={editor.BULLETED_LIST_TYPE}
                icon="format_list_bulleted"
                description="Toggle bulleted list (Ctrl+Shift+9)"
              />
            </div>
          </Toolbar>
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
            onKeyDown={dispatchKeyEvent}
          />
        </div>
      </SlateReact.Slate>
    </div>
  )
}

/* Functions */
const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format)
  const isList = editor.LIST_TYPES.includes(format)

  if (isList) {
    editor.toggleList(isActive, format)
  }
}

const isBlockActive = (editor, format, blockType = "type") => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  )

  return !!match
}

/* Components */
const BlockButton = ({ format, icon, description }) => {
  const editor = useSlate()
  return (
    <Button
      title={description}
      active={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

const MarkButton = ({ format, icon, description }) => {
  const editor = useSlate()
  return (
    <Button
      active={editor.isMarkActive(format)}
      title={description}
      onMouseDown={event => {
        event.preventDefault()
        editor.toggleMark(format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

export { Notestamp, useEditor }
