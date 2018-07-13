"use strict";

import * as vscode from 'vscode';
import FileWriter from './fileWriter';

/**
 * Created from the activation command. Will manage the extensions behavior.
 */
class Extension {
    public static instance: Extension;

    private context: vscode.ExtensionContext;
    private fileWriter: FileWriter;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.fileWriter = new FileWriter();

        this.registerCommands();
    }

    /**
     * Start the actual Extension by creating its static instance.
     * @param context
     */
    public static start(context: vscode.ExtensionContext) {
        Extension.instance = new Extension(context);
    }

    private registerCommands() {
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with  registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('vsc-elearnjs.to-html', () => {
            // The code you place here will be executed every time your command is executed

            this.fileWriter.onSaveHtml();
        });

        this.context.subscriptions.push(disposable);
    }
}

export default Extension;
