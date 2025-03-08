import 'material-icons/iconfont/material-icons.css'
import React, { useMemo, useCallback } from 'react'
import { isHotkey } from 'is-hotkey'
import { Editable, useSlate } from 'slate-react'
import * as SlateReact from 'slate-react'
import {
  Editor,
  Transforms,
  Element as SlateElement,
  Point,
  Node
} from 'slate'
import { Toolbar, Button, Icon } from './Toolbar'
import { useEditor } from './hooks/useEditor'

const markButtonHotkeys = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const blockButtonHotkeys = {
  'mod+shift+8': 'numbered-list',
  'mod+shift+9': 'bulleted-list',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']

const Notestamp = ({
  editor,
  onStampInsert,
  onStampClick,
  placeholder,
  borderSize,
  borderStyle,
  borderColor,
  toolbarBackgroundColor,
  onChange,
}) => {
  const defaultPlaceholder = 'Press <Enter> to insert a stamp.\nPress <Shift + Enter> to escape stamping.'

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  const initialValue = useMemo(
    () =>
      [
        {
          type: 'paragraph',
          children: [{ text: '' }]
        }
      ],
    []
  )

  const Stamp = ({ attributes, children, element }) => {
    return (
      <span
        {...attributes}
        contentEditable={false}
        onClick={() => {
          onStampClick(element.label, element.value)
        }}
        style={{ 
          fontFamily: 'Helvetica',
          fontWeight: 'bold',
          bacgroundColor: 'transparent',
          color: 'orangered',
          textAlign: 'center',
          paddingRight: '1em',
          paddingTop: '0',
          fontSize: '0.65em',
          cursor: 'pointer',
          userSelect: 'none',
          height: '100%',
        }}
      >
        {children}
        <InlineChromiumBugfix />
        {element.label}
        <InlineChromiumBugfix />
      </span>
    )
  }

  const Element = props => {
    const { children, element, attributes } = props
    switch (element.type) {
      case 'stamp':
        return <Stamp {...props} />
      case 'bulleted-list':
        return (
          <ul {...attributes}>
            {children}
          </ul>
        )
      case 'list-item':
        return (
          <li {...attributes}>
            {children}
          </li>
        )
      case 'numbered-list':
        return (
          <ol {...attributes}>
            {children}
          </ol>
        )
      default:
        return <Paragraph {...props}>{children}</Paragraph>
    }
  }

  const dispatchKeyEvent = (event) => {
    switch (event.key) {
      case "Tab":
        event.preventDefault()
        handleInsertTab(event, editor)
        break
      case "Enter":
        if (event.shiftKey) {
          event.preventDefault()
          handleEscapeStamp(editor)
        } else {
          event.preventDefault()
          handleInsertStamp(onStampInsert, editor)
        }
        break
      case "Backspace":
        handleBackspace(editor, event)
        break
      default:
        for (let hotkey in markButtonHotkeys) {
          if (isHotkey(hotkey, event)) {
            event.preventDefault()
            toggleMark(editor, markButtonHotkeys[hotkey])
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
    <div style={{ 
      backgroundColor: `${toolbarBackgroundColor}`,
      border: `${borderSize} ${borderStyle} ${borderColor}`,
      height: '100%'
    }}>
      <SlateReact.Slate
        editor={editor}
        initialValue={initialValue}
        onChange={(value) => {
          const isAstChange = editor.operations.some(
            op => 'set_selection' !== op.type
          )
          isAstChange && onChange && onChange(value)
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <Toolbar>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '30px',
              padding: '10px',
              height: '100%',
            }}>
              <MarkButton 
                format='bold' 
                icon='format_bold' 
                description='Bold (Ctrl+B)' 
              />
              <MarkButton 
                format='italic' 
                icon='format_italic' 
                description='Italic (Ctrl+I)' 
              />
              <MarkButton 
                format='underline' 
                icon='format_underlined' 
                description='Underline (Ctrl+U)' 
              />
              <MarkButton 
                format='code' 
                icon='code' 
                description='Code (Ctrl+`)' 
              />
              <BlockButton 
                format='numbered-list' 
                icon='format_list_numbered' 
                description='Toggle numbered list (Ctrl+Shift+8)' 
              />
              <BlockButton 
                format='bulleted-list' 
                icon='format_list_bulleted' 
                description='Toggle bulleted list (Ctrl+Shift+9)' 
              />
            </div>
          </Toolbar>
          <Editable
            style={{ 
              outline: `${borderSize} ${borderStyle} ${borderColor}`,
              tabSize: '2',
              background: 'white',
              color: 'black',
              height: '100%',
              padding: '5px',
              overflow: 'auto',
              overflowX: 'hidden',
            }}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder === false ? '' : placeholder || defaultPlaceholder}
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
const handleInsertTab = (event, editor) => {
    event.preventDefault()
    const marks = Editor.marks(editor)
    Transforms.insertText(editor, '\t')
    for(const mark in marks) if (marks[mark]) Editor.addMark(editor, mark, true)
    return
}

const handleInsertStamp = (getStampData, editor) => {
  const { label, value } = getStampData(new Date())

  // Get the block that wraps our current selection
  const { selection } = editor
  const startPath = Editor.start(editor, selection)
  const [block] = Editor.parent(editor, startPath)

  const marks = Editor.marks(editor) // Save marks applied on current selection
  
  // Abort insertion of stamp if stamp value is null
  if (value === null) { 
    Transforms.insertNodes(editor, { ...block, children: [{ text: '' }] })
    for (const mark in marks) if (marks[mark]) Editor.addMark(editor, mark, true) 
    return 
  } 

  // If current block contains either a stamp node or a non-empty text node
  // then insert a block of similar type with an empty text node
  const stampFound = block.children.reduce(
    (accumulator, node) => {
      return accumulator || ('type' in node ? node.type === 'stamp' : false)
    },
    false
  )
  const textNode = block.children[block.children.length - 1]
  if (stampFound || textNode.text !== '') {
    Transforms.insertNodes(editor, { ...block, children: [{ text: '' }] })
  }

  // Proceed with stamp insertion
  const caretPathBeforeInsert = editor.selection.focus.path
  Transforms.insertNodes(editor, {
    type: 'stamp', 
    label: label, 
    value: value,
    children: [{ text: '' }] 
  })

  // Fix: After insertion the caret mysteriously disappears.
  // Force caret position to be positioned after the newly inserted node.
  const path = [...caretPathBeforeInsert]
  path[path.length-1] = caretPathBeforeInsert[path.length-1] + 2
  const caretPathAfterInsert = {
    path: path, offset: 0
  }
  Transforms.select(editor, ({
      anchor: caretPathAfterInsert,
      focus: caretPathAfterInsert
    }
  ))

  // Fix: restore marks
  for (const mark in marks) if (marks[mark]) Editor.addMark(editor, mark, true) 
  return
}

const handleBackspace = (editor, event) => {
  const { selection } = editor
  const startPath = Editor.start(editor, selection)
  const [block, blockPath] = Editor.parent(editor, startPath)

  if (Point.compare(selection.anchor, selection.focus)) return

  // Fix: Programatically delete an empty block to make sure caret appears at
  // the end of the previous block after deletion, but do not delete
  // the empty block if the editor has only one child block.
  if (editor.children.length > 1 
    || (editor.children.length === 1 
      && Node.parent(editor, blockPath)?.children.length > 1)) {
    if (block.children.length === 1 && block.children[0].text === '') {
      event.preventDefault()
      Transforms.removeNodes(editor, { at: startPath }) 
    }
  }
}

const handleEscapeStamp = (editor) => {
  const { selection } = editor
  const startPath = Editor.start(editor, selection);
  const [block] = Editor.parent(editor, startPath)
  const marks = Editor.marks(editor) // Save marks
  Transforms.insertNodes(editor, { ...block, children: [{ text: '' }] })
  // Fix: Restore marks
  for (const mark in marks) if (marks[mark]) Editor.addMark(editor, mark, true) 
  return 
}

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(
    editor,
    format
  )
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type),
    split: true
  })
  const newProperties = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format
  }
  Transforms.setNodes(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

// Toggle mark on current selection
const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor, format, blockType = 'type') => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format
    })
  )

  return !!match
}

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

/* Components */

const BlockButton = ({ format, icon, description }) => {
  const editor = useSlate()
  return (
    <Button
      title={description}
      active={isBlockActive(
        editor,
        format
      )}
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
      active={isMarkActive(editor, format)}
      title={description}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

const Paragraph = ({ attributes, children }) => {
  return (
    <p
      {...attributes}
      style={{ margin: '0', padding: '0' }}
    >
      {children}
    </p>
  )
}

const Leaf = props => {
  let { attributes, children, leaf } = props
  if (leaf.bold) children = <strong>{children}</strong>
  if (leaf.code) children = <code style={{ color: 'grey' }}>{children}</code>
  if (leaf.italic) children = <em>{children}</em>
  if (leaf.underline) children = <u>{children}</u>
  return (
    <span
      // The following is a workaround for a Chromium bug where,
      // if you have an inline at the end of a block,
      // clicking the end of a block puts the cursor inside the inline
      // instead of inside the final {text: ''} node
      // https://github.com/ianstormtaylor/slate/issues/4704#issuecomment-1006696364
      style={{ paddingLeft: leaf.text === '' ? '0.1px' : 'null' }}
      {...attributes}
    >
      {children}
    </span>
  )
}

// Put this at the start and end of an inline component to work around this Chromium bug:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
const InlineChromiumBugfix = () => (
  <span
    contentEditable={false}
    style={{ fontSize: 0 }}
  >
    {String.fromCodePoint(160) /* Non-breaking space */}
  </span>
)

export { Notestamp, useEditor }
