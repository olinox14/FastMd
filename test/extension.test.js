/*  */

const vscode = require('vscode');
const assert = require('assert');
const path = require('path');
const fullmd = require('../fullmd');
var tmp = require('tmp');

let testFile = path.join(__dirname, 'blank.md');

function normalize(text) {
	return text.replace(/\r\n/g, '\n').replace(/\t/g, '    ');
}

function parsePattern(pattern) {
	pattern = normalize(pattern);
	let patternParts = pattern.split('§');
	let selection;

	if (pattern.indexOf('§') < 0) {
		pattern += '§'
	}

	let anchor;
	let active;
	let iline = 0;
	let ichar = 0;
	for (let i=0;i<=pattern.length;i++) {
		let char = pattern.charAt(i);
		if (char == '\n') {
			iline++;
			ichar = 0;
		} else if (char == '§') {
			if (typeof(anchor) == 'undefined') {
				anchor = new vscode.Position(iline, ichar);
			} else {
				active = new vscode.Position(iline, ichar);
				break;
			}
		} else {
			ichar++;
		}
	}
	if (typeof(active) == 'undefined') {
		active = anchor;
	}
	
	if (active == null) {
		active = anchor
	}
	
	return [patternParts.join(''), new vscode.Selection(anchor, active)]
}

async function runtest(command, pattern, expected) {

	var tmpobj = tmp.fileSync({prefix: command, postfix: '.md'});
	let document = await vscode.workspace.openTextDocument(tmpobj.name);
	let editor = await vscode.window.showTextDocument(document);
	try {
		await runTestIn(editor, command, pattern, expected);
	} finally {
		vscode.window.activeTextEditor = editor;
		await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
		// vscode.env.clipboard.writeText('').then();
		await tmpobj.removeCallback();
	}
}

async function runTestIn(editor, command, pattern, expected) {

	let [patternText, patternSelection] = parsePattern(pattern);
	let [expectedText, expectedSelection] = parsePattern(expected);

	// open the testing file and update the testing file content
	await editor.edit((edit) => {
		let fullRange = new vscode.Range(new vscode.Position(0, 0), editor.document.positionAt(editor.document.getText().length));
		edit.replace(fullRange, patternText);
	});

	editor.selection = patternSelection;

	// exec the command
	await vscode.commands.executeCommand(command);
	
	// Get the resulting text and format to readable result
	let result;
	if (editor.selection.start.isEqual(editor.selection.end)) {
		result = editor.document.getText(new vscode.Range(new vscode.Position(0,0), editor.selection.start)) + '§' + 
					editor.document.getText(new vscode.Range(editor.selection.end, editor.document.positionAt(editor.document.getText().length)));
	} else {
		result = editor.document.getText(new vscode.Range(new vscode.Position(0,0), editor.selection.start)) + '§' + 
					editor.document.getText(editor.selection) + '§' + 
					editor.document.getText(new vscode.Range(editor.selection.end, editor.document.positionAt(editor.document.getText().length)));
	}
	result = normalize(result);

	// test
	let description = "'" + pattern.replace(/\n/g, '\\n') + "' => '" + result.replace(/\n/g, '\\n') + "' (expected: '" + expected.replace(/\n/g, '\\n') + "')"
	assert.deepStrictEqual(result, expected, description);

}

suite("Formatting", function() {

	suiteSetup(async function() {
		// await vscode.env.clipboard.writeText('');
		await vscode.workspace.openTextDocument(testFile);
	});

	test("reEscape", function() {
		assert.strictEqual(fullmd.reEscape('abcd'), 'abcd');
		assert.strictEqual(fullmd.reEscape('[]-{}()*+?.,\\^$|#'), '\\[\\]\\-\\{\\}\\(\\)\\*\\+\\?\\.\\,\\\\\\^\\$\\|\\#');
	});

	test("mdEscape", function() {
		assert.strictEqual(fullmd.mdEscape('abcd'), 'abcd');
		assert.strictEqual(fullmd.mdEscape('[]-{}()*+.\\#`_!'), '\\[\\]\\-\\{\\}\\(\\)\\*\\+\\.\\\\\\#\\`\\_\\!');
	});

	test("addLinebreak", function(done) {
		runtest('fullmd.addLinebreak', 'text§', 'text  \n§').then(done, done);
	});

	test("escape", function(done) {
		runtest('fullmd.escape', '§(2 + 2) * 2 - 1 = 7§', '§\\(2 \\+ 2\\) \\* 2 \\- 1 = 7§').then(done, done);
	});

	test("headerUp", function(done) {
		runtest('fullmd.headerUp', 'Abcd§', '# Abcd§').then(done, done);
	});
	test("headerUp", function(done) {
		runtest('fullmd.headerUp', '# Abcd§', '## Abcd§').then(done, done);
	});
	test("headerUp", function(done) {
		runtest('fullmd.headerUp', '##### Abcd§', '##### Abcd§').then(done, done);
	});

	test("headerDown", function(done) {
		runtest('fullmd.headerDown', '##### Abcd§', '#### Abcd§').then(done, done);
	});
	test("headerDown", function(done) {
		runtest('fullmd.headerDown', '# Abcd§', 'Abcd§').then(done, done);
	});
	test("headerDown", function(done) {
		runtest('fullmd.headerDown', 'Abcd§', 'Abcd§').then(done, done);
	});

	test("setH0", function(done) {
		runtest('fullmd.setH0', 'Abcd§', 'Abcd§').then(done, done);
	});
	test("setH0", function(done) {
		runtest('fullmd.setH0', '# Abcd§', 'Abcd§').then(done, done);
	});
	test("setH0", function(done) {
		runtest('fullmd.setH0', '## Abcd§', 'Abcd§').then(done, done);
	});
	test("setH1", function(done) {
		runtest('fullmd.setH1', 'Abcd§', '# Abcd§').then(done, done);
	});
	test("setH1", function(done) {
		runtest('fullmd.setH1', '# Abcd§', '# Abcd§').then(done, done);
	});
	test("setH1", function(done) {
		runtest('fullmd.setH1', '## Abcd§', '# Abcd§').then(done, done);
	});
	test("setH2", function(done) {
		runtest('fullmd.setH2', 'Abcd§', '## Abcd§').then(done, done);
	});
	test("setH2", function(done) {
		runtest('fullmd.setH2', '## Abcd§', '## Abcd§').then(done, done);
	});
	test("setH2", function(done) {
		runtest('fullmd.setH2', '### Abcd§', '## Abcd§').then(done, done);
	});
	test("setH3", function(done) {
		runtest('fullmd.setH3', 'Abcd§', '### Abcd§').then(done, done);
	});
	test("setH3", function(done) {
		runtest('fullmd.setH3', '### Abcd§', '### Abcd§').then(done, done);
	});
	test("setH3", function(done) {
		runtest('fullmd.setH3', '#### Abcd§', '### Abcd§').then(done, done);
	});
	test("setH4", function(done) {
		runtest('fullmd.setH4', 'Abcd§', '#### Abcd§').then(done, done);
	});
	test("setH4", function(done) {
		runtest('fullmd.setH4', '#### Abcd§', '#### Abcd§').then(done, done);
	});
	test("setH4", function(done) {
		runtest('fullmd.setH4', '##### Abcd§', '#### Abcd§').then(done, done);
	});
	test("setH5", function(done) {
		runtest('fullmd.setH5', 'Abcd§', '##### Abcd§').then(done, done);
	});
	test("setH5", function(done) {
		runtest('fullmd.setH5', '##### Abcd§', '##### Abcd§').then(done, done);
	});
	test("setH5", function(done) {
		runtest('fullmd.setH5', '## Abcd§', '##### Abcd§').then(done, done);
	});
	
	test("toggleItalic", function(done) {    // TODO: test with a different symbol's conf
		runtest('fullmd.toggleItalic', 'Abcd§', '*Abcd*§').then(done, done);
	});
	test("toggleItalic", function(done) {
		runtest('fullmd.toggleItalic', 'Ab§cd', '*Ab§cd*').then(done, done);
	});
	test("toggleItalic", function(done) {
		runtest('fullmd.toggleItalic', '§Abcd§', '§*Abcd*§').then(done, done);
	});
	test("toggleItalic", function(done) {
		runtest('fullmd.toggleItalic', '§Ab cd§', '§*Ab cd*§').then(done, done);
	});
	test("toggleItalic", function(done) {
		runtest('fullmd.toggleItalic', '*Abcd*§', 'Abcd§').then(done, done);
	});
	test("toggleItalic", function(done) {
		runtest('fullmd.toggleItalic', '*Ab§cd*', 'Ab§cd').then(done, done);
	});
	test("toggleItalic", function(done) {
		runtest('fullmd.toggleItalic', '§*Abcd*§', '§Abcd§').then(done, done);
	});
	test("toggleItalic", function(done) {
		runtest('fullmd.toggleItalic', '§*Ab cd*§', '§Ab cd§').then(done, done);
	});

	test("toggleBold", function(done) {
		runtest('fullmd.toggleBold', 'Abcd§', '**Abcd**§').then(done, done);
	});
	test("toggleBold", function(done) {
		runtest('fullmd.toggleBold', 'Ab§cd', '**Ab§cd**').then(done, done);
	});
	test("toggleBold", function(done) {
		runtest('fullmd.toggleBold', '§Abcd§', '§**Abcd**§').then(done, done);
	});
	test("toggleBold", function(done) {
		runtest('fullmd.toggleBold', '§Ab cd§', '§**Ab cd**§').then(done, done);
	});
	test("toggleBold", function(done) {
		runtest('fullmd.toggleBold', '**Abcd**§', 'Abcd§').then(done, done);
	});
	test("toggleBold", function(done) {
		runtest('fullmd.toggleBold', '**Ab§cd**', 'Ab§cd').then(done, done);
	});
	test("toggleBold", function(done) {
		runtest('fullmd.toggleBold', '§**Abcd**§', '§Abcd§').then(done, done);
	});
	test("toggleBold", function(done) {
		runtest('fullmd.toggleBold', '§**Ab cd**§', '§Ab cd§').then(done, done);
	});

	test("toggleStrikethrough", function(done) {
		runtest('fullmd.toggleStrikethrough', 'Abcd§', '~~Abcd~~§').then(done, done);
	});
	test("toggleStrikethrough", function(done) {
		runtest('fullmd.toggleStrikethrough', 'Ab§cd', '~~Ab§cd~~').then(done, done);
	});
	test("toggleStrikethrough", function(done) {
		runtest('fullmd.toggleStrikethrough', '§Abcd§', '§~~Abcd~~§').then(done, done);
	});
	test("toggleStrikethrough", function(done) {
		runtest('fullmd.toggleStrikethrough', '~~Abcd~~§', 'Abcd§').then(done, done);
	});
	test("toggleStrikethrough", function(done) {
		runtest('fullmd.toggleStrikethrough', '~~Ab cd~~§', 'Ab cd§').then(done, done);
	});
	test("toggleStrikethrough", function(done) {
		runtest('fullmd.toggleStrikethrough', '~~Ab§cd~~', 'Ab§cd').then(done, done);
	});
	test("toggleStrikethrough", function(done) {
		runtest('fullmd.toggleStrikethrough', '§~~Abcd~~§', '§Abcd§').then(done, done);
	});
	test("toggleStrikethrough", function(done) {
		runtest('fullmd.toggleStrikethrough', '§~~Ab cd~~§', '§Ab cd§').then(done, done);
	});
	
	test("toggleLink", function(done) {   // TODO: test the 'cleverUnlink' facility
		runtest('fullmd.toggleLink', '[abc](www.test.url)§', '[abc](www.test.url)§').then(done, done);
	});
	test("toggleLink", function(done) {
		runtest('fullmd.toggleLink', '[abc]()§', 'abc§').then(done, done);
	});
	test("toggleLink", function(done) {
		runtest('fullmd.toggleLink', '[](www.test.url)§', '<www.test.url>§').then(done, done);
	});
	test("toggleLink", function(done) {
		runtest('fullmd.toggleLink', '<www.test.url>§', 'www.test.url§').then(done, done);
	});
	test("toggleLink", function(done) {
		runtest('fullmd.toggleLink', 'www.test.url§', '[§](www.test.url)').then(done, done);
	});
	test("toggleLink", function(done) {
		runtest('fullmd.toggleLink', 'abc§', '[abc](§)').then(done, done);
	});
	test("toggleLink", async function() {
		await vscode.env.clipboard.writeText('www.test.url')
		await runtest('fullmd.toggleLink', 'abc§', '[abc](www.test.url)§');
	});

	test("toggleNumRefLink", function(done) {
		runtest('fullmd.toggleNumRefLink1', '[abc](www.test.url)§', '[abc][1]§\n[1]: www.test.url').then(done, done);
	});
	test("toggleNumRefLink", function(done) {
		runtest('fullmd.toggleNumRefLink1', '[abc](www.test.url)§ abcd\nef gh\ni jkl', '[abc][1]§ abcd\nef gh\ni jkl\n[1]: www.test.url').then(done, done);
	});
	test("toggleNumRefLink", function(done) {
		runtest('fullmd.toggleNumRefLink1', '[abc]()§', '[abc][1]\n[1]: §').then(done, done);
	});
	test("toggleNumRefLink", function(done) {
		runtest('fullmd.toggleNumRefLink1', 'abc§', '[abc][1]§').then(done, done);
	});
	test("toggleNumRefLink", function(done) {
		runtest('fullmd.toggleNumRefLink1', '<www.test.url>§', '<www.test.url>§').then(done, done);  // do nothing
	});
	test("toggleNumRefLink", function(done) {
		runtest('fullmd.toggleNumRefLink1', 'www.test.url§', 'www.test.url§').then(done, done);  // do nothing
	});
	test("toggleNumRefLink", function(done) {
		runtest('fullmd.toggleNumRefLink1', '[abc][1]§\n[1]: www.test.url', '[abc](www.test.url)§\n[1]: www.test.url').then(done, done);
	});
	test("toggleNumRefLink", function(done) {
		runtest('fullmd.toggleNumRefLink1', '[abc][1]§', '[abc]()§').then(done, done);
	});

	test("toggleImageLink", function(done) {
		runtest('fullmd.toggleImageLink', '[abc](www.test.url)§', '![abc](www.test.url)§').then(done, done);
	});
	test("toggleImageLink", function(done) {
		runtest('fullmd.toggleImageLink', '[abc]()§', '![abc](§)').then(done, done);
	});
	test("toggleImageLink", function(done) {
		runtest('fullmd.toggleImageLink', 'abc§', '![abc](§)').then(done, done);
	});
	test("toggleImageLink", function(done) {
		runtest('fullmd.toggleImageLink', 'www.test.url§', '![§](www.test.url)').then(done, done);
	});
	test("toggleImageLink", function(done) {
		runtest('fullmd.toggleImageLink', '<www.test.url>§', '![§](www.test.url)').then(done, done);
	});
	test("toggleImageLink", function(done) {
		runtest('fullmd.toggleImageLink', '![abc](www.test.url)§', '[abc](www.test.url)§').then(done, done);
	});

	test("toggleBlockquote", function(done) {
		runtest('fullmd.toggleBlockquote', 'abcdef§', '> abcdef§').then(done, done);
	});
	test("toggleBlockquote", function(done) {
		runtest('fullmd.toggleBlockquote', 'abcdef\nghijk§', 'abcdef\n> ghijk§').then(done, done);
	});

	test("insertHRule", function(done) {
		runtest('fullmd.insertHRule', 'abcdef§', 'abcdef\n\n--------\n§').then(done, done);
	});

	test("toggleCodeblock", function(done) {   // TODO: test with 'tabCodeBlock' option to false
		runtest('fullmd.toggleCodeblock', 'ab§cd§ef', 'ab§`cd`§ef').then(done, done);
	});
	test("toggleCodeblock", function(done) {
		runtest('fullmd.toggleCodeblock', 'ab§`cd`§ef', 'ab§cd§ef').then(done, done);
	});
	test("toggleCodeblock", function(done) {
		runtest('fullmd.toggleCodeblock', 'abcd§ef', 'abcd`§`ef').then(done, done);
	});
	test("toggleCodeblock", function(done) {
		runtest('fullmd.toggleCodeblock', 'abcd`§`ef', 'abcd§ef').then(done, done);
	});
	test("toggleCodeblock", function(done) {
		runtest('fullmd.toggleCodeblock', '§abcdef§', '§\n    abcdef\n\n§').then(done, done);
	});
	test("toggleCodeblock", function(done) {
		runtest('fullmd.toggleCodeblock', '§\n    abcdef\n\n§', '§abcdef\n§').then(done, done);
	});
	test("toggleCodeblock", function(done) {
		runtest('fullmd.toggleCodeblock', '§abcd\nefgh\n§', '§\n    abcd\n    efgh\n\n§').then(done, done);
	});
	test("toggleCodeblock", function(done) {
		runtest('fullmd.toggleCodeblock', '§\n    abcd\n    efgh\n\n§', '§abcd\nefgh\n§').then(done, done);
	});

	test("toggleUList", function(done) {
		runtest('fullmd.toggleUList', 'test§', '* test§').then(done, done);
	});
	test("toggleUList", function(done) {
		runtest('fullmd.toggleUList', 'abc\ntest§\ndef', 'abc\n* test§\n\ndef').then(done, done);
	});
	test("toggleUList", function(done) {
		runtest('fullmd.toggleUList', '§a\nb\nc\n§', '§* a\n* b\n* c\n§').then(done, done);
	});
	test("toggleUList", function(done) {
		runtest('fullmd.toggleUList', 'abc\n§a\nb\nc§\ndef', 'abc\n§* a\n* b\n* c\n§\ndef').then(done, done);
	});
	test("toggleUList", function(done) {
		runtest('fullmd.toggleUList', '* test§', 'test§').then(done, done);
	});
	test("toggleUList", function(done) {
		runtest('fullmd.toggleUList', '§\n* test\n§', '§test§').then(done, done);
	});
	test("toggleUList", function(done) {
		runtest('fullmd.toggleUList', '§\n* a\n* b\n* c\n§\n', '§a\nb\nc§\n').then(done, done);
	});

	test("toggleOList", function(done) {
		runtest('fullmd.toggleOList', 'test§', '1. test§').then(done, done);
	});	
	test("toggleOList", function(done) {
		runtest('fullmd.toggleOList', 'abc\ntest§\ndef', 'abc\n1. test§\n\ndef').then(done, done);
	});
	test("toggleOList", function(done) {
		runtest('fullmd.toggleOList', '§a\nb\nc\n§', '§1. a\n2. b\n3. c\n§').then(done, done);
	});
	test("toggleOList", function(done) {
		runtest('fullmd.toggleOList', '1. test§', 'test§').then(done, done);
	});
	test("toggleOList", function(done) {
		runtest('fullmd.toggleOList', '§1. a\n2. b\n3. c\n§', '§a\nb\nc§').then(done, done);
	});

	test("toggleChecklist", function(done) {
		runtest('fullmd.toggleChecklist', 'test§', '[ ] test§').then(done, done);
	});
	test("toggleChecklist", function(done) {
		runtest('fullmd.toggleChecklist', 'abc\ntest§\ndef', 'abc\n[ ] test§\n\ndef').then(done, done);
	});
	test("toggleChecklist", function(done) {
		runtest('fullmd.toggleChecklist', '§a\nb\nc\n§', '§[ ] a\n[ ] b\n[ ] c\n§').then(done, done);
	});
	test("toggleChecklist", function(done) {
		runtest('fullmd.toggleChecklist', '[ ] test§', 'test§').then(done, done);
	});
	test("toggleChecklist", function(done) {
		runtest('fullmd.toggleChecklist', '§[ ] a\n[ ] b\n[ ] c\n§', '§a\nb\nc§').then(done, done);
	});

	test("check", function(done) {
		runtest('fullmd.check', ' [ ] test§', ' [x] test§').then(done, done);
	});
	test("check", function(done) {
		runtest('fullmd.check', ' [ ] a\n [ ] b§\n [ ] c', ' [ ] a\n [x] b§\n [ ] c').then(done, done);
	});
	test("check", function(done) {
		runtest('fullmd.check', ' [ ] a\n [x] b§\n [ ] c', ' [ ] a\n [ ] b§\n [ ] c').then(done, done);
	});

	test("insertTable", function(done) {
		runtest('fullmd.insertTable', 'abc§', 'abc§\n|   |   |\n| ----- | ----- |\n|   |   |\n|   |   |\n§').then(done, done);
	});
	test("insertTable", function(done) {
		runtest('fullmd.insertTable', '§abc§', '§| abc |     |     |\n| ----- | ----- | ----- |\n|   |   |   |\n|   |   |   |\n§').then(done, done);
	});
	test("insertTable", function(done) {
		runtest('fullmd.insertTable', '§a;b;c§', '§| a | b | c |\n| ----- | ----- | ----- |\n|   |   |   |\n|   |   |   |\n§').then(done, done);
	});
	test("insertTable", function(done) {
		runtest('fullmd.insertTable', '§a;b;c\n1;2;3§', '§| a | b | c |\n| ----- | ----- | ----- |\n| 1 | 2 | 3 |\n§').then(done, done);
	});
	test("insertTable", function(done) {
		runtest('fullmd.insertTable', '§a|b|c\n1|2|3§', '§| a | b | c |\n| ----- | ----- | ----- |\n| 1 | 2 | 3 |\n§').then(done, done);
	});

	test("tableAddCol", function(done) {
		runtest('fullmd.tableAddCol', '|   §|   |\n| ----- | ----- |\n|   |   |\n|   |   |', '|   §|   |   |\n| ----- | ----- | ----- |\n|   |   |   |\n|   |   |   |').then(done, done);
	});

	test("tableAddRow", function(done) {
		runtest('fullmd.tableAddRow', '|   §|   |\n| ----- | ----- |\n|   |   |\n|   |   |', '|   §|   |\n| ----- | ----- |\n|   |   |\n|   |   |\n|   |   |\n').then(done, done);
	});

});
