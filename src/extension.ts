'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { HtmlConverter } from 'markdown-elearnjs';
import HtmlExportOptionObject from 'markdown-elearnjs/out/objects/export/HtmlExportOptionObject';
import * as path from 'path';
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vsc-elearnjs" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('vsc-elearnjs.to-html', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');

        if(vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.languageId === "markdown") {
            let file = vscode.window.activeTextEditor.document.uri.fsPath;
            let outputFile = file.substr(0, file.length - path.extname(file).length) + ".html";

            let htmlConverter = new HtmlConverter();
            let exportOptions = new HtmlExportOptionObject({
                automaticExtensionDetection: true,
                exportAssets: true,
                exportLinkedFiles: true,
            });

            htmlConverter.toFile(vscode.window.activeTextEditor.document.getText(), outputFile, path.dirname(file), exportOptions, true).then((filename) => {
                console.log("Saved at:", filename);
            }, (err) => console.error(err));
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
    // do nothing
}
