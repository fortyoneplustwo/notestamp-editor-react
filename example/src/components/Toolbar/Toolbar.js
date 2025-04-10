import React from "react"
import { cx, css } from "@emotion/css"
import { Format, useFormatActiveState } from "notestamp"
import { Bold, Italic, Underline, Code, ListOrdered, List } from "lucide-react"

export const Toolbar = ({ className, editor, ...props }) => {
  const FormatButton = ({ format, icon, className, ...props }) => {
    const [isActive] = useFormatActiveState(editor, format)
    const Icon = icon
    return (
      <span
        {...props}
        onMouseDown={event => {
          event.preventDefault()
          Format.toggle(editor, format)
        }}
        className={cx(
          className,
          css`
            cursor: pointer;
            color: ${isActive ? "orangered" : "#ccc"};
          `
        )}
      >
        <Icon size={16} />
      </span>
    )
  }

  return (
    <div
      {...props}
      className={cx(
        className,
        css`
          padding: 10px;

          & > * {
            display: inline-block;
          }

          & > * + * {
            margin-left: 15px;
          }
        `
      )}
    >
      <FormatButton format={Format.bold} icon={Bold} />
      <FormatButton format={Format.italic} icon={Italic} />
      <FormatButton format={Format.uderline} icon={Underline} />
      <FormatButton format={Format.code} icon={Code} />
      <FormatButton format={Format.orderedList} icon={ListOrdered} />
      <FormatButton format={Format.unorderedList} icon={List} />
    </div>
  )
}
