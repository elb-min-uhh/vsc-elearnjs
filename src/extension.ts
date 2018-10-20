"use strict";

import * as vscode from 'vscode';
// import FileWriter from './fileWriter';
import ExportOptionManager from './exportOptionManager';
import ISerializable from './iSerializable';
import OptionMenuManager from './optionMenu/optionMenuManager';

/**
 * Created from the activation command. Will manage the extensions behavior.
 */
class Extension implements ISerializable {
    public static INSTANCE: Extension;

    private context: vscode.ExtensionContext;
    private optionMenuManager: OptionMenuManager;
    private exportOptionManager: ExportOptionManager;
    // private fileWriter: FileWriter;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.optionMenuManager = new OptionMenuManager(context);
        this.exportOptionManager = new ExportOptionManager(this.optionMenuManager);
        // this.fileWriter = new FileWriter();

        this.registerCommands();
    }

    /**
     * Start the actual Extension by creating its static instance.
     * @param context
     */
    public static start(context: vscode.ExtensionContext) {
        Extension.INSTANCE = new Extension(context);
        console.log(context.globalState.get("serialization"));
        Extension.INSTANCE.deserialize(context.globalState.get("serialization") || {});
    }

    public static async stop() {
        await Extension.INSTANCE.storeSerialization();
    }

    public serialize() {
        return {
            exportOptionManager: this.exportOptionManager.serialize(),
        };
    }

    public deserialize(state: { [key: string]: any }) {
        if(state.exportOptionManager) this.exportOptionManager.deserialize(state.exportOptionManager);
    }

    public async storeSerialization() {
        await this.context.globalState.update("serialization", this.serialize());
    }

    private registerCommands() {
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with  registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('vsc-elearnjs.to-html', async () => {
            // The code you place here will be executed every time your command is executed
            // this.fileWriter.onSaveHtml();

            let config = vscode.workspace.getConfiguration('vsc-elearnjs');
            console.log("Config", config.general.extensionDetection.detectExtensionsMethod);

            let htmlDefaults = this.exportOptionManager.getHtmlDefaults({}, config);
            let options = await this.exportOptionManager.openHtmlExportOptions(
                config.general.export.alwaysDisplayExportOptions, htmlDefaults, config);
            console.log("HTML Export Option Return", options);
            await this.storeSerialization();

            let pdfDefaults = this.exportOptionManager.getPdfDefaults({}, config);
            options = await this.exportOptionManager.openPdfExportOptions(
                config.general.export.alwaysDisplayExportOptions, pdfDefaults, config);
            console.log("PDF Export Option Return", options);
            await this.storeSerialization();
        });

        this.context.subscriptions.push(disposable);
    }
}

export default Extension;
