'use strict';

import cp from 'child_process';
import fs from 'fs';
import util from 'util';
import * as vscode from 'vscode';
import Extension from './extension';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    // download chromium if not done already, asynchronously
    if(!fs.existsSync(__dirname + "/../node_modules/puppeteer/.local-chromium")) {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "vsc-elearnjs",
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "Chromium is not installed. Installing..." });
            let exec = util.promisify(cp.execFile);
            try {
                let std = await exec(process.execPath, [__dirname + "/../node_modules/puppeteer/install.js"]);
                if(std.stderr && std.stderr.trim().length > 0) {
                    console.log(std.stderr);
                    vscode.window.showErrorMessage(
                        "vsc-elearnjs: Chrome installation failed with an unknown error.\r\n"
                        + std.stderr + "\r\n"
                        + std.stdout);
                }
                else {
                    vscode.window.showInformationMessage("vsc-elearnjs: PDF Conversion is now possible.");
                }
            } catch(err) {
                vscode.window.showErrorMessage("vsc-elearnjs:", err);
            }
        });
    }

    Extension.start(context);

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('"vsc-elearnjs" started.');
}

// this method is called when your extension is deactivated
export async function deactivate() {
    await Extension.stop();
}
