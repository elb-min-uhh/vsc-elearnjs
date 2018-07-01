"use strict";

import { format } from 'util';
import * as vscode from 'vscode';

/**
 * Class to display prompts based on webviews, to allow user friendly option
 * selection.
 */
class WebviewPrompt {
    public static show(context: vscode.ExtensionContext) {
        // Display a message box to the user
        const panel = vscode.window.createWebviewPanel(
            'vsc-elearn.export-options',
            "Export Options",
            vscode.ViewColumn.One, { enableScripts: true });

        panel.webview.html = `<!DOCTYPE html>
                <html lang="en">
                    <head>
                        <script>
                            (function() {
                                const vscode = acquireVsCodeApi();
                                window.onload = function() {
                                    console.log("onload");
                                    const submit = function() {
                                        console.log("submit");
                                        var code = document.getElementById("select1").value;
                                        vscode.postMessage({
                                            command: 'close',
                                            code: code,
                                        });
                                    }

                                    document.getElementById("button1").onclick = submit;
                                    console.log("onload done");
                                };
                            })();
                        </script>
                    </head>
                    <body>
                        <select id="select1"><option value="1">one</option><option value="2">two</option></select>
                        <button id="button1">Ok</button>
                    </body>
                </html>`;

        panel.webview.onDidReceiveMessage((msg) => {
            switch(msg.command) {
                case 'close':
                    vscode.window.showInformationMessage(format("Code was: %s", msg.code));
                    panel.dispose();
                    break;
            }
        }, undefined, context.subscriptions);
    }
}

export default WebviewPrompt;
