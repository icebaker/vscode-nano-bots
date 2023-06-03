const crypto = require('crypto');
const vscode = require('vscode');

class NanoBotState {
  constructor() {
    this.state = { status: 'waiting' };
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this._instance = null;
  }

  static thread(length = 16) {
    const bytes = crypto.randomBytes(Math.ceil(length / 2));
    const randomString = bytes.toString('hex').substring(0, length);
    return randomString;
  }

  static instance() {
    if (!this._instance) {
      this._instance = new NanoBotState();
    }
    return this._instance;
  }

  stop() {
    this.state.status = 'stopped';
    this.state.thread = null;
    this.statusBar.hide();
  }

  update(cartridge, new_state = null) {
    if (new_state) {
      this.state = new_state;
    }

    if (this.state.status !== 'pending') {
      this.statusBar.hide();
      return;
    }

    let text = '';

    if (!cartridge.meta.symbol) {
      text += '🤖';
    } else {
      text += cartridge.meta.symbol;
    }

    text += ' ' + cartridge.meta.name + '... ';

    let seconds = Math.floor((Date.now() - this.state.started_at) / 1000);

    text += `(${seconds}s)`;

    this.statusBar.text = text;
    this.statusBar.show();

    if (this.state.status === 'pending') {
      setTimeout(() => this.update(cartridge), 500);
    }
  }
}

module.exports = NanoBotState;
