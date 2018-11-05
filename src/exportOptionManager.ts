import { ExtensionObject, HtmlExportOptionObject, PdfExportOptionObject } from 'markdown-elearnjs';
import * as vscode from 'vscode';
import ISerializable from "./iSerializable";
import OptionMenuManager from "./optionMenu/optionMenuManager";

/**
 * The Manager class for export options. Handles user prompts.
 */
class ExportOptionManager implements ISerializable {
    private optionMenuManager: OptionMenuManager;
    private lastHtmlOptions = new HtmlExportOptionObject({
        language: "en",
        removeComments: false,
        exportAssets: true,
        exportLinkedFiles: true,
    });
    private lastPdfOptions = new PdfExportOptionObject({
        language: "en",
        removeComments: false,
    });

    public constructor(oem: OptionMenuManager) {
        this.optionMenuManager = oem;
    }

    public serialize() {
        return {
            htmlOptions: this.lastHtmlOptions,
            pdfOptions: this.lastPdfOptions,
        };
    }

    public deserialize(state: { [key: string]: any }) {
        if(state.htmlOptions) this.lastHtmlOptions = state.htmlOptions;
        if(state.pdfOptions) this.lastPdfOptions = state.pdfOptions;
    }

    /**
     * Open the Html export option Webview.
     * @param forcePrompt force a prompt (true) or use stored values
     * @param defaults calculated defaults from `getHtmlDefaults`
     * @param config the current vsc-elearnjs config object
     */
    public async openHtmlExportOptions(
        forcePrompt: boolean,
        defaults: HtmlExportOptionObject,
        config: vscode.WorkspaceConfiguration) {
        if(!forcePrompt && this.lastHtmlOptions) return this.lastHtmlOptions;

        let method = config.general.extensionDetection.detectExtensionsMethod;
        let body = "";

        body += this.getLanguageBlock(defaults.language!);
        body += this.getConversionBlock(defaults.removeComments!);
        body += this.getAssetsExportBlock(
            defaults.exportAssets!,
            defaults.exportLinkedFiles!);
        body += this.getExtensionsBlock(method,
            defaults.includeQuiz!,
            defaults.includeElearnVideo!,
            defaults.includeClickImage!,
            defaults.includeTimeSlider!);
        body += this.getGeneralsBlock(config.general.export.alwaysDisplayExportOptions);

        let result = await this.optionMenuManager.open(
            "HTML Export Options",
            body,
            ["Cancel", "Ok"]);

        // stop here if canceled
        if(result.returnValue <= 0) return undefined;

        this.lastHtmlOptions = new HtmlExportOptionObject(result.values);
        if(config.general.export.alwaysDisplayExportOptions !== result.values.displayExportOptions) {
            await config.update(
                "general.export.alwaysDisplayExportOptions",
                result.values.displayExportOptions,
                vscode.ConfigurationTarget.Global);
        }

        return this.lastHtmlOptions;
    }

    /**
     * Open the PDF export option Webview.
     * @param forcePrompt force a prompt (true) or use stored values
     * @param defaults calculated defaults from `getPdfDefaults`
     * @param config the current vsc-elearnjs config object
     */
    public async openPdfExportOptions(
        forcePrompt: boolean,
        defaults: PdfExportOptionObject,
        config: vscode.WorkspaceConfiguration) {
        if(!forcePrompt && this.lastPdfOptions) return this.lastPdfOptions;

        let method = config.general.extensionDetection.detectExtensionsMethod;
        let body = "";

        body += this.getLanguageBlock(defaults.language!);
        body += this.getConversionBlock(defaults.removeComments!);
        body += this.getPdfConversionBlock(defaults.renderDelay!);
        body += this.getExtensionsBlock(method,
            defaults.includeQuiz!,
            defaults.includeElearnVideo!,
            defaults.includeClickImage!,
            defaults.includeTimeSlider!);
        body += this.getGeneralsBlock(config.general.export.alwaysDisplayExportOptions);

        let result = await this.optionMenuManager.open(
            "PDF Export Options",
            body,
            ["Cancel", "Ok"]);

        // stop here if canceled
        if(result.returnValue <= 0) return undefined;

        this.lastPdfOptions = new PdfExportOptionObject(result.values);

        if(result.values.renderDelay)
            this.lastPdfOptions.renderDelay = parseFloat(result.values.renderDelay.toString()) * 1000;

        if(config.general.export.alwaysDisplayExportOptions !== result.values.displayExportOptions) {
            await config.update(
                "general.export.alwaysDisplayExportOptions",
                result.values.displayExportOptions,
                vscode.ConfigurationTarget.Global);
        }

        return this.lastPdfOptions;
    }

    /**
     * Generate a `PdfExportOptionObject` of default values displayed in a OptionMenu.
     * @param extensions the checked states of the extensions, used for method `auto`
     * @param config the current vsc-elearnjs config object
     */
    public getHtmlDefaults(extensions: ExtensionObject, config: vscode.WorkspaceConfiguration) {
        let method = config.general.extensionDetection.detectExtensionsMethod;
        let extensionDefaults = this.getExtensionDefaults(method, this.lastHtmlOptions, extensions);

        return new HtmlExportOptionObject({
            language: this.lastHtmlOptions.language,
            removeComments: this.lastHtmlOptions.removeComments,
            exportAssets: this.lastHtmlOptions.exportAssets,
            exportLinkedFiles: this.lastHtmlOptions.exportLinkedFiles,
            includeQuiz: extensionDefaults.includeQuiz,
            includeElearnVideo: extensionDefaults.includeElearnVideo,
            includeClickImage: extensionDefaults.includeClickImage,
            includeTimeSlider: extensionDefaults.includeTimeSlider,
        });
    }

    /**
     * Generate a `PdfExportOptionObject` of default values displayed in a OptionMenu.
     * @param extensions the checked states of the extensions, used for method `auto`
     * @param config the current vsc-elearnjs config object
     */
    public getPdfDefaults(extensions: ExtensionObject, config: vscode.WorkspaceConfiguration) {
        let method = config.general.extensionDetection.detectExtensionsMethod;
        let extensionDefaults = this.getExtensionDefaults(method, this.lastPdfOptions, extensions);

        return new PdfExportOptionObject({
            language: this.lastPdfOptions.language,
            removeComments: this.lastPdfOptions.removeComments,
            includeQuiz: extensionDefaults.includeQuiz,
            includeElearnVideo: extensionDefaults.includeElearnVideo,
            includeClickImage: extensionDefaults.includeClickImage,
            includeTimeSlider: extensionDefaults.includeTimeSlider,
            renderDelay: config.pdf.general.renderDelay || 0,
        });
    }

    /**
     * Calculates wether a extension should be selected for export by default
     * or not, based on the given method. A given set of a previously calculated
     * selection might be given to use if method `auto` is selected.
     * @param method the method name used to detect the extension defaults
     * @param extensions an optional set of extension default values used only
     * if `auto` is selected. If not given and `auto` is used, the values of
     * all extensions will be undefined in the object.
     */
    private getExtensionDefaults(method: string, lastValues: ExtensionObject, extensions?: ExtensionObject) {
        let extensionDefaults = new ExtensionObject();

        if(method === "on") {
            extensionDefaults = new ExtensionObject({
                includeQuiz: true, includeElearnVideo: true, includeClickImage: true, includeTimeSlider: true,
            });
        }
        else if(method === "off") {
            extensionDefaults = new ExtensionObject({
                includeQuiz: false, includeElearnVideo: false, includeClickImage: false, includeTimeSlider: false,
            });
        }
        else if(method === "last") {
            extensionDefaults = new ExtensionObject({
                includeQuiz: lastValues.includeQuiz,
                includeElearnVideo: lastValues.includeElearnVideo,
                includeClickImage: lastValues.includeClickImage,
                includeTimeSlider: lastValues.includeTimeSlider,
            });
        }
        else if(method === "auto" && extensions !== undefined) {
            extensionDefaults = extensions;
        }

        return extensionDefaults;
    }

    /**
     * Creates the language block.
     * @param defaultLanguage the default value of the language selection
     */
    private getLanguageBlock(defaultLanguage: string) {
        let content = "";

        content += OptionMenuManager.createSelectLabel(
            "language",
            [
                { text: "German", value: "de" },
                { text: "English", value: "en" },
            ],
            defaultLanguage);

        return OptionMenuManager.createBlock("Language", content);
    }

    /**
     *  Creates the conversion block.
     * @param defaultRemoveComments the default value of the removeComments checkbox
     */
    private getConversionBlock(defaultRemoveComments: boolean) {
        let content = "";

        content += OptionMenuManager.createCheckBoxLabel(
            "removeComments",
            "Remove Html Comments",
            defaultRemoveComments);

        return OptionMenuManager.createBlock("Conversion", content);
    }

    /**
     *  Creates the asset export block.
     * @param defaultExportAssets the default value of the exportAssets checkbox
     * @param defaultExportLinkedFiles the default value of the exportLinkedFiles checkbox
     */
    private getAssetsExportBlock(defaultExportAssets: boolean, defaultExportLinkedFiles: boolean) {
        let content = "";

        content += OptionMenuManager.createCheckBoxLabel(
            "exportAssets",
            "Export elearn.js assets",
            defaultExportAssets);
        content += OptionMenuManager.createCheckBoxLabel(
            "exportLinkedFiles",
            "Export linked files into asset folder (only &lt;img&gt;, &lt;source&gt;, &lt;script&gt;, &lt;link&gt;)",
            defaultExportLinkedFiles);

        return OptionMenuManager.createBlock("Asset exports", content);
    }

    /**
     * Creates the PDF Conversion Block
     * @param defaultRenderDelay the default value of the renderDelay input
     */
    private getPdfConversionBlock(defaultRenderDelay: number) {
        let content = "";

        content += OptionMenuManager.createInputNumberLabel(
            "renderDelay",
            "Render Delay (in seconds)",
            defaultRenderDelay,
            new PdfExportOptionObject().renderDelay);

        return OptionMenuManager.createBlock("PDF Conversion", content);
    }

    /**
     *  Creates the extension block.
     * @param defaultQuiz the default value of the includeQuiz checkbox
     * @param defaultVideo the default value of the includeElearnVideo checkbox
     * @param defaultClickImage the default value of the includeClickImage checkbox
     * @param defaultTimeslider the default value of the includeTimeSlider checkbox
     */
    private getExtensionsBlock(
        method: string,
        defaultQuiz: boolean, defaultVideo: boolean,
        defaultClickImage: boolean, defaultTimeslider: boolean) {
        let content = "";

        content += OptionMenuManager.createDescription(
            `Values defined by Method <em>'${method}'</em>. Check settings to change method.`);
        content += OptionMenuManager.createCheckBoxLabel(
            "includeQuiz",
            "Include quiz.js",
            defaultQuiz);
        content += OptionMenuManager.createCheckBoxLabel(
            "includeElearnVideo",
            "Include elearnvideo.js",
            defaultVideo);
        content += OptionMenuManager.createCheckBoxLabel(
            "includeClickImage",
            "Include clickimage.js",
            defaultClickImage);
        content += OptionMenuManager.createCheckBoxLabel(
            "includeTimeSlider",
            "Include timeslider.js",
            defaultTimeslider);

        return OptionMenuManager.createBlock("Extensions", content);
    }

    /**
     *  Creates the generals block.
     * @param defaultDisplayOptions the default value of the displayExportOptions checkbox
     */
    private getGeneralsBlock(defaultDisplayOptions: boolean) {
        let content = "";

        content += OptionMenuManager.createCheckBoxLabel(
            "displayExportOptions",
            "Always display export options",
            defaultDisplayOptions);

        return OptionMenuManager.createBlock("General", content);
    }
}

export default ExportOptionManager;
