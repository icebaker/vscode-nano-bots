const vscode = require('vscode');

const http = require('http');
const https = require('https');
const url = require('url');

const NanoBotState = require('./nanobot_state');

class NanoBot {
    static stop() {
        NanoBotState.instance().stop();
    }

    static async perform(config, params, callback) {
        const cartridge = await this.cartridge(config, params.cartridge);

        this.stop();

        if (config.NANO_BOTS_STREAM) {
            this.stream_request(config, params, cartridge, callback);
        } else {
            this.non_stream_request(config, params, cartridge, callback);
        }
    }

    static async cartridges(config) {
        return await this.send_request(config, null, 'GET', '/cartridges', 1000);
    }

    static async cartridge(config, cartridge_id) {
        return await this.send_request(
            config, { id: cartridge_id }, 'POST', '/cartridges/source', 1000);
    }

    static non_stream_request(config, params, cartridge, callback) {
        const thread = NanoBotState.thread();

        NanoBotState.instance().update(
            cartridge, { status: 'pending', started_at: Date.now(), thread: thread }
        );

        this.send_request(config, params, 'POST', '/cartridges').then((response) => {
            if (NanoBotState.instance().state.status !== 'stopped' && NanoBotState.instance().state.thread === thread) {
                NanoBotState.instance().update(cartridge, { status: 'finished' });
                callback(response);
            }
        });
    }

    static stream_request(config, params, cartridge, callback) {
        const thread = NanoBotState.thread();

        NanoBotState.instance().update(
            cartridge, { status: 'pending', started_at: Date.now(), thread: thread });

        this.send_request(config, params, 'POST', '/cartridges/stream').then((response) => {
            let stream_id = response.id;
            if (!stream_id) {
                vscode.window.showErrorMessage('Nano Bots: No Stream ID received.');
                return;
            }

            let state = '';

            const streamChecker = () => {
                if (NanoBotState.instance().state.status === 'stopped' || NanoBotState.instance().state.thread !== thread) {
                    return;
                }

                this.send_request(config, null, 'GET', '/cartridges/stream/' + stream_id).then((response) => {
                    let output = response.output;

                    if (state !== output) {
                        response.fragment = output.slice(state.length);
                        state = output;
                        callback(response);
                    }

                    if (response.state === 'finished') {
                        NanoBotState.instance().update(cartridge, { status: 'finished' });
                    } else {
                        setTimeout(streamChecker, 0);
                    }
                });
            }

            setTimeout(streamChecker, 0);
        });
    }

    static async send_request(config, params, method, path, timeout=undefined) {
        return new Promise((resolve, reject) => {
            const api_url = new url.URL(config.NANO_BOTS_API_ADDRESS);
            const options = {
                hostname: api_url.hostname,
                port: api_url.port,
                path: path,
                method: method,
                timeout: timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'NANO_BOTS_USER_IDENTIFIER': 'vscode/' + config.NANO_BOTS_USER_IDENTIFIER
                }
            };

            const protocol = api_url.protocol.startsWith('https') ? https : http;

            const request = protocol.request(options, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            request.on('error', (error) => {
                vscode.window.showErrorMessage('Nano Bots: ' + error.message);
                reject(error);
            });

            if (params) {
                request.write(JSON.stringify(params));
            }

            request.end();
        });
    }
}

module.exports = NanoBot;
