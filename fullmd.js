"use strict";
/*
    FullMD is under GNU Licence
    @olinox14, feb. 2019
*/

const vscode = require('vscode');

// *** Utils

/** return the text escaped for use in a regex */
function reEscape(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/** return the text escaped for use in markdown */
function mdEscape(text) {
	return text.replace(/[-[\]{}()*+.\\#`_!]/g, '\\$&');
}

/**
 * Called on FullMD activation
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// *** Conf

	const italicSymbol = '*';     // has to be one-character only
	const uListSymbol = '*';     // has to be one-character only
	const cleverUnlink = false;    // allows to unlink a [title](url) with ctrl+l; the url is written to the clipboard
	const autoPasteLinks = true;    // an url found the clipboard is automatically pasted when a word is formatted with ctrl+l
	const autoRef = true;         // Move the url at the bottom of the document when numeric link reference formatting is applied
	const tabCodeBlock = true;     // block of code are formatted with tab pattern (instead of ```code```)
	const csvSeparators = ';\t|';  // symbols recognized as csv separators when inserting a table

	// *** Shorthands

	/** return the current text editor */
	function editor() { return vscode.window.activeTextEditor; }
	
	/** return the current selection */
	function selection() { return editor().selection; }

	/** return the current position */
	function position() { return selection().active; }
	// set a new position for the cursor
	
	/** set a new position */
	function setPosition(l, c) {
		var newPosition = position().with(l, c);
        var newSelection = new vscode.Selection(newPosition, newPosition);
		editor().selection = newSelection;
		return newPosition;
	}

	// return the previous line, null if none
	function previousLine(position) {
		return  (position.line > 1) ? editor().document.lineAt(position.line - 1) : null;
	}

	// return the next line, null if none
	function nextLine(position) {
		return (position.line < editor().document.lineCount - 1) ? editor().document.lineAt(position.line + 1) : null;
	}

	// return true if the previous line exists and is empty or whitespace
	function previousLineNotEmpty(position) {
		let prevL = previousLine(position);
		return (prevL != null && (!prevL.isEmptyOrWhitespace));
	}

	// return true if the next line exists and is empty or whitespace
	function nextLineNotEmpty(position) {
		let nextL = nextLine(position);
		return (nextL != null && (!nextL.isEmptyOrWhitespace));
	}

	// return the position of the end of the line
	function endOfLine(lineNumber) {
		return new vscode.Position(lineNumber, editor().document.lineAt(lineNumber).text.length);
	}


	// *** Commands

	/** [ctrl+enter]
	 *  Add double-space before the newline character to insert a markdown newline
	 */
	function addLinebreak() {
		return editor().edit((edit) => {
			edit.insert(selection().end, '  \n');
		} )
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.addLinebreak', addLinebreak));

	/** [ctrl+/]
	 *  Escape each special character in the selection
	 */
	function escape() {
		return editor().edit(edit => edit.replace(selection(), (() => mdEscape(editor().document.getText(selection())))()));
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.escape', escape));

	/** [ctrl+h]
	 *  Increase the header level of one
	 */
	function headerUp() {
		var line = editor().document.lineAt(position().line);
		if (!line.text.startsWith('#####')){
			return editor().edit((edit) => {
				return edit.insert(new vscode.Position(position().line, 0), (line.text.startsWith('#') ? '#' : '# '));
			} );
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.headerUp', headerUp));

	/** [ctrl+shift+h]
	 *  Decrease the header level of one
	 */
	function headerDown() {
		var line = editor().document.lineAt(position().line);
		if (line.text.startsWith('#')){
			return editor().edit((edit) => {
				return edit.delete(new vscode.Range(new vscode.Position(position().line, 0), 
								                    new vscode.Position(position().line, (line.text.startsWith('# ') ? 2 : 1))));
			} );
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.headerDown', headerDown));
	
	/** Set the header's level to 'level' */
	function setHeader(level) {
		var line = editor().document.lineAt(position().line);
		return editor().edit((edit) => {
			return edit.replace(new vscode.Range(new vscode.Position(position().line, 0), 
												 new vscode.Position(position().line, 
												                     line.text.search(/[^\s#]/))), 
								'#'.repeat(level) + ' ');
		});
	}

	/** [ctrl+shift+1] Set the header's level to 1 */
	function setH1() { return setHeader(1); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.setH1', setH1));

	/** [ctrl+shift+2] Set the header's level to 2 */
	function setH2() { return setHeader(2); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.setH2', setH2));

	/** [ctrl+shift+3] Set the header's level to 3 */
	function setH3() { return setHeader(3); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.setH3', setH3));

	/** [ctrl+shift+4] Set the header's level to 4 */
	function setH4() { return setHeader(4); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.setH4', setH4));

	/** [ctrl+shift+5] Set the header's level to 5 */
	function setH5() { return setHeader(5); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.setH5', setH5));
	
	function toggleSurrounding(symbol) {
	
		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			let word = editor().document.getWordRangeAtPosition(position(), new RegExp(srx));
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		let srx = reEscape(symbol) + '(\\S*)' + reEscape(symbol);
		let init_selection = editor().selection;
		let word = getWordRange();
		let wordText = editor().document.getText(word);
		let match = wordText.match(new RegExp('^' + srx + '$'));
        if (match) {
			return editor().edit(async function(edit) {
				await edit.replace(word, match[1]);

				if (init_selection.isEmpty) {
					if (init_selection.end.isEqual(word.end)) {
						setPosition(init_selection.end.line, init_selection.end.character - (symbol.length * 2));
					} else {
						setPosition(init_selection.end.line, init_selection.end.character - symbol.length);
					}
				}
			} );
		}
		else {
			return editor().edit(async function(edit) {
				await edit.replace(word, symbol + wordText + symbol);

				if (init_selection.isEmpty) {
					if (init_selection.end.isEqual(word.end)) {
						setPosition(init_selection.end.line, init_selection.end.character + (symbol.length * 2));
					} else {
						setPosition(init_selection.end.line, init_selection.end.character + symbol.length);
					}
				}
			} );
		}
	}


	/** [ctrl+i]
	 *  Toggle the italic formatting
	 */
	function toggleItalic() {
		return toggleSurrounding(italicSymbol);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleItalic', toggleItalic));
	
	/** [ctrl+b]
	 *  Toggle the bold formatting
	 */
	function toggleBold() {
		return toggleSurrounding('**');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleBold', toggleBold));
	
	/** [ctrl+alt+s]
	 *  Toggle the striketrough formatting
	 */
	function toggleStrikethrough() {
		return toggleSurrounding('~~');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleStrikethrough', toggleStrikethrough));
	
	/** [ctrl+l]
	 *  Toggle the link formatting
	 */
	const srx_url = "((([A-Za-z]{3,9}:(?:\\/\\/)?)(?:[\\-;:&=\\+\\$,\w]+@)?[A-Za-z0-9\\.\\-]+|(?:www\\.|[\\-;:&=\\+\\$,\w]+@)[A-Za-z0-9\\.\\-]+)((?:\\/[\\+~%\\/\\.\\w\\-_]*)?\\??(?:[\\-\\+=&;%@\\.\w_]*)#?(?:[\\.\\!\\/\\\\\\w]*))?)";
	function toggleLink() {

		// # Patterns and behaviours :
		// > (§ is the expected position of the cursor after the operation)
		// -----------------------------
		// A. [abc](url) => do nothing
		// B. [abc]() => abc§  // abc can be an empty string
		// C. [](url) => <url>§
		// D. <url> => url§
		// E. url => [§](url)
		// F1. abc => [abc](§)     // if none url in the clipboard; abc can be an empty string
		// F2. abc => [abc](url)§  // if an url was found in the clipboard; abc can be an empty string

		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\((.*)\)/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /<(.+)>/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\[(.*)\]/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), new RegExp('^' + srx_url + '$'));
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\S+/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return selection();
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match;

		match = wordText.match(/^\[(.+)\]\((.+)\)$/);
		if (match) {
			if (cleverUnlink) {
				vscode.env.clipboard.writeText(match[2]).then();

				return editor().edit(async function(edit) {
					await edit.replace(word, match[1]);
					setPosition(position().line, word.start.character + match[1].length + 1);
				} );
			} else {
				return;
			}
		}

		match = wordText.match(/^\[(.*)\]\(\)$/);
		if (match) {
			// [title]() pattern
			return editor().edit(async function(edit) {
				await edit.replace(word, match[1]);
				setPosition(position().line, word.end.character - 1);
			} );
		}

		match = wordText.match(/^\[\]\((.+)\)$/);
		if (match) {
			// [](url) pattern
			return editor().edit(async function(edit) {
				edit.replace(word, '<' + match[1] + '>');
				setPosition(position().line, word.end.character);
			} );
		}

		match = wordText.match(/^\[(.*)\]\[(.+)\]$/);
		if (match) {
			// [abc][ref] pattern: ignore
			return
		}

		match = wordText.match(new RegExp('^<(' + srx_url + ')>$'));
		if (match) {
			// url already <url> formatted, remove the <>
			return editor().edit(async function(edit) {
				await edit.replace(word, match[1]);
				setPosition(position().line, word.end.character);
			} );
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'));
		if (match) {
			// unformatted url , apply the [](url) format
			return editor().edit(async function(edit) {
				await edit.replace(word, '[]('+wordText+')');
				setPosition(word.start.line, word.start.character + 1);
			} );
		}

		// non-url formatted word: apply the [title](url) format, with word as title
		if (autoPasteLinks) {
			return vscode.env.clipboard.readText().then((content) => {
				content = content.trim();
				if (content.match(new RegExp('^' + srx_url + '$'))) {
					return editor().edit(async function(edit) {
						await edit.replace(word, '['+wordText+'](' + content + ')');
						setPosition(word.end.line, word.end.character + wordText.length + content.length + 4);
						vscode.env.clipboard.writeText('');
					} );
				} else {
					return editor().edit(async function(edit) {
						await edit.replace(word, '['+wordText+']()');
						await setPosition(position().line, word.end.character + 3);
					});
				}
			})
		}

		return editor().edit(async function(edit) {
			await edit.replace(word, '['+wordText+']()');
			await setPosition(position().line, word.end.character + 3);
		});

	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleLink', toggleLink));
	
	/** [ctrl+num] Toggle the numeric-style link formatting to 'num' */
	function toggleNumRefLink(num) {
		// # Patterns and behaviours :
		// > (§ is the expected position of the cursor after the operation)
		// -----------------------------
		// A. [abc](url) => [abc][n]   (...)   [n]: url
		// B. [abc]() => [abc][n]
		// C. abc => [abc][n]
		// D. url => [][n] (...)  [n]: url
		// E1. [abc][n] => [abc](url) // if url is found at the bottom of the document under pattern '[n]: url'
		// E2. [abc][n] => [abc]() // if none url was found
		// > If the reference is automatically created (cases A and D): notify
		// > If the reference already exists: interrupt and notify

		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			let word;
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\((.*)\)/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /<(.+)>/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\[(.*)\]/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), new RegExp('^' + srx_url + '$'));
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		function retrieveUrl() {
			// attempt to retrieve a referenced url at the bottom of the document for the current number
			// return an empty string if none were found
			let rx;
			let linetext;
			let urlmatch;
			for (var i = 1; i <= 9; i++) {
				if (i >= editor().document.lineCount) {
					break;
				}
				rx = new RegExp('\\[' + num + '\\]:\\s?(.+)');
				linetext = editor().document.lineAt(editor().document.lineCount - i).text;
				urlmatch = linetext.match(rx);
				if (urlmatch) {
					return urlmatch[1];
				}
			}
			return '';
		}

		// let text = editor().document.getText();
		let word = getWordRange();
		let wordText = editor().document.getText(word);
		let match;
		let url;
		
		match = wordText.match(/^\[(.+)\]\((.+)\)$/);
		if (match) {
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					if (url == match[2]) {
						return editor().edit(async function(edit) {
							await edit.replace(word, '[' + match[1] + '][' + num + ']');
							setPosition(word.end.line, word.end.character - match[2].length + 1);
						} );
					} else {
						vscode.window.showErrorMessage('Another url is already referenced at [' + num + ']');
						return;
					}
				}
				return editor().edit(async function(edit) {
					let end_doc = editor().document.positionAt(editor().document.getText().length);
					await edit.replace(new vscode.Range(word.start, end_doc), 
					                   '[' + match[1] + '][' + num + ']' + editor().document.getText(new vscode.Range(word.end, end_doc)) + '\n[' + num + ']: ' + match[2]);
					setPosition(word.end.line, word.end.character - match[2].length + 1);
				} );
			} else {
				return;
			}
		}

		match = wordText.match(/^\[(.*)\]\(\)$/);
		if (match) {
			// [title]() pattern
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					return editor().edit(async function(edit) {
						await edit.replace(word, '[' + match[1] + '][' + num + ']');
						setPosition(word.start.line, word.start.character + 1);
					} );
				}
				return editor().edit(async function(edit) {
					let end_doc = editor().document.positionAt(editor().document.getText().length);
					await edit.replace(new vscode.Range(word.start, end_doc), 
					                   '[' + match[1] + '][' + num + ']' + editor().document.getText(new vscode.Range(word.end, end_doc)) + '\n[' + num + ']: ');
					setPosition(end_doc.line + 1, 5);
				} );
			}
			else {
				return editor().edit(async function(edit) {
					await edit.replace(word, '[' + match[1] + '][' + num + ']');
					setPosition(position().line, word.end.character - 1);
				} );
			}
		}

		match = wordText.match(/^\[\]\((.+)\)$/);
		if (match) {
			// [](url) pattern
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					if (url == match[1]) {
						return editor().edit(async function(edit) {
							await edit.replace(word, '[][' + num + ']');
							setPosition(word.start.line, word.start.character + 1);
						} );
					}
					else {
						vscode.window.showErrorMessage('A different url is already referenced at [' + num + ']');
						return;
					}
				}
			
				var end_pos = new vscode.Position(editor().document.lineCount, 0);
				return editor().edit(async function(edit) {
					await edit.replace(word, '[][' + num + ']');
					await edit.insert(end_pos, '\n[' + num + ']: ' + match[1]);
					setPosition(word.start.line, word.start.character + 1);
				} );
			}
			else {
				return;
			}
		}

		match = wordText.match(/^\[(.*)\]\[\d\]$/);
		if (match) {
			// [][ref] pattern, where ref is a one-digit number
			if (autoRef) {
				url = retrieveUrl();
				return editor().edit(async function(edit) {
					await edit.replace(word, '[' + match[1] + '](' + url + ')');
					setPosition(word.end.line, word.end.character + url.length);
				} );
			}
			else {
				return editor().edit(async function(edit) {
					edit.replace(word, '[' + match[1] + ']()');
				} );
			}
		}

		match = wordText.match(/^\[\]\[(.+)\]$/);
		if (match) {
			// [][ref] pattern, where ref is not a one-digit number
			return;
		}

		match = wordText.match(new RegExp('^<(' + srx_url + ')>$'));
		if (match) {
			// <url> pattern
			return;
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'));
		if (match) {
			// unformatted url
			return;
		}

		// non-url formatted word: apply the [title][num] format, with word as title
		return editor().edit(async function(edit) {
			await edit.replace(word, '['+wordText+'][' + num + ']');
			setPosition(word.end.line, word.end.character + 5);
		} );
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink1', (() => {return toggleNumRefLink(1);})));
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink2', (() => {return toggleNumRefLink(2);})));
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink3', (() => {return toggleNumRefLink(3);})));
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink4', (() => {return toggleNumRefLink(4);})));
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink5', (() => {return toggleNumRefLink(5);})));
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink6', (() => {return toggleNumRefLink(6);})));
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink7', (() => {return toggleNumRefLink(7);})));
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink8', (() => {return toggleNumRefLink(8);})));
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink9', (() => {return toggleNumRefLink(9);})));

	/** [ctrl+g]
	 *  Toggle the image-link formatting
	 */
	function toggleImageLink() {
		// # Patterns and behaviours :
		// > (§ is the expected position of the cursor after the operation)
		// -----------------------------
		// A. [abc](url) => ![abc](url)§
		// B. [abc]() => ![abc](§)
		// C. abc => ![abc](§)
		// D. url => ![§](url)
		// E. <url> => ![§](url)
		// F. ![abc](url) => [abc](url)§

		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /!\[(.*)\]\((.*)\)/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\((.*)\)/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /<(.+)>/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\[(.*)\]\[(.*)\]/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), new RegExp(srx_url));
			if (typeof(word) != 'undefined') {
				return word;
			}
			word = editor().document.getWordRangeAtPosition(position(), /\S+/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return selection();
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match;

		match = wordText.match(/^!(\[.*\]\(.*\)$)/);
		if (match) {
			vscode.env.clipboard.writeText(match[2]).then();
			return editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} ).then((b) => {
				setPosition(position().line, word.end.character + 1);
			});
		}

		match = wordText.match(/^\[(.*)\]\((.*)\)$/);
		if (match) {
			return editor().edit((edit) => {
				return edit.replace(word, '!' + wordText);
			} ).then((b) => {
				if (match[1].length > 0 && match[2].length > 0) {   // ![abc](url)
					setPosition(word.end.line, word.end.character + 1);
				} else if (match[1].length > 0) {   // ![abc]()
					setPosition(word.end.line, word.end.character);
				} else if (match[2].length > 0) {  // ![](url)
					setPosition(word.start.line, word.start.character + 2);
				}
			});
		}

		match = wordText.match(/^\[(.*)\]\[(.+)\]$/);
		if (match) {
			// [abc][ref] pattern: ignore
			return;
		}

		match = wordText.match(new RegExp('^<(' + srx_url + ')>$'));
		if (match) {
			// url already <url> formatted
			return editor().edit((edit) => {
				return edit.replace(word, '![](' + match[1] + ')');
			} ).then((b) => {
				setPosition(position().line, word.start.character + 2);
			});
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'));
		if (match) {
			// unformatted url
			return editor().edit((edit) => {
				return edit.replace(word, '![](' + match[1] + ')');
			} ).then((b) => {
				setPosition(position().line, word.start.character + 2);
			});
		}

		// non-url formatted word: apply the [title](url) format, with word as title
		return editor().edit((edit) => {
			return edit.replace(word, '!['+wordText+']()');
		} ).then((b) => {
			setPosition(position().line, word.end.character + 4);

			if (autoPasteLinks) {
				vscode.env.clipboard.readText().then((content)=>{
					content = content.trim();
					if (content.match(new RegExp('^' + srx_url + '$'))) {
						editor().edit((edit) => {
							return edit.insert(position(), content);
						} )
						setPosition(position().line, word.end.character + content.length + 5);
						vscode.env.clipboard.writeText('').then();
					}
				});
			}
		});
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleImageLink', toggleImageLink));
	
	/** [ctrl+q]
	 *  Toggle the blockquote formatting
	 */
	function toggleBlockquote() {
		var line = editor().document.lineAt(position().line);
		var rx = /(>\s?).*/;
		var match = line.text.match(rx);
		if (match) {
			return editor().edit((edit) => {
				return edit.delete(new vscode.Range(new vscode.Position(position().line, 0), new vscode.Position(position().line, match[1].length)));
			} ).then((b) => {
				setPosition(position().line, Math.min(0, position().character - match[1].length));
			});
		}
		else {
			return editor().edit((edit) => {
				return edit.insert(new vscode.Position(position().line, 0), '> ');
			} ).then((b) => {
				setPosition(position().line, position().character + 2);
			});
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleBlockquote', toggleBlockquote));
	
	/** [ctrl+r]
	 *  Insert an horizonthal rule at the next line
	 */
	function insertHRule() {
		var line = editor().document.lineAt(position().line);
		return editor().edit((edit) => {
			return edit.insert(new vscode.Position(position().line, line.text.length), '\n\n--------\n');
		} ).then((b) => {
			setPosition(position().line + 4, 0);
		});
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.insertHRule', insertHRule));
	
	/* prefix the lines in the current selection with 'prefix'
	> If the previous line and/or the next line are not empry, add linefeeds. */
	function prefixLines(callback, lookfor) {
		let sel = selection();
		let range = new vscode.Range(sel.start.line, 0, sel.end.line, editor().document.lineAt(sel.end.line).text.length)
		let selected_text = editor().document.getText(range);

		let rx = new RegExp('((?: *' + lookfor.source + ')(.*))+', 'gm');
		let match = selected_text.match(rx);
		if (match) {
			return editor().edit(async function(edit) {
				await edit.replace(range, selected_text.replace(/^\r?\n/g, '').replace(/\r?\n$/g, '')
													   .replace(new RegExp('^ *' + lookfor.source + ' ?', 'gm'), ''));
			});
		} else {
			let before = previousLineNotEmpty(sel.start) ? '\n' : '';
			let after = nextLineNotEmpty(range.end) ? '\n' : '';
			return editor().edit(async function(edit) {
				await edit.replace(range, before + selected_text.replace(/^(.+)/gm, callback) + after);
				editor().selection = new vscode.Selection(range.start, new vscode.Position(range.end.line + before.length + 1, 0))
			});
		}
	}

	/** [ctrl+k]
	 *  Toggle the codeblock formatting
	 */
	function toggleCodeblock() {
		// TODO: use the prefixLines() function
		var sel = selection();
		if (!sel.isEmpty) {
			var selected_text = editor().document.getText(sel);
			var match;

			match = selected_text.trim().match(/^`(.*)`$/);
			if (match) {
				return editor().edit((edit) => {
					edit.replace(sel, match[1]);
				});
			}

			match = selected_text.trim().match(/^```(.*)```$/m);
			if (match) {
				return editor().edit((edit) => {
					edit.replace(sel, match[1]);
				});
			}

			match = selected_text.match(/^((?: {4,}|\t)(.*))+$/m);
			if (match) {
				return editor().edit((edit) => {
					edit.replace(sel, selected_text.replace(/\t/g, '    ')
					                               .replace(/^\r?\n/g, '').replace(/\r?\n$/g, '')
												   .replace(/^ {4}(.*)$/gm, '$1')
												   );
				});
			}

			var selected_text = selected_text.trim();
			if (sel.isSingleLine) {
				var line = editor().document.lineAt(sel.start.line);

				if (sel.isEqual(line.range) || sel.isEqual(line.rangeIncludingLineBreak)) {
					// same line, whole line
					if (tabCodeBlock) {
						return editor().edit((edit) => {
							edit.replace(sel, '\n    ' + selected_text + '\n\n');
						});
					} else {
						return editor().edit((edit) => {
							edit.replace(sel, '```\n' + selected_text + '\n```\n');
						});
					}

				} else {
					// same line, part of the line
					return editor().edit((edit) => {
						edit.replace(sel, '`' + selected_text + '`');
					});
				}
			} else {
				if (tabCodeBlock) {
					return editor().edit((edit) => {
						edit.replace(sel, '\n    ' + selected_text.replace(/\n/g, '\n    ') + '\n\n');
					});
				} else {
					return editor().edit((edit) => {
						edit.replace(sel, '```\n' + selected_text + '\n```\n');
					});
				}
			}
		}
		else {
			var word = editor().document.getWordRangeAtPosition(position(), /`(\S*)`/);
			if (typeof(word) != 'undefined') {
				var wordText = editor().document.getText(word);
				match = wordText.match(/`(\S*)`/);
				return editor().edit(async function(edit) {
					await edit.replace(word, match[1]);
				} );
			}
			else {
				return editor().edit(async function(edit) {
					await edit.insert(sel.start, '``');
					setPosition(sel.start.line, sel.start.character + 1);
				});
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleCodeblock', toggleCodeblock));
	
	/** [ctrl+u]
	 *  Toggle the unordered-list formatting
	 */
	function toggleUList() {
		return prefixLines(((lineText) => uListSymbol + ' ' + lineText), /[\*+-]/);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleUList', toggleUList));
	
	/** [ctrl+o]
	 *  Toggle the ordered-list formatting
	 */
	function toggleOList() {
		let i = 1;
		return prefixLines(((lineText) => i++ + '. ' + lineText), /\d\./);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleOList', toggleOList));
	
	/** [alt+x]
	 *  Toggle the check-list formatting
	 */
	function toggleChecklist() {
		return prefixLines(((lineText) => '[ ] ' + lineText), /\[[x ]\]/);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleChecklist', toggleChecklist));

	/** [alt+c]
	 *  Check or uncheck the current line of a check-list
	 */
	function check() {
		var line = editor().document.lineAt(position().line);
		var match = line.text.match(/^( +)\[([x ])\]( +.*)/);
		if (match) {
			if (match[2] == ' ') {
				return editor().edit(async function(edit) {
					await edit.replace(line.range, match[1] + '[x]' + match[3]);
					setPosition(line.lineNumber, line.text.length)
				});
			}
			else if (match[2] == 'x') {
				return editor().edit(async function(edit) {
					await edit.replace(line.range, match[1] + '[ ]' + match[3]);
					setPosition(line.lineNumber, line.text.length)
				});
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.check', check));

	/** [ctrl+t t]
	 *  Insert a table or format the current selection to a table
	 */
	function insertTable() {
		var sel = selection();
		if (!sel.isEmpty) {
			var selectedText = editor().document.getText(sel).trim();
			if (sel.isSingleLine) {
				var columns = selectedText.split(new RegExp('[' + csvSeparators + ']'));
				columns =columns.concat(new Array(Math.max(0, (3 - columns.length))).fill('   '));

				var rowmodel = new Array(columns.length);
				return editor().edit(async function(edit) {
					await edit.replace(sel, '| ' + columns.join(' | ') + ' |\n' +
									  '|' + rowmodel.fill(' ----- ').join('|') + '|\n' + 
									  '|' + rowmodel.fill('   ').join('|') + '|\n' + 
									  '|' + rowmodel.fill('   ').join('|') + '|\n');
					editor().selection = new vscode.Selection(sel.start, new vscode.Position(sel.start.line + 4, 0))
				});
			}
			else {
				var lines = new Array(0);
				var lineArr;
				var line = editor().document.lineAt(sel.start.line);

				lineArr = line.text.split(new RegExp('[' + csvSeparators + ']'));
				lineArr = lineArr.concat(new Array(Math.max(0, (3 - lineArr.length))).fill('   '));
				lines.push(lineArr);

				lineArr = new Array(lines[0].length).fill('-----');
				lines.push(lineArr);

				for (var i=sel.start.line+1; i<=sel.end.line;i++) {
					line = editor().document.lineAt(i);
					lineArr = line.text.split(new RegExp('[' + csvSeparators + ']'));
					lineArr = lineArr.concat(new Array(Math.max(0, (lines[0].length - lineArr.length))).fill('   '));
					lines.push(lineArr);
				}

				return editor().edit(async function(edit) {
					await edit.replace(sel, lines.map((row) => '| ' + row.join(' | ') + ' |').join('\n') + '\n');
				});
			}
		}
		else{
			// no selection, an empty table is inserted
			return editor().edit(async function(edit) {
				await edit.replace(sel, '\n|   |   |\n| ----- | ----- |\n|   |   |\n|   |   |\n');
				editor().selection = new vscode.Selection(sel.start, new vscode.Position(sel.start.line + 5, 0))
			});
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.insertTable', insertTable));
	
	/** [ctrl+t right]
	 *  Add a column to the current table
	 */
	function tableAddCol() {
		var pos = position();
		var line = editor().document.lineAt(pos.line);
		var rx = /\|(.*\|)+/;
		if (!line.text.match(rx)) {
			return
		}
		var startLine = pos.line;
		var endLine = pos.line;

		for (var i=pos.line - 1;i>=0;i--) {
			var line = editor().document.lineAt(i);
			if (!line.text.match(rx)) {
				break;
			}
			startLine = i;
		}

		for (var i=pos.line + 1;i<=editor().document.lineCount - 1;i++) {
			var line = editor().document.lineAt(i);
			if (!line.text.match(rx)) {
				break;
			}
			endLine = i;
		}
		// a proper md table should have at least three rows
		if ((endLine - startLine) < 3) {
			return;
		}

		let range = new vscode.Range(startLine, 0, endLine + 1, 0);
		let content = editor().document.getText(range);
		content = content.replace(/(.+)$/mg, function(line) {
													return line.match(/\|( ----- \|)+/) ? line + ' ----- |' : line + '   |';
												})

		return editor().edit((edit) => {
			edit.replace(range, content);
		});
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.tableAddCol', tableAddCol));
	
	/** [ctrl+t down]
	 *  Append a row at the end of the current table
	 */
	function tableAddRow() {
		var pos = position();
		var line = editor().document.lineAt(pos.line);
		var rx = /\|(.*\|)+/;
		if (!line.text.match(rx)) {
			return;
		}
		var endLine = pos.line;
		for (var i=pos.line + 1;i<=editor().document.lineCount - 1;i++) {
			line = editor().document.lineAt(i);
			if (!line.text.match(rx)) {
				break;
			}
			endLine = i;
		}

		line = editor().document.lineAt(endLine);
		var nbCols = line.text.split('|').length - 1;

		return editor().edit((edit) => {
			edit.insert(new vscode.Position(endLine + 1, 0), '\n|' + new Array(nbCols).join('   |') + '\n');
		});
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.tableAddRow', tableAddRow));
	
}
exports.activate = activate;


/** Called when FullMd is deactiated */
function deactivate() {}

module.exports = {
	activate,
	deactivate,
	reEscape,
	mdEscape
}
