# notestamp

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/notestamp.svg)](https://www.npmjs.com/package/notestamp) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Description
A rich text editor React component that supports clickable stamps.

A stamp is automatically inserted at the start of a line when the `Enter` key is pressed. You can define an arbitrary state to be stored inside a stamp.

You may also define an action to be performed when a stamp is clicked.

A common use case of this component is to synchronize text to some form of media e.g. an audio file. See [https://notestamp.com](https://notestamp.com) as an example.

## Install

```bash
npm install notestamp
```

## Usage

```jsx
import React, { useRef } from 'react'

import { Notestamp } from 'notestamp'

const editorRef = useRef(null)

const setStampData = dateStampRequested => {
  return { label: 'three', value: 3 }
}

const printStampLabel = (label, value) => console.log(`Clicked stamp: ${label}`)

return (
    <Notestamp ref={editorRef}
        onStampInsert={setStampData}
        onStampClick={printStampLabel}
        borderSize='1px'
        borderColor='lightgray'
        borderStyle='solid'
        toolbarBackgroundColor='whitesmoke'
    />
)
```

## Exposed handles
The following functions can be accessed using the `ref`.

- `getJsonContent()`: Returns an array that represents the editor's content (stamps included) in JSON format.

- `getTextlContent()`: Returns the editor's content as a string (stamps excluded).

- `setContent(newContent)`: Set the editor's content to a JSON value defined by the parameter `newContent`.

## Props

- `onStampInsert`: When the Enter key is pressed, this callback function executes with argument `dateEnterKeyPressed: Date`. The return value should be an object `{ label: String, value: Any }` where `value` is the state you want the stamp to hold and `label` is the actual string to display inside the stamp. If `value` is set to `null`, stamp insertion is aborted.

- `onStampClick`: A callback function that executes with arguments `label: String` and `value: Any` when a stamp is clicked. There is no return value.

- `placeholder`: The editor displays a placeholder text by default, but you may override it by passing a string to this prop or disable it by passing `false`.

- `toolbarBackgroundColor`: Sets the background color of the toolbar.

- `borderColor`, `borderSize`, `borderStyle`: Sets the color, size and style of the border surrounding the editor as well as the line separating the toolbar from the text area.

## Credits

This editor was built using [Slate](https://docs.slatejs.org/).

## License

MIT © [fortyoneplustwo](https://github.com/fortyoneplustwo)
