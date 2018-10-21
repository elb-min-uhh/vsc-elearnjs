'use strict';

import * as vscode from 'vscode';
import Extension from './extension';
import PuppeteerChecker from './puppeteerChecker';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    // check if chromium was downloaded already
    PuppeteerChecker.checkChromium();

    // start the extension
    Extension.start(context);

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('"vsc-elearnjs" started.');
}

// this method is called when your extension is deactivated
export async function deactivate() {
    await Extension.stop();
}
