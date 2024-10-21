import 'material-icons/iconfont/material-icons.css'
import React, { useMemo, useCallback, useState, useImperativeHandle } from 'react'
import { isKeyHotkey, isHotkey } from 'is-hotkey'
import { Editable, withReact, useSlate } from 'slate-react'
import * as SlateReact from 'slate-react'
import {
  Editor,
  Transforms,
  createEditor,
  Element as SlateElement,
  Point
} from 'slate'
import { withHistory } from 'slate-history'
import { Toolbar, Button, Icon } from './Toolbar.js'

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code'
}
const LIST_TYPES = ['numbered-list', 'bulleted-list']

export const Notestamp = React.forwardRef((props, ref) => {
  const { onStampInsert, onStampClick, placeholder, borderSize, borderStyle, borderColor, toolbarBackgroundColor } = props
  const [internalClipboard, setInternalClipboard] = useState([])
  const defaultPlaceholder = 'Press <Enter> to insert a stamp.\nPress <Shift + Enter> to escape stamping.'

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  const editor = useMemo(() => withInlines(withReact(withHistory(createEditor()))), [])

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

  useImperativeHandle(ref, () => {
    return {
      getJsonContent: () => {
        return editor.children
      },
      getTextContent: () => {
        Transforms.select(editor, {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, [])
        })

        const { selection } = editor
        if (selection) {
          const fragment = editor.getFragment()

          // Each item in copiedLines is an array that contains 
          // the text nodes of a single line
          const copiedLines = []
          for (const block of fragment) {
            if (block.type === 'paragraph') {
              const line = block.children.map(child => {
                return child
              })
              copiedLines.push(line)
            } else { // list block
              for (const listItem of block.children) {
                const line = listItem.children.map(child => {
                  return child
                })
                copiedLines.push(line)
              }
            }
          }

          // join the copied lines into a single string
          return copiedLines.reduce((acc, line) => {
            return acc
              + (line.reduce((acc, textNode) => {
                return acc + textNode.text
              }, ''))
              + '\n'
          }, '')
        }
        return ""
      },
      setContent: newContent => {
        const newNodes = newContent
        // Select entire content to ensure all nodes get removed
        Transforms.select(editor, {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, [])
        })
        Transforms.unwrapNodes(editor)
        Transforms.removeNodes(editor)
        Transforms.insertNodes(editor, newNodes)
      }
    }
  }, [editor])

  // Copy nodes to editor clipboard and text to device clipboard
  const handleCopy = event => {
    event.preventDefault()
    const { selection } = editor
    if (selection) {
      const fragment = editor.getFragment()

      // Each item in copiedLines is an array that contains the text nodes of a single line
      const copiedLines = []
      for (const block of fragment) {
        if (block.type === 'paragraph') {
          const line = block.children.map(child => {
            return child
          })
          copiedLines.push(line)
        } else { // list block
          for (const listItem of block.children) {
            const line = listItem.children.map(child => {
              return child
            })
            copiedLines.push(line)
          }
        }
      }

      // join the copied lines into a single string
      const copiedLinesToString = copiedLines.reduce((acc, line) => {
        return acc
          + (line.reduce((acc, textNode) => {
            return acc + textNode.text
          }, ''))
          + '\n'
      }, '')

      event.clipboardData.setData('text/plain', copiedLinesToString)
      setInternalClipboard(copiedLines)
    }
  }

  // Paste nodes from editor clipboard if content of editor and device clipboard are equal
  // Otherwise paste contents of device clipboard
  const handlePaste = event => {
    event.preventDefault()

    // convert editor clipboard to string
    const internalClipboardToText = internalClipboard.reduce((acc, line) => {
      return acc
        + (line.reduce((acc, textNode) => {
          return acc + textNode.text
        }, ''))
        + '\n'
    }, '')

    const deviceClipboardData = event.clipboardData.getData('Text')
    if (internalClipboardToText === deviceClipboardData) {
      for (let i = 0; i < internalClipboard.length; i++) {
        for (const textNode of internalClipboard[i]) {
          Transforms.insertNodes(editor, { ...textNode })
        }
        if (i < internalClipboard.length - 1) {
          Transforms.insertNodes(editor, { text: '\n' })
        }
      }
    } else {
      Transforms.insertText(editor, deviceClipboardData.toString())
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
              <MarkButton format='bold' icon='format_bold' description='Bold (Ctrl+B)' />
              <MarkButton format='italic' icon='format_italic' description='Italic (Ctrl+I)' />
              <MarkButton format='underline' icon='format_underlined' description='Underline (Ctrl+U)' />
              <MarkButton format='code' icon='code' description='Code (Ctrl+`)' />
              <BlockButton format='numbered-list' icon='format_list_numbered' description='Toggle numbered list (Ctrl+Shift+8)' />
              <BlockButton format='bulleted-list' icon='format_list_bulleted' description='Toggle bulleted list (Ctrl+Shift+9)' />
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
            onCopy={handleCopy}
            onPaste={handlePaste}
            onKeyDown={event => onKeyDown(event, onStampInsert, editor)}
          />
        </div>
      </SlateReact.Slate>
    </div>
  )
})

/* Functions */

// Keyboard events
const onKeyDown = (event, onStampInsert, editor) => {
  const { nativeEvent } = event
  // Handle formatting hotkeys. TODO reimplement this. it's really slow
  for (const hotkey in HOTKEYS) {
    if (isHotkey(hotkey, event)) {
      event.preventDefault()
      const mark = HOTKEYS[hotkey]
      toggleMark(editor, mark)
    }
  }

  if (isHotkey('tab', nativeEvent)) {
    event.preventDefault()
    const marks = Editor.marks(editor)
    Transforms.insertText(editor, '\t')
    for (const mark in marks) if (marks[mark]) Editor.addMark(editor, mark, true)
  } else if (isHotkey('shift+enter', nativeEvent)) {
    event.preventDefault()
    const { selection } = editor
    const startPath = Editor.start(editor, selection)
    const [block] = Editor.parent(editor, startPath)
    const marks = Editor.marks(editor) // *
    Transforms.insertNodes(editor, { ...block, children: [{ text: '' }] })
    for (const mark in marks) if (marks[mark]) Editor.addMark(editor, mark, true)
  } else if (isHotkey('mod+shift+8', nativeEvent)) {
    event.preventDefault()
    toggleBlock(editor, 'numbered-list')
  } else if (isHotkey('mod+shift+9', nativeEvent)) {
    event.preventDefault()
    toggleBlock(editor, 'bulleted-list')
  } else if (isKeyHotkey('backspace', nativeEvent)) {
    // Get the block that wraps our current selection
    const { selection } = editor
    const startPath = Editor.start(editor, selection)
    const [block] = Editor.parent(editor, startPath)

    if (selection.isFocused && Point.compare(selection.anchor, selection.focus)) return

    // Fix: manually delete empty block to make sure caret appears at the
    // end of previous block after delete operation
    // Make sure not to delete last remaining block
    if (editor.children.length > 1
      || (editor.children.length === 1
        && block.type === 'list-item'
        && editor.children[0].children.length > 1)) {
      if (block.children.length === 1 && block.children[0].text === '') {
        event.preventDefault()
        Transforms.removeNodes(editor, { at: startPath })
      }
    }
  } else if (isKeyHotkey('enter', nativeEvent)) {
    const { label, value } = onStampInsert(new Date())
    event.preventDefault()

    // Get the block that wraps our current selection
    const { selection } = editor
    const startPath = Editor.start(editor, selection)
    const [block] = Editor.parent(editor, startPath)

    // save marks on current selection
    const marks = Editor.marks(editor) // *

    // abort insertion of stamp if stamp value is null
    if (value === null) {
      Transforms.insertNodes(editor, { ...block, children: [{ text: '' }] })
      for (const mark in marks) if (marks[mark]) Editor.addMark(editor, mark, true)
      return
    }

    // If current block contains either a stamp node or a non-empty text node,
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
    const caretPathBeforeInsert = editor.selection.focus.path // **
    Transforms.insertNodes(editor, {
      type: 'stamp',
      label: label,
      value: value,
      children: [{ text: '' }]
    })

    // ** (fix) After insertion the caret mysteriously disappears.
    // Force caret position to after newly inserted node.
    const path = [...caretPathBeforeInsert]
    path[path.length - 1] = caretPathBeforeInsert[path.length - 1] + 2
    const caretPathAfterInsert = {
      path: path, offset: 0
    }

    Transforms.select(editor, ({
      anchor: caretPathAfterInsert,
      focus: caretPathAfterInsert
    }))

    // * (fix) restore marks
    for (const mark in marks) if (marks[mark]) Editor.addMark(editor, mark, true)
  }
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

// Returns an editor that supports inline elements
const withInlines = editor => {
  const {
    isVoid,
    isInline,
    isElementReadOnly,
    isSelectable
  } = editor
  // overriding these methods to define stamp behaviour
  editor.isVoid = element =>
    ['stamp'].includes(element.type) || isVoid(element)
  editor.isInline = element =>
    ['stamp'].includes(element.type) || isInline(element)
  editor.isElementReadOnly = element =>
    element.type === 'stamp' || isElementReadOnly(element)
  editor.isSelectable = element =>
    element.type !== 'stamp' && isSelectable(element)
  return editor
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

// export default Notestamp
