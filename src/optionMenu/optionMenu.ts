"use strict";

import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import OptionMenuResult from './optionMenuResult';

/**
 * Class to display prompts based on webviews, to allow user friendly option
 * selection.
 */
class OptionMenu {
    private static WEBVIEW_TEMPLATE: string;
    private static WEBVIEW_STYLES: string;

    private panel: vscode.WebviewPanel;
    private result?: OptionMenuResult;
    private closed = false;
    private resolved = false;

    private resolve?: (result: OptionMenuResult) => any;

    /**
     * Create a OptionMenu
     * @param heading the OptionMenu heading. Should only include simple HTML
     * @param body the body of the OptionMenu. Should contain all the inputs/selects
     * @param buttons an array of buttons to use for OptionMenu closing
     * @param context the extensions context
     */
    public constructor(heading: string, body: string, buttons: string[], context?: vscode.ExtensionContext) {
        let style = OptionMenu.getStyles();
        let buttonGroup = OptionMenu.createButtonGroup(buttons);

        // Create the (empty) panel
        this.panel = vscode.window.createWebviewPanel(
            'vsc-elearn.export-options',
            heading,
            vscode.ViewColumn.Active,
            { enableScripts: true });

        // set the content
        this.panel.webview.html = OptionMenu.getTemplate()
            .replace(/\{\{style\}\}/g, `<style>${style}</style>`)
            .replace(/\{\{heading\}\}/g, heading)
            .replace(/\{\{body\}\}/g, body)
            .replace(/\{\{buttongroup\}\}/g, buttonGroup);

        this.addDisposeListener();
        this.addMessageListener(context);
    }

    /**
     * Create the button group used to close the OptionMenu.
     * The OptionMenuResult.returnValue will be defined by the index of
     * the button in the buttons array in this method.
     * @param buttons The button texts.
     */
    private static createButtonGroup(buttons: string[]) {
        let buttonText = "";
        for(let i = buttons.length - 1; i >= 0; i--) {
            let primary = i === buttons.length - 1 ? 'btn-primary focus' : '';
            buttonText += `<button class="btn ${primary}" id="btn-${i}">${buttons[i]}</button>`;
        }
        return `<div class="btn-group">${buttonText}</div>`;
    }

    /**
     * Get the OptionMenu HTML template from the file.
     */
    private static getTemplate() {
        if(!OptionMenu.WEBVIEW_TEMPLATE) {
            OptionMenu.WEBVIEW_TEMPLATE = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "webview_template.html"), "utf8");
        }
        return OptionMenu.WEBVIEW_TEMPLATE;
    }

    /**
     * Get the OptionMenu CSS Styles from the file.
     */
    private static getStyles() {
        if(!OptionMenu.WEBVIEW_STYLES) {
            OptionMenu.WEBVIEW_STYLES = fs.readFileSync(path.join(__dirname, "..", "..", "styles", "webview.css"), "utf8");
        }
        return OptionMenu.WEBVIEW_STYLES;
    }

    /**
     * Close the OptionMenu.
     */
    public close() {
        this.panel.dispose();
    }

    /**
     * Add a Listener to the OptionMenu close event. This will be triggered,
     * whenever the OptionMenus Webview is closed.
     * @param resolve The callback to be called on close.
     */
    public onClose(resolve: (result: OptionMenuResult) => any) {
        if(this.resolve !== undefined) {
            throw new Error("Resolve listener was already set.");
        }

        this.resolve = resolve;

        if(this.isClosed() && !this.resolved) {
            resolve(this.result || new OptionMenuResult({}, -1));
            this.resolved = true;
        }
    }

    /**
     * Returns if the OptionMenu was closed already.
     */
    public isClosed() {
        return this.closed;
    }

    /**
     * Adds the dispose listener, to trigger events on Webview disposal.
     */
    private addDisposeListener() {
        this.panel.onDidDispose(() => {
            this.closed = true;
            if(this.resolve && !this.resolved) {
                this.resolve(this.result || new OptionMenuResult({}, -1));
                this.resolved = true;
            }
        });
    }

    /**
     * Adds a listener, listening for WebviewMessages. Those will be send,
     * when clicking on a button.
     * @param context the extensions context
     */
    private addMessageListener(context?: vscode.ExtensionContext) {
        this.panel.webview.onDidReceiveMessage((msg) => {
            switch(msg.command) {
                case 'close':
                    this.result = new OptionMenuResult(msg.values, msg.return);
                    this.panel.dispose();
                    break;
                default:
                    this.result = new OptionMenuResult(msg.values, -1);
                    this.panel.dispose();
                    break;
            }
        }, undefined, context ? context.subscriptions : undefined);
    }


}

export default OptionMenu;
