import * as vscode from 'vscode';
import FileWriter from './fileWriter';
import ISerializable from './iSerializable';
import OptionMenuManager from './optionMenu/optionMenuManager';
import PuppeteerChecker from './puppeteerChecker';

/**
 * Created from the activation command. Will manage the extensions behavior.
 */
class Extension implements ISerializable {
    /**
     * The singleton instance of the Extension.
     */
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

    /**
     * Stop the extension. This might save current settings and initiate
     * everything which should be done before shutting down the extension.
     */
    public static async stop() {
        await Extension.INSTANCE.checkChromiumRemoval(true);
        await Extension.INSTANCE.storeSerialization();
    }

    /**
     * Will serialize this object, which should include the state of everything
     * in the extension and stores it in the context state of VSCode, so the
     * current state is saved.
     */
    public async storeSerialization() {
        await this.context.globalState.update("serialization", this.serialize());
    }

    public serialize() {
        return {
            fileWriter: this.fileWriter.serialize(),
        };
    }

    public deserialize(state: { [key: string]: any }) {
        if(state.fileWriter) this.fileWriter.deserialize(state.fileWriter);
    }

    /**
     * Check the current chromium status. Might download or prompt to download
     * Chromium or otherwise remove the existing files if not needed anymore.
     * @param remove Whether existing bundled chromium versions should be removed
     * if the current configuration makes them unnecessary or not.
     */
    private async checkChromium(remove: boolean) {
        // check if chromium was downloaded already
        this.checkChromiumDownload();
        this.checkChromiumRemoval(remove);
    }

    /**
     * Check if chromium needs to be downloaded. Initiate the download if so.
     */
    private async checkChromiumDownload() {
        let chromeConfig = vscode.workspace.getConfiguration('vsc-elearnjs.pdf.chrome');
        if(chromeConfig.downloadChrome) {
            if(!PuppeteerChecker.checkChromium()) await PuppeteerChecker.INSTANCE.downloadChromium();
        }
    }

    /**
     * Check if the local chromium version needs to be removed or the user
     * needs to be informed about a removal and not working PDF conversion.
     * @param remove Whether existing bundled chromium versions should be removed
     * if the current configuration makes them unnecessary or not.
     */
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

    /**
     * Register the command listeners of the extension.
     */
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

    /**
     * Register the config listeners of the extension.
     */
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
