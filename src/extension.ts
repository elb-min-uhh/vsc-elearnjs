"use strict";

import * as vscode from 'vscode';
import FileWriter from './fileWriter';
import ISerializable from './iSerializable';
import OptionMenuManager from './optionMenu/optionMenuManager';
import PuppeteerChecker from './puppeteerChecker';

/**
 * Created from the activation command. Will manage the extensions behavior.
 */
class Extension implements ISerializable {
    public static INSTANCE: Extension;

    private context: vscode.ExtensionContext;
    private optionMenuManager: OptionMenuManager;
    private fileWriter: FileWriter;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.optionMenuManager = new OptionMenuManager(context);
        this.fileWriter = new FileWriter(this.optionMenuManager);

        this.registerCommands();
        this.registerConfigListener();
        this.checkChromium(true);
    }

    /**
     * Start the actual Extension by creating its static instance.
     * @param context
     */
    public static start(context: vscode.ExtensionContext) {
        if(Extension.INSTANCE === undefined) {
            Extension.INSTANCE = new Extension(context);
            Extension.INSTANCE.deserialize(context.globalState.get("serialization") || {});
        }
    }

    public static async stop() {
        await Extension.INSTANCE.checkChromiumRemoval(true);
        await Extension.INSTANCE.storeSerialization();
    }

    public serialize() {
        return {
            fileWriter: this.fileWriter.serialize(),
        };
    }

    public deserialize(state: { [key: string]: any }) {
        if(state.fileWriter) this.fileWriter.deserialize(state.fileWriter);
    }

    public async storeSerialization() {
        await this.context.globalState.update("serialization", this.serialize());
    }

    private async checkChromium(remove: boolean) {
        // check if chromium was downloaded already
        this.checkChromiumDownload();
        this.checkChromiumRemoval(remove);
    }

    private async checkChromiumDownload() {
        let chromeConfig = vscode.workspace.getConfiguration('vsc-elearnjs.pdf.chrome');
        if(chromeConfig.downloadChrome) {
            if(!PuppeteerChecker.checkChromium()) await PuppeteerChecker.INSTANCE.downloadChromium();
        }
    }

    private async checkChromiumRemoval(remove: boolean) {
        let chromeConfig = vscode.workspace.getConfiguration('vsc-elearnjs.pdf.chrome');
        if(!chromeConfig.downloadChrome) {
            PuppeteerChecker.INSTANCE.stopDownload();
            if(remove) await PuppeteerChecker.INSTANCE.removeChromium();
            if(!chromeConfig.path) {
                let activate = "Activate Download";
                let resolve = await vscode.window.showWarningMessage(
                    "Chromium download disabled and no path set. Pdf conversion is not possible.",
                    activate);
                // activate download if clicked
                if(resolve === activate) {
                    await chromeConfig.update('downloadChrome', true, vscode.ConfigurationTarget.Global);
                }
            }
        }
    }

    private registerCommands() {
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with  registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('vsc-elearnjs.to-html', async () => {
            // The code you place here will be executed every time your command is executed
            await this.fileWriter.onSaveHtml();
            await this.storeSerialization();
        });
        this.context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('vsc-elearnjs.to-pdf', async () => {
            // The code you place here will be executed every time your command is executed
            await this.fileWriter.onSavePdf();
            await this.storeSerialization();
        });
        this.context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('vsc-elearnjs.save-as', async () => {
            // The code you place here will be executed every time your command is executed
            await this.fileWriter.onSaveAs();
            await this.storeSerialization();
        });
        this.context.subscriptions.push(disposable);
    }

    private registerConfigListener() {
        vscode.workspace.onDidChangeConfiguration((e) => {
            if(e.affectsConfiguration('vsc-elearnjs.pdf.chrome')) {
                this.checkChromium(false);
                this.fileWriter.onDidChangeConfiguration(e);
            }
        });
    }
}

export default Extension;
