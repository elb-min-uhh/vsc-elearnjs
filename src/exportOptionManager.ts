"use strict";

import HtmlExportOptionObject from 'markdown-elearnjs/out/objects/export/HtmlExportOptionObject';
import PdfExportOptionObject from 'markdown-elearnjs/out/objects/export/PdfExportOptionObject';
import ExtensionObject from 'markdown-elearnjs/out/objects/ExtensionObject';
import * as vscode from 'vscode';
import ISerializable from "./iSerializable";
import OptionMenuManager from "./optionMenu/optionMenuManager";

class ExportOptionManager implements ISerializable {
    private optionMenuManager: OptionMenuManager;
    private lastHtmlOptions = new HtmlExportOptionObject();
    private lastPdfOptions = new PdfExportOptionObject();

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

    public async openHtmlExportOptions(
        forcePrompt: boolean,
        defaults: HtmlExportOptionObject,
        config: vscode.WorkspaceConfiguration) {
        if(!forcePrompt && this.lastHtmlOptions) return this.lastHtmlOptions;

        let method = config.general.extensionDetection.detectExtensionsMethod;
        let body = "";

        // TODO save last options, use here
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

    public async openPdfExportOptions(
        forcePrompt: boolean,
        defaults: PdfExportOptionObject,
        config: vscode.WorkspaceConfiguration) {
        if(!forcePrompt && this.lastPdfOptions) return this.lastPdfOptions;

        let method = config.general.extensionDetection.detectExtensionsMethod;
        let body = "";

        // TODO save last options, use here
        body += this.getLanguageBlock(defaults.language!);
        body += this.getConversionBlock(defaults.removeComments!);
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
        if(config.general.export.alwaysDisplayExportOptions !== result.values.displayExportOptions) {
            await config.update(
                "general.export.alwaysDisplayExportOptions",
                result.values.displayExportOptions,
                vscode.ConfigurationTarget.Global);
        }

        return this.lastPdfOptions;
    }

    public getHtmlDefaults(extensions: ExtensionObject, config: vscode.WorkspaceConfiguration) {
        let method = config.general.extensionDetection.detectExtensionsMethod;

        let extensionDefaults;

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
                includeQuiz: this.lastHtmlOptions.includeQuiz,
                includeElearnVideo: this.lastHtmlOptions.includeElearnVideo,
                includeClickImage: this.lastHtmlOptions.includeClickImage,
                includeTimeSlider: this.lastHtmlOptions.includeTimeSlider,
            });
        }
        else {
            extensionDefaults = extensions;
        }

        return new HtmlExportOptionObject({
            language: this.lastHtmlOptions.language || "en",
            removeComments: this.lastHtmlOptions.removeComments === undefined ? false : this.lastHtmlOptions.removeComments,
            exportAssets: this.lastHtmlOptions.exportAssets === undefined ? true : this.lastHtmlOptions.exportAssets,
            exportLinkedFiles: this.lastHtmlOptions.exportLinkedFiles === undefined ? true : this.lastHtmlOptions.exportLinkedFiles,
            includeQuiz: extensionDefaults.includeQuiz,
            includeElearnVideo: extensionDefaults.includeElearnVideo,
            includeClickImage: extensionDefaults.includeClickImage,
            includeTimeSlider: extensionDefaults.includeTimeSlider,
        });
    }

    public getPdfDefaults(extensions: ExtensionObject, config: vscode.WorkspaceConfiguration) {
        let method = config.general.extensionDetection.detectExtensionsMethod;

        let extensionDefaults;

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
                includeQuiz: this.lastHtmlOptions.includeQuiz,
                includeElearnVideo: this.lastHtmlOptions.includeElearnVideo,
                includeClickImage: this.lastHtmlOptions.includeClickImage,
                includeTimeSlider: this.lastHtmlOptions.includeTimeSlider,
            });
        }
        else {
            extensionDefaults = extensions;
        }

        return new PdfExportOptionObject({
            language: this.lastPdfOptions.language || "en",
            removeComments: this.lastPdfOptions.removeComments === undefined ? false : this.lastPdfOptions.removeComments,
            includeQuiz: extensionDefaults.includeQuiz,
            includeElearnVideo: extensionDefaults.includeElearnVideo,
            includeClickImage: extensionDefaults.includeClickImage,
            includeTimeSlider: extensionDefaults.includeTimeSlider,
        });
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
     * @param defaultRemoveComments the default value of the removeCommets checkbox
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
     *  Creates the extension block.
     * @param defaultQuiz the default value of the includeQuiz checkbox
     * @param defaultVideo the default value of the includeElearnVideo checkbox
     * @param defaultClickimage the default value of the includeClickImage checkbox
     * @param defaultTimeslider the default value of the includeTimeSlider checkbox
     */
    private getExtensionsBlock(
        method: string,
        defaultQuiz: boolean, defaultVideo: boolean,
        defaultClickimage: boolean, defaultTimeslider: boolean) {
        let content = "";

        // TODO use setting
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
            defaultClickimage);
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
