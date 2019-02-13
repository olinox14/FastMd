// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
 
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	const italicSymbol = '*';
	const uListSymbol = '*';
	const cleverUnlink = true;  // allows to unlink a [title](url) with ctrl+l; the url is written to the clipboard
	const autoPasteLinks = true; // an url found the clipboard is automatically pasted when a word is formatted with ctrl+l
	const autoRef = true; // Move the url at the bottom of the document when numeric link reference formatting is applied
	const tabCodeBlock = true;  // block of code are formatted with tab pattern (instead of ```code```)
	const csvSeparators = ';\t|';

	// return the current text editor
	function editor() { return vscode.window.activeTextEditor }
	// return the current selection
	function selection() { return editor().selection }
	// return the current selected text
	function selectedText() { return editor().document.getText(selection()) }
	// return the current position of the cursor
	function position() { return selection().active }
	// set a new position for the cursor
	function setPosition(l, c) {
		var newPosition = position().with(l, c);
        var newSelection = new vscode.Selection(newPosition, newPosition);
		editor().selection = newSelection;
		return newPosition;
	}
	// move the current position for the cursor
	function movePosition(dl, dc) {
		var pos = position();
		return setPosition(Math.max(pos.line+dl, 0), Math.max(pos.character+dc, 0));
	}

	function extendedSelection(pattern) {
		var range = editor().document.getWordRangeAtPosition(selection().active, pattern);
		return range == null ? null : new vscode.Selection(range.start, range.end);
	}

	function extendSelection(pattern) {
		var newSel = extendedSelection(pattern);
		if (newSel) {
			editor().selection = newSel; 
		}
	}

	function extendSelectionIfNone(pattern) {
		if (selection().isEmpty) {
			return extendSelection(pattern);
		}
		return selection();
	}

	// return the text with special characters regex escaped 
	function reEscape(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}

	// return the text with special characters markdown escaped
	function mdEscape(text) {
		return text.replace(/[-[\]{}()*+.\\#`_!]/g, '\\$&');
	}

	// ctrl+enter
	function addLinebreak() {
		editor().edit((edit) => {
			edit.insert(selection().end, '  \n');
		} )
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.addLinebreak', addLinebreak));

	// ctrl+/
	// auto-escape on formatted text?
	function escape() {
		return editor().edit(edit => edit.replace(selection(), (() => mdEscape(selectedText()))()));
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.escape', escape));

	// ctrl+h
	function headerUp() {
		var line = editor().document.lineAt(position().line);
		if (!line.text.startsWith('#####')){
			editor().edit((edit) => {
				return edit.insert(new vscode.Position(position().line, 0), (line.text.startsWith('#') ? '#' : '# '));
			} )
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.headerUp', headerUp));

	// ctrl+shift+h
	function headerDown() {
		var line = editor().document.lineAt(position().line);
		if (line.text.startsWith('#')){
			editor().edit((edit) => {
				return edit.delete(new vscode.Range(new vscode.Position(position().line, 0), 
								                    new vscode.Position(position().line, (line.text.startsWith('# ') ? 2 : 1))));
			} )
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.headerDown', headerDown));
	
	function setHeader(level) {
		var line = editor().document.lineAt(position().line);
		editor().edit((edit) => {
			return edit.replace(new vscode.Range(new vscode.Position(position().line, 0), 
												 new vscode.Position(position().line, 
												                     line.text.search(/[^\s#]/))), 
								'#'.repeat(level) + ' ');
		});
	}

	// ctrl+shift+1
	function setH1() {
		setHeader(1);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH1', setH1));
	
	// ctrl+shift+2
	function setH2() {
		setHeader(2);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH2', setH2));
	
	// ctrl+shift+3
	function setH3() {
		setHeader(3);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH3', setH3));
	
	// ctrl+shift+4
	function setH4() {
		setHeader(4);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH4', setH4));
	
	// ctrl+shift+5
	function setH5() {
		setHeader(5);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH5', setH5));
	
	// ctrl+i
	function toggleItalic() {
		// permettre de choisir le symbole dans les params
		function getWordRange() {
			if (!selection().isEmpty) {
				return selection();
			}
			word = editor().document.getWordRangeAtPosition(position(), /\*(\S*)\*/);
			if (typeof(word) != 'undefined') {
				return word;
			}
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		var word = getWordRange();
		var wordText = editor().document.getText(word);
		var match = wordText.match(/^\*(\S*)\*$/)
        if (match) {
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, position().character - 1);
		}
		else {
			editor().edit((edit) => {
				return edit.replace(word, '*' + wordText + '*');
			} )
			if (position().line == word.end.line && position().character == word.end.character) {
				setPosition(position().line, position().character + 2);
			}
			else {
				setPosition(position().line, position().character + 1);
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleItalic', toggleItalic));
	
	// ctrl+b
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
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, position().character - 2);
		}
		else {
			editor().edit((edit) => {
				return edit.replace(word, '**' + wordText + '**');
			} )
			if (position().line == word.end.line && position().character == word.end.character) {
				setPosition(position().line, position().character + 4);
			}
			else {
				setPosition(position().line, position().character + 2);
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleBold', toggleBold));
	
	// ctrl+alt+s
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
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, position().character - 2);
		}
		else {
			editor().edit((edit) => {
				return edit.replace(word, '~~' + wordText + '~~');
			} )
			if (position().line == word.end.line && position().character == word.end.character) {
				setPosition(position().line, position().character + 4);
			}
			else {
				setPosition(position().line, position().character + 2);
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleStrikethrough', toggleStrikethrough));
	
	// ctrl+l
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
				editor().edit((edit) => {
					return edit.replace(word, match[1]);
				} )
				setPosition(position().line, word.start.character + match[1].length + 1);
				return
			} else {
				return;
			}
		}

		match = wordText.match(/^\[(.*)\]\(\)$/);
		if (match) {
			// [title]() pattern
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, word.end.character - 1)
			return
		}

		match = wordText.match(/^\[\]\((.+)\)$/);
		if (match) {
			// [](url) pattern
			editor().edit((edit) => {
				return edit.replace(word, '<' + match[1] + '>');
			} )
			setPosition(position().line, word.end.character)
			return
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
			} )
			setPosition(position().line, word.end.character)
			return
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'))
		if (match) {
			// unformatted url , apply the [](url) format
			editor().edit((edit) => {
				return edit.replace(word, '[]('+wordText+')');
			} )
			setPosition(position().line, word.start.character + 1)
			return
		}

		// non-url formatted word: apply the [title](url) format, with word as title
		editor().edit((edit) => {
			return edit.replace(word, '['+wordText+']()');
		} )
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
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleLink', toggleLink));
	
	// ctrl+num
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
						editor().edit((edit) => {
							return edit.replace(word, '[' + match[1] + '][' + num + ']');
						} )
						setPosition(word.start.line, word.start.character + 1)
						return
					}
					else {
						vscode.window.showErrorMessage('Another url is already referenced at [' + num + ']');
						return;
					}
				}
				editor().edit((edit) => {
					edit.replace(word, '[' + match[1] + '][' + num + ']');
					return edit.insert(new vscode.Position(editor().document.lineCount, 0), '\n[' + num + ']: ' + match[2]);
				} )
				setPosition(word.end.line, word.end.character - match[2].length)
				return
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
					editor().edit((edit) => {
						return edit.replace(word, '[' + match[1] + '][' + num + ']');
					} )
					setPosition(word.start.line, word.start.character + 1)
					return
				}
				var end_pos = new vscode.Position(editor().document.lineCount, 0)
				editor().edit((edit) => {
					edit.replace(word, '[' + match[1] + '][' + num + ']');
					return edit.insert(end_pos, '\n[' + num + ']: ');
				} )
				setPosition(end_pos.line + 1, 5)
				return
			}
			else {
				editor().edit((edit) => {
					return edit.replace(word, '[' + match[1] + '][' + num + ']');
				} )
				setPosition(position().line, word.end.character - 1)
				return
			}
		}

		match = wordText.match(/^\[\]\((.+)\)$/);
		if (match) {
			// [](url) pattern
			if (autoRef) {
				url = retrieveUrl();
				if (url.length > 0) {
					if (url == match[1]) {
						editor().edit((edit) => {
							return edit.replace(word, '[][' + num + ']');
						} )
						setPosition(word.start.line, word.start.character + 1)
						return
					}
					else {
						vscode.window.showErrorMessage('A different url is already referenced at [' + num + ']');
						return;
					}
				}
			
				var end_pos = new vscode.Position(editor().document.lineCount, 0)
				editor().edit((edit) => {
					edit.replace(word, '[][' + num + ']');
					return edit.insert(end_pos, '\n[' + num + ']: ' + match[1]);
				} )
				setPosition(word.start.line, word.start.character + 1)
				return
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
				} )
				setPosition(word.end.line, word.end.character + url.length)
				return
			}
			else {
				editor().edit((edit) => {
					return edit.replace(word, '[' + match[1] + ']()');
				} )
				return
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
		editor().edit((edit) => {
			return edit.replace(word, '['+wordText+'][' + num + ']');
		} )
		setPosition(position().line, word.end.character + 3);

		if (autoPasteLinks) {
		}

	}
	
	// ctrl+1
	function toggleNumRefLink1() { toggleNumRefLink(1); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink1', toggleNumRefLink1));
	// ctrl+2
	function toggleNumRefLink2() { toggleNumRefLink(2); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink2', toggleNumRefLink2));
	// ctrl+3
	function toggleNumRefLink3() { toggleNumRefLink(3); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink3', toggleNumRefLink3));
	// ctrl+4
	function toggleNumRefLink4() { toggleNumRefLink(4); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink4', toggleNumRefLink4));
	// ctrl+5
	function toggleNumRefLink5() { toggleNumRefLink(5); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink5', toggleNumRefLink5));
	// ctrl+6
	function toggleNumRefLink6() { toggleNumRefLink(6); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink6', toggleNumRefLink6));
	// ctrl+7
	function toggleNumRefLink7() { toggleNumRefLink(7); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink7', toggleNumRefLink7));
	// ctrl+8
	function toggleNumRefLink8() { toggleNumRefLink(8); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink8', toggleNumRefLink8));
	// ctrl+9
	function toggleNumRefLink9() { toggleNumRefLink(9); }
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink9', toggleNumRefLink9));

	// ctrl+g
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
			editor().edit((edit) => {
				return edit.replace(word, match[1]);
			} )
			setPosition(position().line, word.end.character + 1);
			return
		}

		match = wordText.match(/^\[(.*)\]\((.*)\)$/);
		if (match) {
			editor().edit((edit) => {
				return edit.replace(word, '!' + wordText);
			} )
			if (match[1].length > 0) {
				setPosition(position().line, word.end.character + 1);
			}
			else {
				setPosition(position().line, word.start.character + 2);
			}
			return
		}

		match = wordText.match(/^\[(.*)\]\[(.+)\]$/);
		if (match) {
			// [abc][ref] pattern: ignore
			return
		}

		match = wordText.match(new RegExp('^<(' + srx_url + ')>$'));
		if (match) {
			// url already <url> formatted
			editor().edit((edit) => {
				return edit.replace(word, '![](' + match[1] + ')')
			} )
			setPosition(position().line, word.start.character + 2)
			return
		}

		match = wordText.match(new RegExp('^' + srx_url + '$'))
		if (match) {
			// unformatted url
			editor().edit((edit) => {
				return edit.replace(word, '![](' + match[1] + ')')
			} )
			setPosition(position().line, word.start.character + 2)
			return
		}

		// non-url formatted word: apply the [title](url) format, with word as title
		editor().edit((edit) => {
			return edit.replace(word, '!['+wordText+']()');
		} )
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
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleImageLink', toggleImageLink));
	
	// ctrl+q
	function toggleBlockquote() {
		var line = editor().document.lineAt(position().line);
		var rx = /(>\s?).*/
		var match = line.text.match(rx)
		if (match) {
			editor().edit((edit) => {
				return edit.delete(new vscode.Range(new vscode.Position(position().line, 0), new vscode.Position(position().line, match[1].length)))
			} )
			setPosition(position().line, Math.min(0, position().character - match[1].length))
		}
		else {
			editor().edit((edit) => {
				return edit.insert(new vscode.Position(position().line, 0), '> ')
			} )
			setPosition(position().line, position().character + 2)
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleBlockquote', toggleBlockquote));
	
	// ctrl+r
	function insertHRule() {
		var line = editor().document.lineAt(position().line);
		editor().edit((edit) => {
			return edit.insert(new vscode.Position(position().line, line.text.length), '\n\n--------\n')
		} )
		setPosition(position().line + 4, 0)
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.insertHRule', insertHRule));
	
	// ctrl+k
	function toggleCodeblock() {
		var sel = selection();
		if (!sel.isEmpty) {
			var selected_text = editor().document.getText(sel)
			var match;

			match = selected_text.trim().match(/^`(.*)`$/);
			if (match) {
				editor().edit((edit) => {
					edit.replace(sel, match[1]);
				})
				return
			}

			match = selected_text.trim().match(/^```(.*)```$/m);
			if (match) {
				editor().edit((edit) => {
					edit.replace(sel, match[1]);
				})
				return
			}

			match = selected_text.match(/^((?: {4,}|\t)(.*))+$/m);
			if (match) {
				editor().edit((edit) => {
					edit.replace(sel, selected_text.trim().replace('\n    ', '\n').replace('\n\t', '\n'));
				})
				return
			}

			var selected_text = selected_text.trim()

			if (sel.isSingleLine) {

				var line = editor().document.lineAt(sel.start.line);

				if (sel.isEqual(line.range) || sel.isEqual(line.rangeIncludingLineBreak)) {
					// same line, whole line
					editor().edit((edit) => {
						edit.replace(sel, '\n    ' + selected_text + '\n\n');
					})
				} else {
					// same line, part of the line
					editor().edit((edit) => {
						edit.replace(sel, '`' + selected_text + '`');
					})
				}
			} else {
				editor().edit((edit) => {
					edit.replace(sel, '\n    ' + selected_text.replace('\n', '\n    ') + '\n\n');
				})
			}
		}
		else {
			var word = editor().document.getWordRangeAtPosition(position(), /^`(.*)`$/);
			if (typeof(word) != 'undefined') {
				var wordText = editor().document.getText(word)
				match = wordText.match(/^`(.*)`$/);
				editor().edit((edit) => {
					return edit.replace(word, match[1]);
				} )
			}
			else {
				editor().edit((edit) => {
					return edit.insert(position(), '``');
				} )
				setPosition(position().line, position().character + 1)
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleCodeblock', toggleCodeblock));
	
	/// ctrl+u
	function toggleUList() {
		var sel = selection();
		var selected_text = editor().document.getText(sel).trim();

		var match = selected_text.match(/((?: ?[\*+-] ?)(.*))+/m)
		if (match) {
			editor().edit((edit) => {
				edit.replace(sel, selected_text.replace(/^ ?[\*+-] ?/m, '').replace(/\n ?[\*+-] ?/m, '\n'));
			})
		} else {
			editor().edit((edit) => {
				edit.replace(sel, '\n ' + uListSymbol + ' ' + selected_text.replace('\n', '\n ' + uListSymbol + ' ') + '\n\n');
			})
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleUList', toggleUList));
	
	// ctrl+o
	function toggleOList() {
		var sel = selection();
		var selected_text = editor().document.getText(sel).trim();

		var match = selected_text.match(/((?: ?\d\. ?)(.*))+/m)
		if (match) {
			editor().edit((edit) => {
				edit.replace(sel, selected_text.replace(/^ ?\d\. ?/m, '').replace(/\n ?\d\. ?/m, '\n'));
			})
		} else {
			editor().edit((edit) => {
				edit.replace(sel, '\n 1. ' + selected_text.replace('\n', '\n 1. ') + '\n\n');
			})
		}
	}	
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleOList', toggleOList));
	
	// ctrl++
	function toggleChecklist() {
		var sel = selection();
		var selected_text = editor().document.getText(sel).trim();

		var match = selected_text.match(/((?: ?\[[x ]\] ?)(.*))+/m)
		if (match) {
			editor().edit((edit) => {
				edit.replace(sel, selected_text.replace(/^ ?\[[x ]\] ?/m, '').replace(/\n ?\[[x ]\] ?/m, '\n'));
			})
		} else {
			editor().edit((edit) => {
				edit.replace(sel, '\n [ ] ' + selected_text.replace('\n', '\n [ ] ') + '\n\n');
			})
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleChecklist', toggleChecklist));

	// alt+c
	function check() {
		var line = editor().document.lineAt(position().line);
		var match = line.text.match(/^( +)\[([x ])\]( +)(.*)/);
		if (match) {
			if (match[2] == ' ') {
				editor().edit((edit) => {
					edit.replace(line.range, match[1] + '[x]' + match[3] + match[4]);
				})
			}
			else if (match[2] == 'x') {
				editor().edit((edit) => {
					edit.replace(line.range, match[1] + '[ ]' + match[3] + match[4]);
				})
			}
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.check', check));

	// ctrl+t t
	function insertTable() {
		var sel = selection()
		if (!sel.isEmpty) {
			var selectedText = editor().document.getText(sel).trim();
			if (sel.isSingleLine) {
				var columns = selectedText.split(new RegExp('[' + csvSeparators + ']'));
				columns =columns.concat(new Array(Math.max(0, (3 - columns.length))).fill('   '));

				var rowmodel = new Array(columns.length);
				editor().edit((edit) => {
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

				editor().edit((edit) => {
					edit.replace(sel, lines.map((row) => '| ' + row.join(' | ') + ' |').join('\n') + '\n');
				})

			}
		}
		else{
			// no selection, an empty table is inserted
			editor().edit((edit) => {
				edit.replace(sel, '\n|   |   |\n| ----- | ----- |\n|   |   |\n|   |   |\n');
			})
			setPosition(sel.start.line + 1, sel.start.character + 2);
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.insertTable', insertTable));
	
	// ctrl+t right
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

		editor().edit((edit) => {
			edit.replace(new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(endLine + 1, 0)), headerText + sepsText + contentText);
		})
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.tableAddCol', tableAddCol));
	
	// ctrl+t bottom
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

		editor().edit((edit) => {
			edit.insert(new vscode.Position(endLine + 1, 0), '|' + new Array(nbCols).join('   |') + '\n');
		})
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.tableAddRow', tableAddRow));

	// ctrl+alt+p
	function togglePreview() {
		vscode.window.showInformationMessage('preview');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.togglePreview', togglePreview));
	
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
