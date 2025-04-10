## Description

A React rich-text editor that syncs text with any entity using clickable "stamps."

When the user inputs text on an empty line, a stamp is automatically inserted at the beginning of the line. Each stamp can hold custom state and trigger a function when clicked.

## Why?
- You need a textbox that can synchronize to an entity.
- You need something that can be as simple as HTML's `textarea` or as complex as a rich-text editor
- You'd like to design your own toolbar.
- You don't have time to learn [Slate](https://docs.slatejs.org/) to build your own editor with stamp functionality.

## Install

```bash
npm install notestamp
```

## Usage
First, extract the `editor` object using the `useEditor()` hook, then define your `onStampInsert` and `onStampClick` callback functions. Finally, pass all of these as props to the `Notestamp` component.

```jsx
import React, { useRef } from 'react'

import { Notestamp, useEditor } from 'notestamp'

const App = () => {
	const { editor } = useEditor()
	
	const setStampData = requestedAt => {
	  return { label: 'three', value: 3 }
	}

	const printStampLabel = (label, value) => {
		console.log(`Clicked stamp: ${label, value}`)
	}

	return (
	    <Notestamp 
		    editor={editor}
	        onStampInsert={setStampData}
	        onStampClick={printStampLabel}
	    />
	)
}
```

## Editor object
The `Editor` object returned by `useEditor()` has all the default properties and methods as [Slate's  prototype](https://docs.slatejs.org/concepts/07-editor) and is augmented with the high-level methods described below.

### Methods

#### `getChildren() => Node[]` 
Returns the editor's content a.k.a. children.

#### `setChildren(children: Node[]) => void`
 Replaces the editor’s content with `children`. The `children` must adhere to the `Node[]` interface  [defined by Slate](https://docs.slatejs.org/concepts/02-nodes).

#### `getTextContent(options?) => string`
Returns the editor’s text content, excluding stamps by default. 

Options:
- `{ withStamps: boolean }`: Include stamps in the return value.

#### `setTextContent(content: string) => void`
Set the editor’s content.

#### `clear() => void`
Clears the editor’s content.

## Notestamp component

### Props
It takes as props, any props defined by Slate's [Editable](https://docs.slatejs.org/libraries/slate-react/editable) component except `renderElement` and `renderLeaf`. 

You **must** pass the following props:

#### `editor: Editor`
Expects the `editor` object returned by `useEditor`.

#### `onStampInsert: (requestedAt: Date) => { value: any, label: string } | null`
Executes when the user types on an empty line, right before a stamp is inserted. The `requestedAt` argument provides the timestamp of this event.  

Return an object with `{ value, label }` to define the stamp's content:

-   `value` holds the underlying data (e.g., a precise timestamp or identifier).  
-   `label` is a human-readable string displayed inside the stamp (often a formatted version of `value`).

**Note** :  If `null` is returned or the `value` property evaluates to `null`, then a stamp will not be inserted.

#### `onStampClick(label: string, value: any) => void`
Executes when a stamp is clicked. Receives `label: string` and `value: any` as arguments i.e. the data stored by the stamp.

## Hooks
#### `useEditor() => Editor`
Returns an editor object with the method augmentations mentioned above.

#### `useFormatActiveState(editor: Editor, format: keyof Format) => [boolean]`
Returns an array with one state variable indicating the active state of the specified text format at the current selection. This is particularly useful for implementing a toolbar that reflects the formatting state.

## Format class
`Format` is a utility class that houses all available text formats as properties as well as a method to toggle them.

### Properties:

- `bold`
- `italic`
- `underline`
- `code` (plain text)
- `orderedList` (numbered list)
- `unorderedList` (bulleted list)

### Methods:

#### `toggleFormat(editor: Editor, format: keyof Format)`
Toggles the formatting specified text format at the current selection.


## FAQ
- **Where can I find example code on how to use this library?**
An example project with toolbar and keyboard shortcut implementations is available in the `example/` directory. To run it locally:
	1. Clone this repository.
    2. Run `npm install` in the root directory.
    3. Navigate to the `example/` folder.
    4. Run `npm install` and then `npm start`.

- **Can this text-editor handle anything other than text, such as images?**
Currently, it's not available. However, I will soon release the stamp functionality as a [Slate plugin](https://docs.slatejs.org/concepts/08-plugins) for you to integrate into your custom text editor built with [Slate](https://docs.slatejs.org/).


## Credits

This editor was built using [Slate](https://docs.slatejs.org/).

## License

MIT © [fortyoneplustwo](https://github.com/fortyoneplustwo)
