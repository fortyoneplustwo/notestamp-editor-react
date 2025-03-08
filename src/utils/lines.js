import { Editor, Text, Node } from "slate"

/**
 * Reduces all lines to a single string 
 */
export const linesToString = (lines) => 
  lines.reduce((acc, textList) => {
    return acc 
      + textList.reduce((acc, textNode) => acc + textNode.text, "")
      + "\n"
  }, "")

/**
 * Returns an array of type Text[][] where each item represents
 * the text nodes of a single line within the node
 */
export const getLines = (editor, node, options) => {
  // Base case
  if (!Editor.hasBlocks(editor, node)) {
    if (Text.isTextList(node.children)) {
      return [node.children]
    }
    const textChildren = []
    const childNodes = Node.nodes(node)
    for (const [child, path] of childNodes) {
      if (Text.isText(child)) {
        textChildren.push(child)
      } else if (options?.withStamps && child?.type === "stamp") {
        textChildren.push({ text: `${path[1] ? " " : ""}[${child.label}] ` })
      }
    }
    return [textChildren]
  }
  // Recursive step
  return node.children.flatMap((block) => getLines(editor, block))
}
