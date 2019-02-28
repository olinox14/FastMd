[![Build Status](https://travis-ci.org/olinox14/FullMd.svg?branch=master)](https://travis-ci.org/olinox14/FullMd)

# FullMd

![demo](/content/demo.gif)

**FullMD** is a [Markdown](https://daringfireball.net/projects/markdown/syntax) formatting [Visual Studio Code](https://code.visualstudio.com/) extension that provides a lot of convenients keyboard shortcuts.

* Usual operations, like toggling *italic*, **bold**, or ~~striketrough~~, `blockcodes`...
* Set / Increase / Decrease ***header*** level
* Smart ***links*** formatting
* Insert ***tables***, add columns or row dynamically, recognize csv
* Easy use of ***checklists***

## Usage

### Keys

| Keys | Command |
| ----- | ----- |
| Alt + Enter | Insert a **line break** |
| Ctrl + / | **Escape** special characters from the selection |
| Ctrl + D | Increase the **header** level |
| Ctrl + Shift + D | Decrease the **header** level |
| Ctrl + Shift + [Num] | Set the **header**'s level (from 1 to 5) |
| Ctrl + Shift + 9 | Remove the **header**'s formatting |
| Ctrl + I | Toggle **italic** format |
| Ctrl + B | Toggle **bold** format |
| Ctrl + Alt + S | Toggle **striketrough** format |
| Ctrl + L | Toggle **link** format |
| Ctrl + [Num] | Toggle **numeric-style link** format |
| Ctrl + G | Toggle **image**-link format |
| Ctrl + Q | Toggle **blockquote** |
| Ctrl + R | Insert **horizontal ruler**  |
| Ctrl + K | Toggle **code-block** format |
| Ctrl + U | Toggle **unordered list** format |
| Ctrl + O | Toggle **ordered list** format  |
| Alt + X | Toggle **checklist** format   |
| Alt + C | **Check / uncheck** current item of a checklist |
| Ctrl + T  T |  Insert or format a **table** |
| Ctrl + T  Right | **Add a column** to the current table  |
| Ctrl + T  Down | **Add a row** to the current table |
| Alt+Z | Toggle **Zen Mode** |
| Alt+V | Show **side-preview** |

### Line-breaks

Use `Ctrl + Enter` to insert a markdown line break, i.e. two spaces and a line break

### Escaping

Use `Ctrl + /` to escape each special characters from the selected text.

<kbd><img src="./content/escape.gif" style="border: solid 1px lightgrey;" /></kbd>

### Basic formatting

**FullMd** will perform the basic formatting operations, like bold, italic, striketrough, blockquotes, codeblocks...

<kbd><img src="./content/toggleItalic.gif" style="border: solid 1px lightgrey;" /></kbd>

<kbd><img src="./content/toggleBold.gif" style="border: solid 1px lightgrey;" /></kbd>

<kbd><img src="./content/toggleBlockquote.gif" style="border: solid 1px lightgrey;" /></kbd>

<kbd><img src="./content/toggleCodeBlock2.gif" style="border: solid 1px lightgrey;" /></kbd>

<kbd><img src="./content/toggleCodeBlock1.gif" style="border: solid 1px lightgrey;" /></kbd>

### Headers

Use `Ctrl + Shift + [Num]` to set the current line's header's level to `num`, whith `num` between 1 and 5. `Ctrl + Shift + 9` will reset the format.

<kbd><img src="./content/setHeader.gif" style="border: solid 1px lightgrey;" /></kbd>

Use `Ctrl + h` and `Ctrl + Shift + h` to increment or decrement the header's level.

<kbd><img src="./content/headerupNDown.gif" style="border: solid 1px lightgrey;" /></kbd>

### Lists

Use:

* `Ctrl + U` to format the selected lines into an unordered list.
* `Ctrl + O` to format the selected lines into an ordered list.
* `Alt + X` to format the selected lines into a checklist
* `Alt + C` to check or uncheck a checklist item.

<kbd><img src="./content/toggleLists.gif" style="border: solid 1px lightgrey;" /></kbd>

### Links

The `Ctrl + L` command will toggle the link formatting.

The behaviour will depends on the current selection:
> NB: '§' is the cursor position

    [abc](url) => [abc](url)   // does nothing
    [abc]() => abc§            // abc can be an empty string
    [](url) => <url>§
    <url> => url§
    url => [§](url)
    abc => [abc](§)            // if none url in the clipboard; abc can be an empty string
    abc => [abc](url)§         // if an url was found in the clipboard; abc can be an empty string

<kbd><img src="./content/toggleLink1.gif" style="border: solid 1px lightgrey;" /></kbd>

<kbd><img src="./content/toggleLink2.gif" style="border: solid 1px lightgrey;" /></kbd>

<kbd><img src="./content/toggleLink3.gif" style="border: solid 1px lightgrey;" /></kbd>

### Numeric references

The `Ctrl + [Num]` command will transform a `[title](link)` formatted link to a numeric reference, like:

```
[title][1]

(...)

[1]: url
```

> The url is automatically added at the end of the current document

If used again, the operation is reversed but the reference at the bottom is **NOT** deleted.

<kbd><img src="./content/toggleNumLinks.gif" style="border: solid 1px lightgrey;" /></kbd>

### Tables

Use `Ctrl + T T` to insert a table. This command will also format a csv-like block of text.

Once the table has been added, you can use `Ctrl + T Right` and `Ctrl + T Down` to add a column or a row to it.

<kbd><img src="./content/insertTable2.gif" style="border: solid 1px lightgrey;" /></kbd>

<kbd><img src="./content/insertTable.gif" style="border: solid 1px lightgrey;" /></kbd>

<kbd><img src="./content/addCol.gif" style="border: solid 1px lightgrey;" /></kbd>

## Credits

Thanks to the author(s) of the following extensions, which inspired me some parts of FullMd:

* [vscode-markdown-shortcuts](https://github.com/mdickin/vscode-markdown-shortcuts)
* [vscode-markdown](https://github.com/yzhang-gh/vscode-markdown)

## Licence

**FullMd** is under [GNU Licence](LICENCE)