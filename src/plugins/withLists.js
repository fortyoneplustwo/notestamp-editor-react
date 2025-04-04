import { Transforms, Editor, Element } from "slate"

export const withLists = editor => {
  const BULLETED_LIST_TYPE = "bulleted-list"
  const NUMBERED_LIST_TYPE = "numbered-list"
  const LIST_ITEM_TYPE = "list-item"
  const LIST_TYPES = [NUMBERED_LIST_TYPE, BULLETED_LIST_TYPE]

  editor.toggleList = (isActive, type) => {
    if (!LIST_TYPES.includes(type)) throw Error("Invalid list type")

    Transforms.unwrapNodes(editor, {
      match: n =>
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        LIST_TYPES.includes(n.type),
      split: true,
    })
    const newProperties = {
      type: isActive ? "paragraph" : LIST_ITEM_TYPE,
    }
    Transforms.setNodes(editor, newProperties)

    if (!isActive) {
      const block = { type: type, children: [] }
      Transforms.wrapNodes(editor, block)
    }
  }

  editor.LIST_TYPES = LIST_TYPES
  editor.LIST_ITEM_TYPE = LIST_ITEM_TYPE
  editor.BULLETED_LIST_TYPE = BULLETED_LIST_TYPE
  editor.NUMBERED_LIST_TYPE = NUMBERED_LIST_TYPE

  return editor
}
