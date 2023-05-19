const vscode = require('vscode');

const NanoBotHelpers = require('./nanobot_helpers');

function activate(context) {
    console.log('Welcome to Nano Bots! 🤖');

    context.subscriptions.push(
        vscode.commands.registerCommand('nano-bots.prompt', function (args) {
            NanoBotsCommand(Object.assign({ action: 'prompt' }, args));
        }),
        vscode.commands.registerCommand('nano-bots.apply', function (args) {
            NanoBotsCommand(Object.assign({ action: 'apply' }, args));
        }),
        vscode.commands.registerCommand('nano-bots.evaluate', function (args) {
            NanoBotsCommand(Object.assign({ action: 'evaluate' }, args));
        }),
        vscode.commands.registerCommand('nano-bots.stop', function (args) {
            NanoBotsCommand(Object.assign({ action: 'stop' }, args));
        })
    );
}

function NanoBotsCommand(params) {
    params = Object.assign({
        mode: 'replace',
        prefix: '',
        format: '[prompt]: [input]',
        state: '-',
        cartridge: null,
        input: null
    }, params);

    NanoBotsDispatcher.run(params, 0);
}


class NanoBotsDispatcher {
    static async run(params, counter) {
        if (counter > 2) {
            vscode.window.showErrorMessage('Nano Bots: Too many input requests: ' + counter);
            return;
        }

        if (params.action === 'stop') {
            NanoBotHelpers.stop();
            return;
        }

        if (!params.cartridge) {
            await this.ask_for_cartridge(params, counter);
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage(
                'Nano Bots: No open file. Open one to proceed.');
            return;
        }

        const selection = editor.document.getText(editor.selection);
        
        if (params.action === 'evaluate') {
            if (selection === '') {
                return;
            }

            NanoBotHelpers.evaluate(
                params.cartridge, params.state,
                selection, params.mode, params.prefix
            );
        } else if (params.action === 'prompt') {
            if (!params.input) {
                this.ask_for_input(params, counter);
                return;
            }

            NanoBotHelpers.evaluate(
                params.cartridge, params.state,
                params.input, params.mode, params.prefix
            );
        } else if (params.action === 'apply') {
            if (selection === '') {
                return;
            }

            if (!params.input) {
                this.ask_for_input(params, counter);
                return;
            }

            const text_input = params.format.replace('[prompt]', params.input)
                                            .replace('[input]', selection);

            NanoBotHelpers.evaluate(
                params.cartridge, params.state,
                text_input, params.mode, params.prefix
            );
        }
    }

    static async ask_for_cartridge(params, counter) {
        const options = await NanoBotHelpers.cartridges_as_menu();

        vscode.window.showQuickPick(options, { placeHolder: 'Select a Cartridge' })
            .then(selected => {
                if (selected) {
                    const chosenCartridge = selected.cartridge;

                    params.cartridge = chosenCartridge.system.id;
                    NanoBotsDispatcher.run(params, counter + 1);
                }
            });
    }

    static ask_for_input(params, counter) {
        vscode.window.showInputBox({ prompt: 'Prompt' })
            .then(input => {
                if (input) {
                    params.input = input;
                    NanoBotsDispatcher.run(params, counter + 1);
                }
            });
    }
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
