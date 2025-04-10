import { useState, useEffect } from "react"
import { isMarkActive, isBlockActive, isMark, isBlock } from "../utils/format"

export const useFormatActiveState = (editor, format) => {
  const [active, setIsActive] = useState(false)

  useEffect(() => {
    const update = () => {
      if (isMark(format)) {
        setIsActive(isMarkActive(editor, format))
      }
      if (isBlock(format)) {
        setIsActive(isBlockActive(editor, format))
      }
    }

    const { onChange } = editor
    editor.onChange = () => {
      update()
      onChange?.()
    }

    update()

    return () => {
      editor.onChange = onChange
    }
  }, [editor, format])

  return [active]
}
