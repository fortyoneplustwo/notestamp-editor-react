# notestamp

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/notestamp.svg)](https://www.npmjs.com/package/notestamp) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Description
A rich text editor React component that supports clickable stamps.

A stamp is automatically inserted at the start of a line when the `Enter` key is pressed. You can define an arbitrary value to be stored inside the stamp. Press `Shift + Enter` to insert a new line without inserting a stamp.

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
    />
)
```

## Exposed handles
The following functions can be accessed using the `ref`.

- `getJsonContent()`: Returns an array that represents the editor's content (including stamps) in JSON format.

- `getHtmlContent()`: Returns a string that represents the editor's content (excluding) stamps in HTML format.

- `setContent(newContent)`: Set the editor's content to a JSON value defined by the parameter `newContent`.

## Props

- `onStampInsert`: A callback function that is executed when `Enter` is pressed. It contains one argument parameter of type `Date` which logs when the `Enter` key was pressed. The function should return an object `{ label: String, value: Any }`. `value` is the state you want to store inside the stamp and `label` is the string representation of that value which will be displayed inside the stamp. If `value` is set to `null`, stamp insertion is aborted.

- `onStampClick`: A callback function that is executed when a stamp is clicked. The parameters are `( label, value )` as returned by `onStampInsert`. This function defines the action to perform when a stamp is clicked. There is no return value.

- `placeholder`: The editor displays a placeholder text by default, but you may override is by passing a string to this prop or disable it by passing `false`.

## Credits

This editor was built using [https://docs.slatejs.org/](Slate).

## License

MIT © [fortyoneplustwo](https://github.com/fortyoneplustwo)
