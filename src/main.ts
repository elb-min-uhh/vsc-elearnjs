'use strict';

import * as vscode from 'vscode';
import Extension from './extension';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let extensionMain = new Extension(context);

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vsc-elearnjs" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {
    // do nothing
}
