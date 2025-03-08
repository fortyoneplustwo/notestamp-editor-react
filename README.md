
# notestamp

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/notestamp.svg)](https://www.npmjs.com/package/notestamp) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Description
A rich-text editor library for React that supports clickable stamps.

A stamp is automatically inserted at the start of a line when the `Enter` key is pressed. You can define an arbitrary state to be stored inside a stamp as well as a function to execute when a stamp is clicked.

A common use case of this component is to synchronize text to some entity e.g. an audio file. See [https://notestamp.com](https://notestamp.com) as an example.

## Install

```bash
npm install notestamp
```

## Usage

```jsx
import React, { useRef } from 'react'

import { Notestamp, useEditor } from 'notestamp'

const App = () => {
	const { editor } = useEditor()
	
	const setStampData = dateStampRequested => {
	  return { label: 'three', value: 3 }
	}

	const printStampLabel = (label, _) => console.log(`Clicked stamp: ${label}`)

	return (
	    <Notestamp 
		    editor={editor}
	        onStampInsert={setStampData}
	        onStampClick={printStampLabel}
	        borderSize='1px'
	        borderColor='lightgray'
	        borderStyle='solid'
	        toolbarBackgroundColor='whitesmoke'
	    />
	)
}
```

## Usage
Extract the `editor` object from the `useEditor()` hook and pass it as a prop to the `Notestamp` component.

## Editor Object
The `editor` object returned by `useEditor()` extends Slate's editor prototype with additional methods and behaviors, allowing you to use it without requiring deep knowledge of Slate.

**Warning**: Only the methods defined below have been tested for this particular React library. If you wish to use all the other properties and methods available on the `editor` object, you should read up on [Slate's official documentation](https://docs.slatejs.org/concepts/07-editor). 

### Methods
Use these methods to interact with the editor:

- `getChildren()`: Returns the editor's content (also known as *children* in Slate). This is a JSON object conforming to Slate’s `Node[]` interface.

- `setChildren(children)`: Replaces the editor’s content with `children`. This is the only way to set content that includes stamps. The `children` must adhere to [Slate’s `Node[]` interface. Read more on [Slate's official documentation](https://docs.slatejs.org/concepts/02-nodes).

- `getTextContent(options)`: Returns the editor’s text as a single string, excluding stamps. To include stamps, pass `{ withStamps: true }` as `options`.

- `setTextContent(content)`: Replaces the editor’s content with `content`, which must be a string.

- `clear()`: Clears the editor’s content.

## Notestamp Component
Render the `Notestamp` component and pass the `editor` as a prop. Additional props allow you to listen for events, customize the UI, and define stamp behavior.

### Props

- `editor`:  Expects the `editor` object returned by `useEditor`.

- `onStampInsert`: Called when the `Enter` key is pressed. Receives `dateEnterKeyPressed` (a `Date` object) as an argument and should return an object `{ label: string, value: any }`. The `label` is displayed inside the stamp, and `value` holds the stamp’s state. Returning `null` for `value` cancels the insertion.

- `onStampClick`: A callback function that executes when a stamp is clicked. Receives `label: string` and `value: any` as arguments.

- `placeholder`: Sets a custom placeholder text. Pass a string to override the default or `false` to disable it.

- `toolbarBackgroundColor`: Sets the toolbar’s background color.

- `borderColor`, `borderSize`, `borderStyle`: Customize the color, thickness, and style of the editor’s border, including the separator between the toolbar and the text area.

- `onChange`: A callback function that executes when the editor’s content changes. Receives `value: Node[]`, representing the updated content.

## Credits

This editor was built using [Slate](https://docs.slatejs.org/).

## License

MIT © [fortyoneplustwo](https://github.com/fortyoneplustwo)
