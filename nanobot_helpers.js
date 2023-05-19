const vscode = require('vscode');

const NanoBot = require('./nanobot');

const VSCodeHelpers = require('./vscode_helpers');

class NanoBotHelpers {
    static config() {
        let config = vscode.workspace.getConfiguration('🤖 Nano Bots');

        return {
            NANO_BOTS_API_ADDRESS: config.get('NANO_BOTS_API_ADDRESS'),
            NANO_BOTS_STREAM: config.get('NANO_BOTS_STREAM')
        };
    }

    static stop() {
        NanoBot.stop();
    }

    static async cartridges_as_menu() {
        const cartridges = await this.cartridges();
        const items = [];

        for (const cartridge of cartridges) {
            if (cartridge.meta.symbol) {
                items.push({ label: cartridge.meta.symbol + ' ' + cartridge.meta.name, cartridge: cartridge });
            } else {
                items.push({ label: cartridge.meta.name, cartridge: cartridge });
            }
        }

        return items;
    }

    static async cartridges() {
        return NanoBot.cartridges(this.config());
    }

    static cartridge(cartridge_id) {
        return NanoBot.cartridge(this.config(), cartridge_id);
    }

    static evaluate(cartridge, state, input, mode, prefix) {
        const params = {
            cartridge, state, input, mode, prefix
        };

        const config = this.config();

        NanoBot.perform(config, params, (result) => {
            this.on_output({ config, params }, result);
        });
    }

    static on_output(environment, result) {
        const content = environment.config.NANO_BOTS_STREAM ? result.fragment : result.output;

        const selection = VSCodeHelpers.selection();

        if (selection !== undefined) {
            VSCodeHelpers.insertText(
                content, selection.region, environment.params.mode, environment.params.prefix);
        }
        else {
            VSCodeHelpers.insertText(
                content, null, environment.params.mode, environment.params.prefix);
        }
    }
}

module.exports = NanoBotHelpers;
