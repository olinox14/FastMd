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
	const cleverUnlink = true;    // allows to unlink a [title](url) with ctrl+l; the url is written to the clipboard
	const autoPasteLinks = true;    // an url found the clipboard is automatically pasted when a word is formatted with ctrl+l
	const autoRef = true;         // Move the url at the bottom of the document when numeric link reference formatting is applied
	const tabCodeBlock = true;     // block of code are formatted with tab pattern (instead of ```code```)
	const csvSeparators = ';\t|';  // symbols recognized as csv separators when inserting a table

	// *** Shorthands

	/** return the current text editor */
	function editor() { return vscode.window.activeTextEditor }
	
	/** return the current selection */
	function selection() { return editor().selection }

	/** return the current position */
	function position() { return selection().active }
	// set a new position for the cursor
	
	/** set a new position */
	function setPosition(l, c) {
		var newPosition = position().with(l, c);
        var newSelection = new vscode.Selection(newPosition, newPosition);
		editor().selection = newSelection;
		return newPosition;
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
			} )
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
			} )
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
	
	/** [ctrl+i]
	 *  Toggle the italic formatting
	 */
	function toggleItalic() {
		var srx = reEscape(italicSymbol) + '(\\S*)' + reEscape(italicSymbol);

		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			
			word = editor().document.getWordRangeAtPosition(position(), new RegExp(srx));
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match = wordText.match(new RegExp('^' + srx + '$'));
        if (match) {
			return editor().edit((edit) => {
				edit.replace(word, match[1]);
			} ).then((b) => {
				setPosition(position().line, position().character);
			})
		}
		else {
			return editor().edit((edit) => {
				edit.replace(word, italicSymbol + wordText + italicSymbol);
			} ).then((b) => {
				setPosition(position().line, position().character);
			});
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleItalic', toggleItalic));
	
	/** [ctrl+b]
	 *  Toggle the bold formatting
	 */
	function toggleBold() {
		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /\*\*(\S*)\*\*/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match = wordText.match(/^\*\*(\S*)\*\*$/)
        if (match) {
			return editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} ).then((b) => {
				setPosition(position().line, position().character - 2);
			});
		}
		else {
			return editor().edit((edit) => {
				return edit.replace(word, '**' + wordText + '**');
			} ).then((b) => {
				if (position().line == word.end.line && position().character == word.end.character) {
					setPosition(position().line, position().character + 4);
				}
				else {
					setPosition(position().line, position().character + 2);
				}
			});
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleBold', toggleBold));
	
	/** [ctrl+alt+s]
	 *  Toggle the striketrough formatting
	 */
	function toggleStrikethrough() {
		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /~~(\S*)~~/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match = wordText.match(/^~~(\S*)~~$/)
        if (match) {
			return editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} ).then((b) => {
				setPosition(position().line, position().character - 2);
			});
		}
		else {
			return editor().edit((edit) => {
				return edit.replace(word, '~~' + wordText + '~~');
			} ).then((b) => {
				if (position().line == word.end.line && position().character == word.end.character) {
					setPosition(position().line, position().character + 4);
				}
				else {
					setPosition(position().line, position().character + 2);
				}
			});
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleStrikethrough', toggleStrikethrough));
	
	/** [ctrl+l]
	 *  Toggle the link formatting
	 */
	const srx_url = "((([A-Za-z]{3,9}:(?:\\/\\/)?)(?:[\\-;:&=\\+\\$,\w]+@)?[A-Za-z0-9\\.\\-]+|(?:www\\.|[\\-;:&=\\+\\$,\w]+@)[A-Za-z0-9\\.\\-]+)((?:\\/[\\+~%\\/\\.\\w\\-_]*)?\\??(?:[\\-\\+=&;%@\\.\w_]*)#?(?:[\\.\\!\\/\\\\\\w]*))?)";
	function toggleLink() {

		// # Patterns and behaviours :
		// > (% is the expected position of the cursor after the operation)
		// -----------------------------
		// A. [abc](url) => do nothing
		// B. [abc]() => abc%  // abc can be an empty string
		// C. [](url) => <url>%
		// D. <url> => url%
		// E. url => [%](url)
		// F1. abc => [abc](%)     // if none url in the clipboard; abc can be an empty string
		// F2. abc => [abc](url)%  // if an url was found in the clipboard; abc can be an empty string

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

		var word = getWordRange()
		var wordText = editor().document.getText(word);
		var match;

		match = wordText.match(/^\[(.+)\]\((.+)\)$/);
		if (match) {
			if (cleverUnlink) {
				vscode.env.clipboard.writeText(match[2]).then();

				return editor().edit((edit) => {
					return edit.replace(word, match[1]);
				} ).then((b) => {
					setPosition(position().line, word.start.character + match[1].length + 1);
				});
			} else {
				return;
			}
		}

		match = wordText.match(/^\[(.*)\]\(\)$/);
		if (match) {
			// [title]() pattern
			return editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} ).then((b) => {
				setPosition(position().line, word.end.character - 1);
			});
		}

		match = wordText.match(/^\[\]\((.+)\)$/);
		if (match) {
			// [](url) pattern
			return editor().edit((edit) => {
				return edit.replace(word, '<' + match[1] + '>');
			} ).then((b) => {
				setPosition(position().line, word.end.character);
			});
		}

		match = wordText.match(/^\[(.*)\]\[(.+)\]$/);
		if (match) {
			// [abc][ref] pattern: ignore
			return
		}

		match = wordText.match(new RegExp('^<(' + srx_url + ')>$'));
		if (match) {
			// url already <url> formatted, remove the <>
			editor().edit((edit) => {
				return edit.replace(word, match[1])
			} ).then((b) => {
				setPosition(position().line, word.end.character);
			});
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'))
		if (match) {
			// unformatted url , apply the [](url) format
			editor().edit((edit) => {
				return edit.replace(word, '[]('+wordText+')');
			} ).then((b) => {
				setPosition(position().line, word.end.character + 1);
			});
		}

		// non-url formatted word: apply the [title](url) format, with word as title
		return editor().edit((edit) => {
			return edit.replace(word, '['+wordText+']()');
		} ).then((b) => {
			setPosition(position().line, word.end.character + 3);

			if (autoPasteLinks) {
				vscode.env.clipboard.readText().then((content)=>{
					content = content.trim();
					if (content.match(new RegExp('^' + srx_url + '$'))) {
						editor().edit((edit) => {
							return edit.insert(position(), content);
						} )
						setPosition(position().line, word.end.character + content.length + 4);
						vscode.env.clipboard.writeText('').then();
					}
				});
			}
		});
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleLink', toggleLink));
	
	/** Toggle the numeric-style link formatting to 'num' */
	function toggleNumRefLink(num) {
		// # Patterns and behaviours :
		// > (% is the expected position of the cursor after the operation)
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
			var rx;
			var linetext;
			var urlmatch;
			for (var i = 1; i <= 9; i++) {
				rx = new RegExp('\\[' + num + '\\]:\\s?(.+)');
				linetext = editor().document.lineAt(editor().document.lineCount - i).text;
				urlmatch = linetext.match(rx);
				if (urlmatch) {
					return urlmatch[1];
				}
			}
			return '';
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match;
		var url;
		
		match = wordText.match(/^\[(.+)\]\((.+)\)$/);
		if (match) {
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					if (url == match[2]) {
						return editor().edit((edit) => {
							return edit.replace(word, '[' + match[1] + '][' + num + ']');
						} ).then((b) => {
							setPosition(word.start.line, word.end.character + 1);
						});
					} else {
						vscode.window.showErrorMessage('Another url is already referenced at [' + num + ']');
						return;
					}
				}
				return editor().edit((edit) => {
					edit.replace(word, '[' + match[1] + '][' + num + ']');
					return edit.insert(new vscode.Position(editor().document.lineCount, 0), '\n[' + num + ']: ' + match[2]);
				} ).then((b) => {
					setPosition(word.end.line, word.end.character - match[2].length)
				});
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
					return neditor().edit((edit) => {
						return edit.replace(word, '[' + match[1] + '][' + num + ']');
					} ).then((b) => {
						setPosition(word.start.line, word.start.character + 1);
					});
				}
				var end_pos = new vscode.Position(editor().document.lineCount, 0);
				return editor().edit((edit) => {
					edit.replace(word, '[' + match[1] + '][' + num + ']');
					return edit.insert(end_pos, '\n[' + num + ']: ');
				} ).then((b) => {
					setPosition(end_pos.line + 1, 5);
				});
			}
			else {
				return editor().edit((edit) => {
					return edit.replace(word, '[' + match[1] + '][' + num + ']');
				} ).then((b) => {
					setPosition(position().line, word.end.character - 1);
				});
			}
		}

		match = wordText.match(/^\[\]\((.+)\)$/);
		if (match) {
			// [](url) pattern
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					if (url == match[1]) {
						return editor().edit((edit) => {
							return edit.replace(word, '[][' + num + ']');
						} ).then((b) => {
							setPosition(word.start.line, word.start.character + 1)
						});
					}
					else {
						vscode.window.showErrorMessage('A different url is already referenced at [' + num + ']');
						return;
					}
				}
			
				var end_pos = new vscode.Position(editor().document.lineCount, 0)
				return editor().edit((edit) => {
					edit.replace(word, '[][' + num + ']');
					return edit.insert(end_pos, '\n[' + num + ']: ' + match[1]);
				} ).then((b) => {
					setPosition(word.start.line, word.start.character + 1)
				});
			}
			else {
				return
			}
		}

		match = wordText.match(/^\[(.*)\]\[\d\]$/);
		if (match) {
			// [][ref] pattern, where ref is a one-digit number
			if (autoRef) {
				url = retrieveUrl();
				editor().edit((edit) => {
					return edit.replace(word, '[' + match[1] + '](' + url + ')');
				} ).then((b) => {
					setPosition(word.end.line, word.end.character + url.length)
				});
			}
			else {
				return editor().edit((edit) => {
					return edit.replace(word, '[' + match[1] + ']()');
				} )
			}
		}

		match = wordText.match(/^\[\]\[(.+)\]$/);
		if (match) {
			// [][ref] pattern, where ref is not a one-digit number
			return
		}

		match = wordText.match(new RegExp('^<(' + srx_url + ')>$'));
		if (match) {
			// <url> pattern
			return
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'))
		if (match) {
			// unformatted url
			return
		}

		// non-url formatted word: apply the [title][num] format, with word as title
		return editor().edit((edit) => {
			return edit.replace(word, '['+wordText+'][' + num + ']');
		} ).then((b) => {
			setPosition(position().line, word.end.character + 3);

			if (autoPasteLinks) {
			}
		});

	}
	
	/** [ctrl+1] Toggle the numeric-style link formatting with index 1 */
	function toggleNumRefLink1() { toggleNumRefLink(1); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink1', toggleNumRefLink1));

	/** [ctrl+2] Toggle the numeric-style link formatting with index 2 */
	function toggleNumRefLink2() { toggleNumRefLink(2); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink2', toggleNumRefLink2));

	/** [ctrl+3] Toggle the numeric-style link formatting with index 3 */
	function toggleNumRefLink3() { toggleNumRefLink(3); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink3', toggleNumRefLink3));

	/** [ctrl+4] Toggle the numeric-style link formatting with index 4 */
	function toggleNumRefLink4() { toggleNumRefLink(4); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink4', toggleNumRefLink4));

	/** [ctrl+5] Toggle the numeric-style link formatting with index 5 */
	function toggleNumRefLink5() { toggleNumRefLink(5); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink5', toggleNumRefLink5));

	/** [ctrl+6] Toggle the numeric-style link formatting with index 6 */
	function toggleNumRefLink6() { toggleNumRefLink(6); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink6', toggleNumRefLink6));

	/** [ctrl+7] Toggle the numeric-style link formatting with index 7 */
	function toggleNumRefLink7() { toggleNumRefLink(7); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink7', toggleNumRefLink7));

	/** [ctrl+8] Toggle the numeric-style link formatting with index 8 */
	function toggleNumRefLink8() { toggleNumRefLink(8); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink8', toggleNumRefLink8));

	/** [ctrl+9] Toggle the numeric-style link formatting with index 9 */
	function toggleNumRefLink9() { toggleNumRefLink(9); }
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleNumRefLink9', toggleNumRefLink9));

	/** [ctrl+g]
	 *  Toggle the image-link formatting
	 */
	function toggleImageLink() {
		// # Patterns and behaviours :
		// > (% is the expected position of the cursor after the operation)
		// -----------------------------
		// A. [abc](url) => ![abc](url)%
		// B. [abc]() => ![abc](%)
		// C. abc => ![abc](%)
		// D. url => ![%](url)
		// E. <url> => ![%](url)
		// F. ![abc](url) => [abc](url)%

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

		var word = getWordRange()
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
				if (match[1].length > 0) {
					setPosition(position().line, word.end.character + 1);
				}
				else {
					setPosition(position().line, word.start.character + 2);
				}
			});
		}

		match = wordText.match(/^\[(.*)\]\[(.+)\]$/);
		if (match) {
			// [abc][ref] pattern: ignore
			return
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
			return edit.insert(new vscode.Position(position().line, line.text.length), '\n\n--------\n')
		} ).then((b) => {
			setPosition(position().line + 4, 0);
		});
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.insertHRule', insertHRule));
	
	/** [ctrl+k]
	 *  Toggle the codeblock formatting
	 */
	function toggleCodeblock() {
		var sel = selection();
		if (!sel.isEmpty) {
			var selected_text = editor().document.getText(sel)
			var match;

			match = selected_text.trim().match(/^`(.*)`$/);
			if (match) {
				return editor().edit((edit) => {
					edit.replace(sel, match[1]);
				})
			}

			match = selected_text.trim().match(/^```(.*)```$/m);
			if (match) {
				return editor().edit((edit) => {
					edit.replace(sel, match[1]);
				})
			}

			match = selected_text.match(/^((?: {4,}|\t)(.*))+$/m);
			if (match) {
				return editor().edit((edit) => {
					edit.replace(sel, selected_text.trim().replace('\n    ', '\n').replace('\n\t', '\n'));
				})
			}

			var selected_text = selected_text.trim()

			if (sel.isSingleLine) {

				var line = editor().document.lineAt(sel.start.line);

				if (sel.isEqual(line.range) || sel.isEqual(line.rangeIncludingLineBreak)) {
					// same line, whole line
					if (tabCodeBlock) {
						return editor().edit((edit) => {
							edit.replace(sel, '\n    ' + selected_text + '\n\n');
						})
					} else {
						return editor().edit((edit) => {
							edit.replace(sel, '```' + selected_text + '```');
						})
					}

				} else {
					// same line, part of the line
					return editor().edit((edit) => {
						edit.replace(sel, '`' + selected_text + '`');
					})
				}
			} else {
				if (tabCodeBlock) {
					return editor().edit((edit) => {
						edit.replace(sel, '\n    ' + selected_text.replace('\n', '\n    ') + '\n\n');
					})
				} else {
					return editor().edit((edit) => {
						edit.replace(sel, '```' + selected_text + '```');
					})
				}
			}
		}
		else {
			var word = editor().document.getWordRangeAtPosition(position(), /^`(.*)`$/);
			if (typeof(word) != 'undefined') {
				var wordText = editor().document.getText(word)
				match = wordText.match(/^`(.*)`$/);
				return editor().edit((edit) => {
					return edit.replace(word, match[1]);
				} )
			}
			else {
				return editor().edit((edit) => {
					return edit.insert(position(), '``');
				} ).then((b) => {
					setPosition(position().line, position().character + 1);
				});
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleCodeblock', toggleCodeblock));
	
	/** [ctrl+u]
	 *  Toggle the unordered-list formatting
	 */
	function toggleUList() {
		var sel = selection();
		var selected_text = editor().document.getText(sel).trim();

		var match = selected_text.match(/((?: ?[\*+-] ?)(.*))+/m)
		if (match) {
			return editor().edit((edit) => {
				edit.replace(sel, selected_text.replace(/^ ?[\*+-] ?/m, '').replace(/\n ?[\*+-] ?/m, '\n'));
			})
		} else {
			return editor().edit((edit) => {
				edit.replace(sel, '\n ' + uListSymbol + ' ' + selected_text.replace('\n', '\n ' + uListSymbol + ' ') + '\n\n');
			})
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleUList', toggleUList));
	
	/** [ctrl+o]
	 *  Toggle the ordered-list formatting
	 */
	function toggleOList() {
		var sel = selection();
		var selected_text = editor().document.getText(sel).trim();

		var match = selected_text.match(/((?: ?\d\. ?)(.*))+/m)
		if (match) {
			return editor().edit((edit) => {
				edit.replace(sel, selected_text.replace(/^ ?\d\. ?/m, '').replace(/\n ?\d\. ?/m, '\n'));
			})
		} else {
			var listArr = new Array(0);
			var line;

			// allow to skip a line at the start of the block if the previous line is not empty
			var prefix = '';
			if(sel.start.character > 0 || (sel.start.line > 0 && (!editor().document.lineAt(sel.start.line - 1).isEmptyOrWhitespace))) {
				prefix = '\n';
			}

			for (var i=0;i<=(sel.end.line-sel.start.line);i++) {
				line = editor().document.lineAt(sel.start.line+i);
				listArr.push(' ' + (i + 1) + '. ' + line.text)
			}

			return editor().edit((edit) => {
				edit.replace(sel, prefix + listArr.join('\n') + '\n');
			})

		}

		
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleOList', toggleOList));
	
	/** [alt+x]
	 *  Toggle the check-list formatting
	 */
	function toggleChecklist() {
		var sel = selection();
		var selected_text = editor().document.getText(sel).trim();

		var match = selected_text.match(/((?: ?\[[x ]\] ?)(.*))+/m);
		if (match) {
			return editor().edit((edit) => {
				edit.replace(sel, selected_text.replace(/^ ?\[[x ]\] ?/m, '').replace(/\n ?\[[x ]\] ?/m, '\n'));
			});
		} else {
			return editor().edit((edit) => {
				edit.replace(sel, '\n [ ] ' + selected_text.replace('\n', '\n [ ] ') + '\n\n');
			});
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.toggleChecklist', toggleChecklist));

	/** [alt+c]
	 *  Check or uncheck the current line of a check-list
	 */
	function check() {
		var line = editor().document.lineAt(position().line);
		var match = line.text.match(/^( +)\[([x ])\]( +)(.*)/);
		if (match) {
			if (match[2] == ' ') {
				return editor().edit((edit) => {
					edit.replace(line.range, match[1] + '[x]' + match[3] + match[4]);
				})
			}
			else if (match[2] == 'x') {
				return editor().edit((edit) => {
					edit.replace(line.range, match[1] + '[ ]' + match[3] + match[4]);
				})
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fullmd.check', check));

	/** [ctrl+t t]
	 *  Insert a table or format the current selection to a table
	 */
	function insertTable() {
		var sel = selection()
		if (!sel.isEmpty) {
			var selectedText = editor().document.getText(sel).trim();
			if (sel.isSingleLine) {
				var columns = selectedText.split(new RegExp('[' + csvSeparators + ']'));
				columns =columns.concat(new Array(Math.max(0, (3 - columns.length))).fill('   '));

				var rowmodel = new Array(columns.length);
				return editor().edit((edit) => {
					edit.replace(sel, '|' + columns.join(' | ') + 
									  '|\n|' + rowmodel.fill(' ------ ').join('|') + 
									  '|\n|' + rowmodel.fill('   ').join('|') + 
									  '|\n|' + rowmodel.fill('   ').join('|') + '|\n');
				})
			}
			else {
				var lines = new Array(0)
				var lineArr;
				var line = editor().document.lineAt(sel.start.line);

				lineArr = line.text.split(new RegExp('[' + csvSeparators + ']'));
				lineArr = lineArr.concat(new Array(Math.max(0, (3 - lineArr.length))).fill('   '));
				lines.push(lineArr)

				lineArr = new Array(lines[0].length).fill('------')
				lines.push(lineArr)

				for (var i=sel.start.line+1; i<=sel.end.line;i++) {
					line = editor().document.lineAt(i);
					lineArr = line.text.split(new RegExp('[' + csvSeparators + ']'));
					lineArr = lineArr.concat(new Array(Math.max(0, (lines[0].length - lineArr.length))).fill('   '));
					lines.push(lineArr);
				}

				return editor().edit((edit) => {
					edit.replace(sel, lines.map((row) => '| ' + row.join(' | ') + ' |').join('\n') + '\n');
				})

			}
		}
		else{
			// no selection, an empty table is inserted
			return editor().edit((edit) => {
				edit.replace(sel, '\n|   |   |\n| ----- | ----- |\n|   |   |\n|   |   |\n');
			}).then((b) => {
				setPosition(sel.start.line + 1, sel.start.character + 2);
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

		if ((endLine - startLine) < 3) {
			return
		}

		var headerText = editor().document.getText(new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(startLine + 1, 0)));
		headerText = headerText.replace(/(\r?\n)/g, '   |$&');
		var sepsText = editor().document.getText(new vscode.Range(new vscode.Position(startLine + 1, 0), new vscode.Position(startLine + 2, 0)));
		sepsText = sepsText.replace(/(\r?\n)/g, ' ------ |$&');
		var contentText = editor().document.getText(new vscode.Range(new vscode.Position(startLine + 2, 0), new vscode.Position(endLine + 1, 0)));
		contentText = contentText.replace(/(\r?\n)/g, '   |$&');

		return editor().edit((edit) => {
			edit.replace(new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(endLine + 1, 0)), headerText + sepsText + contentText);
		})
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
			return
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
		var nbCols = line.text.split('|').length - 1

		return editor().edit((edit) => {
			edit.insert(new vscode.Position(endLine + 1, 0), '|' + new Array(nbCols).join('   |') + '\n');
		})
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
