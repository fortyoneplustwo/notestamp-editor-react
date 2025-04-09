import React from "react"
import { Menu, Button, Icon } from "./components/ToolbarComponents"
import { cx, css } from "@emotion/css"
import { Format, useFormatActiveState } from "notestamp"

export const Toolbar = ({ className, editor, ...props }) => {
  const FormatButton = ({ format, icon, ...props }) => {
    const [isActive] = useFormatActiveState(editor, format)
    return (
      <Button
        {...props}
        active={isActive}
        onMouseDown={event => {
          event.preventDefault()
          Format.toggle(editor, format)
        }}
      >
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  return (
    <Menu
      {...props}
      className={cx(
        className,
        css`
          padding: 10px;
        `
      )}
    >
      <FormatButton format={Format.bold} icon="format_bold" />
      <FormatButton format={Format.italic} icon="format_italic" />
      <FormatButton format={Format.uderline} icon="format_underlined" />
      <FormatButton format={Format.code} icon="code" />
      <FormatButton format={Format.orderedList} icon="format_list_numbered" />
      <FormatButton format={Format.unorderedList} icon="format_list_bulleted" />
    </Menu>
  )
}
