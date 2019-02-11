// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
 
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	const cleverUnlink = true;  // allows to unlink a [title](url) with ctrl+l; the url is written to the clipboard
	const autoPasteLinks = true; // an url found the clipboard is automatically pasted when a word is formatted with ctrl+l

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
			edit.insert(selection().end, '  ');
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
	
	// ctrl+h 2
	function setH2() {
		setHeader(2);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH2', setH2));
	
	// ctrl+h 3
	function setH3() {
		setHeader(3);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH3', setH3));
	
	// ctrl+h 4
	function setH4() {
		setHeader(4);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH4', setH4));
	
	// ctrl+h 5
	function setH5() {
		setHeader(5);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.setH5', setH5));
	
	// ctrl+i
	function toggleItalic() {
		// permettre de choisir le symbole dans les params
		// voir à mieux prendre en compte les paramètres spéciaux (inclure ou exclure selon les cas)
		//extendSelection(/\S+/);
		//toggleSurrounding('*');

		var word = editor().document.getWordRangeAtPosition(position(), /\S+/);
		var wordText = editor().document.getText(word);
        if (wordText.startsWith('*') && wordText.endsWith('*')) {
			editor().edit((edit) => {
				edit.delete(new vscode.Range(new vscode.Position(position().line, word.end.character - 1), 
											 new vscode.Position(position().line, word.end.character)));
				return edit.delete(new vscode.Range(new vscode.Position(position().line, word.start.character), 
								                    new vscode.Position(position().line, word.start.character + 1)));
			} )
		}
		else {
			editor().edit((edit) => {
				edit.insert(new vscode.Position(position().line, word.start.character), '*');
				return edit.insert(new vscode.Position(position().line, word.end.character), '*');
			} )
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleItalic', toggleItalic));
	
	// ctrl+b
	function toggleBold() {
		// voir à mieux prendre en compte les paramètres spéciaux (inclure ou exclure selon les cas)
		var word = editor().document.getWordRangeAtPosition(position(), /\S+/);
		var wordText = editor().document.getText(word);
        if (wordText.startsWith('**') && wordText.endsWith('**')) {
			editor().edit((edit) => {
				edit.delete(new vscode.Range(new vscode.Position(position().line, word.end.character - 2), 
											 new vscode.Position(position().line, word.end.character)));
				return edit.delete(new vscode.Range(new vscode.Position(position().line, word.start.character), 
								                    new vscode.Position(position().line, word.start.character + 2)));
			} )
		}
		else {
			editor().edit((edit) => {
				edit.insert(new vscode.Position(position().line, word.start.character), '**');
				return edit.insert(new vscode.Position(position().line, word.end.character), '**');
			} )
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleBold', toggleBold));
	
	// ctrl+alt+s
	function toggleStrikethrough() {
		var word = editor().document.getWordRangeAtPosition(position(), /\S+/);
		var wordText = editor().document.getText(word);
        if (wordText.startsWith('~~') && wordText.endsWith('~~')) {
			editor().edit((edit) => {
				edit.delete(new vscode.Range(new vscode.Position(position().line, word.end.character - 2), 
											 new vscode.Position(position().line, word.end.character)));
				return edit.delete(new vscode.Range(new vscode.Position(position().line, word.start.character), 
								                    new vscode.Position(position().line, word.start.character + 2)));
			} )
		}
		else {
			editor().edit((edit) => {
				edit.insert(new vscode.Position(position().line, word.start.character), '~~');
				return edit.insert(new vscode.Position(position().line, word.end.character), '~~');
			} )
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
		// F1. abc => [abc](%)     // if none url in the clipboard
		// F2. abc => [abc](url)%  // if an url was found in the clipboard

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
			return editor().document.getWordRangeAtPosition(position(), /\S+/);
		}

		var word = getWordRange()
		var wordText = editor().document.getText(word);
		var match;

		match = wordText.match(/^\[(.+)\]\((.+)\)$/);
		if (match) {
			// there is a title and an url: do nothing
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
	function toggleNumRefLink() {
		vscode.window.showInformationMessage('ref-link');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleNumRefLink', toggleNumRefLink));
	
	// ctrl+g
	function toggleImageLink() {
		vscode.window.showInformationMessage('img-link');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleImageLink', toggleImageLink));
	
	// ctrl+q
	function toggleBlockquote() {
		vscode.window.showInformationMessage('quote');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleBlockquote', toggleBlockquote));
	
	// ctrl+r
	function insertHRule() {
		vscode.window.showInformationMessage('hrule');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.insertHRule', insertHRule));
	
	// ctrl+k
	function toggleCodeblock() {
		vscode.window.showInformationMessage('codeblock');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleCodeblock', toggleCodeblock));
	
	// none
	function togglePyCodeblock() {
		vscode.window.showInformationMessage('codeblock');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.togglePyCodeblock', togglePyCodeblock));
	
	// none
	function toggleJsCodeblock() {
		vscode.window.showInformationMessage('codeblock');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleJsCodeblock', toggleJsCodeblock));
	
	/// ctrl+u
	function toggleUList() {
		vscode.window.showInformationMessage('list');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleUList', toggleUList));
	
	// ctrl+o
	function toggleOList() {
		vscode.window.showInformationMessage('num-list');
	}	
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleOList', toggleOList));
	
	// ctrl++
	function toggleChecklist() {
		vscode.window.showInformationMessage('checklist');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleChecklist', toggleChecklist));

	// alt+c
	function check() {
		vscode.window.showInformationMessage('check');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.check', check));

	// ctrl+t
	function insertTable() {
		vscode.window.showInformationMessage('table');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.insertTable', insertTable));
	
	// ctrl+right
	function tableAddCol() {
		vscode.window.showInformationMessage('add-col');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.tableAddCol', tableAddCol));
	
	// ctrl+bottom
	function tableAddRow() {
		vscode.window.showInformationMessage('add-row');
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
