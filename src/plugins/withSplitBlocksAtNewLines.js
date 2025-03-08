import { Transforms, Text, Editor } from "slate"

export const withSplitBlocksAtNewLines = editor => {
  const { normalizeNode } = editor

  editor.normalizeNode = entry => {
    const [node, path] = entry
    // If a block has a child text node containing a "\n",
    // split it into two blocks
    if (Text.isText(node)) {
      const newlineIndex = node.text.search(/(?<!\\)\n/)
      if (newlineIndex < 0) return 
      Editor.withoutNormalizing(editor, () => {
        Transforms.delete(editor, {
          at: { path: path, offset: newlineIndex },
          distance: 1,
          unit: 'character',
        })
        Transforms.splitNodes(editor, {
          at: { path: path, offset: newlineIndex },
        })
      })
      return
    }
    normalizeNode(entry)
  }

  return editor
}
