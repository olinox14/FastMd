/*  */

const vscode = require('vscode');
const assert = require('assert');
const path = require('path');
const fullmd = require('../fullmd');

let testFile = path.join(__dirname, 'blank.md');

function normalize(text) {
	return text.replace(/\r\n/g, '\n').replace(/\t/g, '    ');
}

async function runtest(command, pattern, expected) {

	// process the input
	pattern = normalize(pattern);
	expected = normalize(expected);

	var patternParts = pattern.split('§');
	var expectedParts = expected.split('§');

	var patternText = patternParts.join('');
	var expectedText = expectedParts.join('');

	// open the testing file
	var document = await vscode.workspace.openTextDocument(testFile);
	var editor = await vscode.window.showTextDocument(document)

	// update the testing file content
    var edit = await editor.edit(editBuilder => {
                let fullRange = new vscode.Range(new vscode.Position(0, 0), editor.document.positionAt(editor.document.getText().length));
                editBuilder.delete(fullRange);
                editBuilder.insert(new vscode.Position(0, 0), patternText);
			})
	
	// set selection
	var anchor;
	var pos;
	switch(patternParts.length) {
		case 1:
			anchor = editor.document.positionAt(pattern.length);
			pos = anchor;
		case 2:
			anchor = editor.document.positionAt(patternParts[0].length);
			pos = anchor;
			break;
		case 3:
			anchor = editor.document.positionAt(patternParts[0].length);
			pos = editor.document.positionAt(patternParts[0].length + patternParts[1].length);
			break;
		default:
			throw 'Too much anchors'
	} 
	vscode.window.activeTextEditor.selection = new vscode.Selection(anchor, pos);

	// exec the command
	var r = await vscode.commands.executeCommand(command);
	
	// Get the resulting text and format to readable result
	var editor = vscode.window.activeTextEditor;
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
	assert.deepEqual(result, expected, "'" + pattern + "' => '" + result + "' (expected: '" + expected + "')");
}

function sel(l1,c1,l2,c2) { return new vscode.Selection(l1,c1,l2,c2)}

suite("Formatting", function() {

	suiteSetup(async function() {
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

	test("addLinebreak", async function() {
		await runtest('fullmd.addLinebreak', 'text§', 'text  \n§');
	});

	test("escape", async function() {
		await runtest('fullmd.escape', '§(2 + 2) * 2 - 1 = 7§', '§\\(2 \\+ 2\\) \\* 2 \\- 1 = 7§');
	});

	test("headerUp", async function() {
		await runtest('fullmd.headerUp', 'Abcd§', '# Abcd§');
		await runtest('fullmd.headerUp', '# Abcd§', '## Abcd§');
		await runtest('fullmd.headerUp', '##### Abcd§', '##### Abcd§');
	});

	test("headerDown", async function() {
		await runtest('fullmd.headerDown', '##### Abcd§', '#### Abcd§');
		await runtest('fullmd.headerDown', '# Abcd§', 'Abcd§');
		await runtest('fullmd.headerDown', 'Abcd§', 'Abcd§');
	});

	test("setHn", async function() {
		await runtest('fullmd.setH1', 'Abcd§', '# Abcd§');
		await runtest('fullmd.setH1', '# Abcd§', '# Abcd§');
		await runtest('fullmd.setH1', '## Abcd§', '# Abcd§');

		await runtest('fullmd.setH2', 'Abcd§', '## Abcd§');
		await runtest('fullmd.setH2', '## Abcd§', '## Abcd§');
		await runtest('fullmd.setH2', '### Abcd§', '## Abcd§');

		await runtest('fullmd.setH3', 'Abcd§', '### Abcd§');
		await runtest('fullmd.setH3', '### Abcd§', '### Abcd§');
		await runtest('fullmd.setH3', '#### Abcd§', '### Abcd§');

		await runtest('fullmd.setH4', 'Abcd§', '#### Abcd§');
		await runtest('fullmd.setH4', '#### Abcd§', '#### Abcd§');
		await runtest('fullmd.setH4', '##### Abcd§', '#### Abcd§');

		await runtest('fullmd.setH5', 'Abcd§', '##### Abcd§');
		await runtest('fullmd.setH5', '##### Abcd§', '##### Abcd§');
		await runtest('fullmd.setH5', '## Abcd§', '##### Abcd§');
	});
	
	test("toggleItalic", async function() {
		// TODO: test with a different symbol's conf
		await runtest('fullmd.toggleItalic', 'Abcd§', '*Abcd*§');
		await runtest('fullmd.toggleItalic', 'Ab§cd', '*Ab§cd*');
		await runtest('fullmd.toggleItalic', '§Abcd§', '§*Abcd*§');
		await runtest('fullmd.toggleItalic', '*Abcd*§', 'Abcd§');
		await runtest('fullmd.toggleItalic', '*Ab§cd*', 'Ab§cd');
		await runtest('fullmd.toggleItalic', '§*Abcd*§', '§Abcd§');
	});

	test("toggleBold", async function() {
		await runtest('fullmd.toggleBold', 'Abcd§', '**Abcd**§');
		await runtest('fullmd.toggleBold', 'Ab§cd', '**Ab§cd**');
		await runtest('fullmd.toggleBold', '§Abcd§', '§**Abcd**§');
		await runtest('fullmd.toggleBold', '**Abcd**§', 'Abcd§');
		await runtest('fullmd.toggleBold', '**Ab§cd**', 'Ab§cd');
		await runtest('fullmd.toggleBold', '§**Abcd**§', '§Abcd§');
	});

	test("toggleStrikethrough", async function() {
		await runtest('fullmd.toggleStrikethrough', 'Abcd§', '~~Abcd~~§');
		await runtest('fullmd.toggleStrikethrough', 'Ab§cd', '~~Ab§cd~~');
		await runtest('fullmd.toggleStrikethrough', '§Abcd§', '§~~Abcd~~§');
		await runtest('fullmd.toggleStrikethrough', '~~Abcd~~§', 'Abcd§');
		await runtest('fullmd.toggleStrikethrough', '~~Ab§cd~~', 'Ab§cd');
		await runtest('fullmd.toggleStrikethrough', '§~~Abcd~~§', '§Abcd§');
	});
	
	test("toggleLink", async function() {
		// TODO: test the 'cleverUnlink' facility
		await runtest('fullmd.toggleLink', '[abc](www.test.url)§', '[abc](www.test.url)§');
		await runtest('fullmd.toggleLink', '[abc]()§', 'abc§');
		await runtest('fullmd.toggleLink', '[](www.test.url)§', '<www.test.url>§');
		await runtest('fullmd.toggleLink', '<www.test.url>§', 'www.test.url§');
		await runtest('fullmd.toggleLink', 'www.test.url§', '[§](www.test.url)');
		await runtest('fullmd.toggleLink', 'abc§', '[abc](§)');

		await vscode.env.clipboard.writeText('www.test.url');
		await runtest('fullmd.toggleLink', 'abc§', '[abc](www.test.url)§');
		await vscode.env.clipboard.writeText('');
	});

	test("toggleNumRefLink", async function() {
		// TODO: replace '1' by n, in a for loop with i=1 to 9
		await runtest('fullmd.toggleNumRefLink1', '[abc](www.test.url)§', '[abc][1]§\n[1]: www.test.url');
		await runtest('fullmd.toggleNumRefLink1', '[abc]()§', '[abc][1]§');
		await runtest('fullmd.toggleNumRefLink1', 'abc§', '[abc][1]§');
		await runtest('fullmd.toggleNumRefLink1', 'www.test.url§', '[][1]§\n[1]: www.test.url');
		await runtest('fullmd.toggleNumRefLink1', '[abc][1]\n[1]: www.test.url§', '[abc](www.test.url)§\n[1]: www.test.url');
		await runtest('fullmd.toggleNumRefLink1', '[abc][1]§', '[abc]()§');
	});

	test("toggleImageLink", async function() {
		await runtest('fullmd.toggleImageLink', '[abc](www.test.url)§', '![abc](www.test.url)§');
		await runtest('fullmd.toggleImageLink', '[abc]()§', '![abc](§)');
		await runtest('fullmd.toggleImageLink', 'abc§', '![abc](§)');
		await runtest('fullmd.toggleImageLink', 'www.test.url§', '![§](www.test.url)');
		await runtest('fullmd.toggleImageLink', '<www.test.url>§', '![§](www.test.url)');
		await runtest('fullmd.toggleImageLink', '![abc](www.test.url)§', '[abc](www.test.url)§');
	});

	test("toggleBlockquote", async function() {
		await runtest('fullmd.toggleBlockquote', 'abcdef§', '> abcdef§');
		await runtest('fullmd.toggleBlockquote', 'abcdef\nghijk§', 'abcdef\n> ghijk§');
	});

	test("insertHRule", async function() {
		await runtest('fullmd.insertHRule', 'abc§def', 'abc\n\n--------\ndef§');
	});

	test("toggleCodeblock", async function() {
		// TODO: test with 'tabCodeBlock' option to false
		await runtest('fullmd.toggleCodeblock', 'ab§cd§ef', 'ab§`cd`§ef');
		await runtest('fullmd.toggleCodeblock', 'ab§`cd`§ef', 'ab§cd§ef');
		await runtest('fullmd.toggleCodeblock', 'abcd§ef', 'abcd`§`ef');
		await runtest('fullmd.toggleCodeblock', 'abcd`§`ef', 'abcd§ef');
		await runtest('fullmd.toggleCodeblock', '§abcd§', '§\n    abcdef\n\n§');
		await runtest('fullmd.toggleCodeblock', '§\n    abcdef\n\n§', '§abcd§');
		await runtest('fullmd.toggleCodeblock', '§abcd\nefgh§', '§\n    abcd\n    efgh\n\n§');
		await runtest('fullmd.toggleCodeblock', '§\n    abcd\n    efgh\n\n§', '§abcd\nefgh§');
	});

	test("toggleUList", async function() {
		await runtest('fullmd.toggleUList', 'test§', ' * test§');
		await runtest('fullmd.toggleUList', '§a\nb\nc§', '§ * a\n * b\n * c§');
		await runtest('fullmd.toggleUList', ' * test§', 'test§');
		await runtest('fullmd.toggleUList', '§ * a\n * b\n * c§', '§a\nb\nc§');
	});

	test("toggleOList", async function() {
		await runtest('fullmd.toggleOList', 'test§', ' 1. test§');
		await runtest('fullmd.toggleOList', '§a\nb\nc§', '§ 1. a\n 2. b\n 3. c§');
		await runtest('fullmd.toggleOList', ' 1. test§', 'test§');
		await runtest('fullmd.toggleOList', '§ 1. a\n 2. b\n 3. c§', '§a\nb\nc§');
	});

	test("toggleChecklist", async function() {
		await runtest('fullmd.toggleChecklist', 'test§', ' [ ] test§');
		await runtest('fullmd.toggleChecklist', '§a\nb\nc§', '§ [ ] a\n [ ] b\n [ ] c§');
		await runtest('fullmd.toggleChecklist', ' [ ] test§', 'test§');
		await runtest('fullmd.toggleChecklist', '§ [ ] a\n [ ] b\n [ ] c§', '§a\nb\nc§');
	});

	test("check", async function() {
		await runtest('fullmd.check', ' [ ] test§', ' [x] test§');
		await runtest('fullmd.check', ' [ ] a\n [ ] b§\n [ ] c', ' [ ] a\n [x] b§\n [ ] c');
		await runtest('fullmd.check', ' [ ] a\n [x] b§\n [ ] c', ' [ ] a\n [ ] b§\n [ ] c');
	});

	test("insertTable", async function() {
		await runtest('fullmd.insertTable', 'abc§', 'abc\n|   |   |\n| ----- | ----- |\n|   |   |\n|   |   |\n§');
		await runtest('fullmd.insertTable', '§abc§', '§| abc |   |\n| ----- | ----- |\n|   |   |\n|   |   |\n§');
		await runtest('fullmd.insertTable', '§a;b;c§', '§| a | b | c |\n| ----- | ----- | ----- |\n|   |   |   |\n|   |   |   |\n§');
		await runtest('fullmd.insertTable', '§a;b;c\n1;2;3§', '§| a | b | c |\n| ----- | ----- | ----- |\n| 1 | 2 | 3 |\n§');
		await runtest('fullmd.insertTable', '§a|b|c\n1|2|3§', '§| a | b | c |\n| ----- | ----- | ----- |\n| 1 | 2 | 3 |\n§');

	});

	test("tableAddCol", async function() {
		await runtest('fullmd.tableAddCol', '|   §|   |\n| ----- | ----- |\n|   |   |\n|   |   |', '|   §|   |   |\n| ----- | ----- | ----- |\n|   |   |   |\n|   |   |   |');
	});

	test("tableAddRow", async function() {
		await runtest('fullmd.tableAddRow', '|   §|   |\n| ----- | ----- |\n|   |   |\n|   |   |', '|   §|   |\n| ----- | ----- |\n|   |   |\n|   |   |\n|   |   |');
	});

});
