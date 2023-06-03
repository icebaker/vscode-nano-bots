const vscode = require('vscode');

class VSCodeHelpers {
  static async insertText(content, region, mode = 'replace', prefix = '') {
    const editor = vscode.window.activeTextEditor;

    if (mode === 'replace' && region !== null) {
      await editor.edit((editBuilder) => {
        editor.selections.forEach((selection) => {
          editBuilder.replace(selection, content);
        });
      });
      editor.selections = editor.selections.map(
        (selection) => new vscode.Selection(selection.end, selection.end)
      );
    } else {
      await editor.edit((editBuilder) => {
        editor.selections.forEach((selection) => {
          editBuilder.insert(selection.end, (region === null ? '' : prefix) + content);
        });
      });
      let offset = (prefix + content).length;
      editor.selections = editor.selections.map(
        (selection) =>
          new vscode.Selection(
            selection.end.translate(0, offset),
            selection.end.translate(0, offset)
          )
      );
    }
  }

  static selection() {
    const editor = vscode.window.activeTextEditor;
    return editor.selections
      .map((selection) => {
        return {
          region: selection,
          text: editor.document.getText(selection)
        };
      })
      .filter((selection) => !selection.region.isEmpty)[0];
  }

  static clearSelections() {
    const editor = vscode.window.activeTextEditor;
    editor.selections = editor.selections.map((selection) => {
      return new vscode.Selection(selection.start, selection.start);
    });
  }
}

module.exports = VSCodeHelpers;
