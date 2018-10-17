"use strict";

import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

/**
 * Class to display prompts based on webviews, to allow user friendly option
 * selection.
 */
class WebviewPrompt {
    private static WEBVIEW_TEMPLATE: string;
    private static WEBVIEW_STYLES: string;

    public static openDialog(heading: string, body: string, buttons: string[], context: vscode.ExtensionContext) {
        let ret = new Promise<any>((res, rej) => {
            let returnCode = -1;
            let values: any;

            let style = WebviewPrompt.getStyles();
            let buttonGroup = WebviewPrompt.createButtonGroup(buttons);

            // Display a message box to the user
            const panel = vscode.window.createWebviewPanel(
                'vsc-elearn.export-options',
                heading,
                vscode.ViewColumn.Active, { enableScripts: true });

            panel.webview.html = WebviewPrompt.getTemplate()
                .replace(/\$\$style\$\$/g, style)
                .replace(/\$\$heading\$\$/g, heading)
                .replace(/\$\$body\$\$/g, body)
                .replace(/\$\$buttongroup\$\$/g, buttonGroup);

            panel.onDidDispose(() => {
                let obj = {
                    values,
                    return: returnCode,
                };
                if(returnCode === -2) {
                    rej(obj);
                }
                else {
                    res(obj);
                }
            });

            panel.webview.onDidReceiveMessage((msg) => {
                switch(msg.command) {
                    case 'close':
                        values = msg.values;
                        returnCode = msg.return;
                        panel.dispose();
                        break;
                    default:
                        values = msg;
                        returnCode = -2;
                        panel.dispose();
                        break;
                }
            }, undefined, context.subscriptions);
        });

        return ret;
    }

    private static createButtonGroup(buttons: string[]) {
        let buttonText = "";
        for(let i = buttons.length - 1; i >= 0; i--) {
            let primary = i === buttons.length - 1 ? 'btn-primary focus' : '';
            buttonText += `<button class="btn ${primary}" id="btn-${i}">${buttons[i]}</button>`;
        }
        return `<div class="btn-group">${buttonText}</div>`;
    }

    private static getTemplate() {
        if(!WebviewPrompt.WEBVIEW_TEMPLATE) {
            WebviewPrompt.WEBVIEW_TEMPLATE = fs.readFileSync(path.join(__dirname, "..", "assets", "webview_template.html"), "utf8");
        }
        return WebviewPrompt.WEBVIEW_TEMPLATE;
    }

    private static getStyles() {
        if(!WebviewPrompt.WEBVIEW_STYLES) {
            WebviewPrompt.WEBVIEW_STYLES = fs.readFileSync(path.join(__dirname, "..", "styles", "webview.css"), "utf8");
        }
        return WebviewPrompt.WEBVIEW_STYLES;
    }
}

export default WebviewPrompt;
