"use strict";

import * as vscode from 'vscode';
// import FileWriter from './fileWriter';
import WebviewPrompt from './optionMenu/webviewPrompt';

/**
 * Created from the activation command. Will manage the extensions behavior.
 */
class Extension {
    public static instance: Extension;

    private context: vscode.ExtensionContext;
    // private fileWriter: FileWriter;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        // this.fileWriter = new FileWriter();

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
        let disposable = vscode.commands.registerCommand('vsc-elearnjs.to-html', async () => {
            // The code you place here will be executed every time your command is executed
            // this.fileWriter.onSaveHtml();

            let config = vscode.workspace.getConfiguration('vsc-elearnjs');
            console.log("Config", config.general.extensionDetection.detectExtensionsMethod);
            /*
            await config.update('general.extensionDetection.detectExtensionsMethod', "off", vscode.ConfigurationTarget.Workspace);
            config = vscode.workspace.getConfiguration('vsc-elearnjs');
            console.log("Config", config.general.extensionDetection.detectExtensionsMethod);
             */

            let options = await WebviewPrompt.openDialog(
                "HTML Export Options",
                `<h4>Heading 1</h4>
                <label><select id="select1" name="select-one"><option value="1">one</option><option value="2">two</option></select></label>
                <label>Text: <input name="input-one" /></label>
                <h4>Heading 2</h4>
                <span class="description">I will try to <em>explain</em> some stuff here.</span>
                <label><input type="checkbox" name="checkbox-one"/><span>Check or not?</span></label>`, ["Cancel", "Ok"], this.context);

            console.log("Export Option Return", options);
        });

        this.context.subscriptions.push(disposable);
    }
}

export default Extension;
