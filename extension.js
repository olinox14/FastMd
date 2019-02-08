// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

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
		};
	}

	// return the text with special characters regex escaped 
	function reEscape(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}

	// return the text with special characters markdown escaped
	function mdEscape(text) {
		return text.replace(/[-[\]{}()*+.\\#`_!]/g, '\\$&');
	}

	function replaceSelection(with_str) {
		editor().edit(edit => edit.replace(selection(), (() => with_str)()));
	}

	// return true if the selection is surrounded by 'with_str'
	function isSurroundedWith(with_str) {
		var rx = new RegExp('^' + reEscape(with_str) + '(.*)' + reEscape(with_str) + '$');
		return rx.test(selectedText())
	}

	// surround the current selection with 'with_str'
	function surround(with_str) {
		var selected = selectedText()
		if (selected.length > 0) {
			return replaceSelection(with_str + selected + with_str);
		}
		else {
			var newPos = movePosition(0, with_str.length);
			return editor().edit((edit) => {
				edit.insert(selection().start, with_str + with_str);
			} ).then(() => {
				editor().selection = new vscode.Selection(newPos, newPos)
			} )
		}
	}

	// remove the 'with_str' that is surrounding the selection
	function removeSurrounding(with_str) {
		var rx = new RegExp('^' + reEscape(with_str) + '(.*)' + reEscape(with_str) + '$');
		return replaceSelection(selectedText().match(rx)[1]);
	}

	function toggleSurrounding(with_str) {
		if (isSurroundedWith(with_str)) {
			return removeSurrounding(with_str)
		}
		else {
			return surround(with_str);
		}
	}

	// ctrl+enter
	function addLinebreak() {
		replaceSelection(selectedText() + '  ');
		movePosition(0,2);
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.addLinebreak', addLinebreak));

	// ctrl+/
	// auto-escape on formatted text?
	function escape() {
		return replaceSelection(mdEscape(selectedText()));
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.escape', escape));

	// ctrl+h
	function headerUp() {
		vscode.window.showInformationMessage('up');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.headerUp', headerUp));

	// ctrl+shift+h
	function headerDown() {
		vscode.window.showInformationMessage('down');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.headerDown', headerDown));
	
	// ctrl+h 1
	function toggleH1() {
		vscode.window.showInformationMessage('h1');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleH1', toggleH1));
	
	// ctrl+h 2
	function toggleH2() {
		vscode.window.showInformationMessage('h2');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleH2', toggleH2));
	
	// ctrl+h 3
	function toggleH3() {
		vscode.window.showInformationMessage('h3');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleH3', toggleH3));
	
	// ctrl+h 4
	function toggleH4() {
		vscode.window.showInformationMessage('h4');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleH4', toggleH4));
	
	// ctrl+h 5
	function toggleH5() {
		vscode.window.showInformationMessage('h5');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleH5', toggleH5));
	
	// ctrl+i
	function toggleItalic() {
		// permettre de choisir le symbole dans les params
		// si texte selectionné et non formatté: entoure avec le symbole
		// si texte selectionné et déjà formatté: retire les symbole
		// si curseur entouré d'espaces: ajoute un double symbole et place le curseur au centre
		extendSelection(/\S+/);
		toggleSurrounding('*');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleItalic', toggleItalic));
	
	// ctrl+b
	function toggleBold() {
		extendSelection(/\S+/);
		toggleSurrounding('**');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleBold', toggleBold));
	
	// ctrl+b ctrl+i
	function toggleCombinedEmphasis() {
		vscode.window.showInformationMessage('combined');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleCombinedEmphasis', toggleCombinedEmphasis));
	
	// ctrl+alt+e
	function toggleStrikethrough() {
		extendSelection(/\S+/);
		toggleSurrounding('~~');
	}
	context.subscriptions.push(vscode.commands.registerCommand('fastmd.toggleStrikethrough', toggleStrikethrough));
	
	// ctrl+l
	function toggleLink() {
		vscode.window.showInformationMessage('link');
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
