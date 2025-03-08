// Returns an editor that supports inline elements
export const withInlineStamps = editor => {
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
