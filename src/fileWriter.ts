"use strict";

import { PathLike } from 'fs';
import * as mejs from 'markdown-elearnjs';
import * as path from 'path';
import * as vscode from 'vscode';
import ExportOptionManager from './exportOptionManager';
import ISerializable from './iSerializable';
import OptionMenuManager from './optionMenu/optionMenuManager';
import PuppeteerChecker from './puppeteerChecker';

/**
 * Manages the actual markdown to file conversion and saving.
 */
class FileWriter implements ISerializable {

    private exportOptionManager: ExportOptionManager;
    private htmlConverter: mejs.HtmlConverter;
    private pdfConverter: mejs.PdfConverter;

    private saveLocations: { [extension: string]: { [inputFile: string]: string } } = {
        html: {},
        pdf: {},
    };

    constructor(optionMenuManager: OptionMenuManager) {
        this.exportOptionManager = new ExportOptionManager(optionMenuManager);
        this.htmlConverter = new mejs.HtmlConverter();
        this.pdfConverter = new mejs.PdfConverter();
    }

    public serialize() {
        return {
            saveLocations: this.saveLocations,
            exportOptionManager: this.exportOptionManager.serialize(),
        };
    }

    public deserialize(state: { [key: string]: any }) {
        let config = vscode.workspace.getConfiguration('vsc-elearnjs');

        if(state.saveLocations && config.general.export.keepSaveLocations) this.saveLocations = state.saveLocations;
        if(state.exportOptionManager) this.exportOptionManager.deserialize(state.exportOptionManager);
    }

    public async onSaveAs() {
        if(vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.languageId === "markdown") {
            let outputFile = await this.getSavePath({ HTML: ["html", "htm"], PDF: ["pdf"] });
            if(!outputFile) return;

            let fileType = path.extname(outputFile);

            switch(fileType.toLowerCase()) {
                case ".html":
                    await this.saveHtml(outputFile);
                    break;
                case ".pdf":
                    await this.savePdf(outputFile);
                    break;
                default:
                    throw new Error("Unknown file extension.");
            }
        }
    }

    public async onSaveHtml() {
        if(vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.languageId === "markdown") {
            let inputFile = vscode.window.activeTextEditor.document.uri.fsPath;
            let outputFile;

            if(this.saveLocations.html[inputFile]) outputFile = this.saveLocations.html[inputFile];
            else outputFile = await this.getSavePath({ HTML: ["html", "htm"] });
            if(!outputFile) return;

            await this.saveHtml(outputFile);
        }
    }

    public async onSavePdf() {
        if(vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.languageId === "markdown") {
            let inputFile = vscode.window.activeTextEditor.document.uri.fsPath;
            let outputFile;

            if(this.saveLocations.pdf[inputFile]) outputFile = this.saveLocations.pdf[inputFile];
            else outputFile = await this.getSavePath({ PDF: ["pdf"] });
            if(!outputFile) return;

            try {
                await this.savePdf(outputFile);
            } catch(err) {
                // display error about settings, if conversion crashes
                let chromeConfig = vscode.workspace.getConfiguration('vsc-elearnjs.pdf.chrome');
                if(!PuppeteerChecker.checkChromium()
                    && !chromeConfig.downloadChrome
                    && !chromeConfig.path) {
                    let activate = "Activate Download";
                    let resolve = await vscode.window.showWarningMessage(
                        "Chromium download disabled and no path set. Pdf conversion is not possible.",
                        activate);
                    // activate download if clicked
                    if(resolve === activate) {
                        await chromeConfig.update('downloadChrome', true, vscode.ConfigurationTarget.Global);
                    }
                }
                else if(!PuppeteerChecker.checkChromium()
                    && !chromeConfig.path) {
                    vscode.window.showWarningMessage("Chromium is not downloaded. Try to restart VSCode.");
                }
                else throw err;
            }
        }
    }

    public async saveHtml(outputFile: PathLike) {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "HTML Conversion",
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "Waiting for Start..." });
            if(!vscode.window.activeTextEditor) throw new Error("No active text editor");

            let config = vscode.workspace.getConfiguration('vsc-elearnjs');
            let text = vscode.window.activeTextEditor.document.getText();
            let inputFile = vscode.window.activeTextEditor.document.uri.fsPath;

            this.htmlConverter.setOptions(this.getHtmlConverterOptions(config));

            let extensions = await mejs.ExtensionManager.scanMarkdownForAll(text, this.htmlConverter);
            let options = await this.exportOptionManager.openHtmlExportOptions(
                config.general.export.alwaysDisplayExportOptions,
                this.exportOptionManager.getHtmlDefaults(extensions, config),
                config);

            progress.report({ message: "Running..." });

            // was canceled
            if(!options) return;
            let filename = await this.htmlConverter.toFile(
                text,
                outputFile.toString(),
                path.dirname(inputFile),
                options,
                true);

            this.saveLocations.html[inputFile] = filename;
            console.log("Saved at:", filename);
            vscode.window.showInformationMessage("HTML File saved successfully.");
        });
    }

    public async savePdf(outputFile: PathLike) {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "PDF Conversion",
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "Waiting for Start..." });
            if(!vscode.window.activeTextEditor) throw new Error("No active text editor");

            let config = vscode.workspace.getConfiguration('vsc-elearnjs');
            let text = vscode.window.activeTextEditor.document.getText();
            let inputFile = vscode.window.activeTextEditor.document.uri.fsPath;

            this.pdfConverter.setOptions(this.getPdfConverterOptions(config));

            let extensions = await mejs.ExtensionManager.scanMarkdownForAll(text, this.pdfConverter);
            let options = await this.exportOptionManager.openPdfExportOptions(
                config.general.export.alwaysDisplayExportOptions,
                this.exportOptionManager.getPdfDefaults(extensions, config),
                config);

            progress.report({ message: "Running..." });

            // was canceled
            if(!options) return;
            let filename = await this.pdfConverter.toFile(
                text,
                outputFile.toString(),
                path.dirname(inputFile),
                options,
                true);

            this.saveLocations.pdf[inputFile] = filename;
            console.log("Saved at:", filename);
            vscode.window.showInformationMessage("PDF File saved successfully.");
        });
    }

    public onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
        if(e.affectsConfiguration('vsc-elearnjs.pdf.chrome.keepChromeAlive')) {
            let chromeConfig = vscode.workspace.getConfiguration('vsc-elearnjs.pdf.chrome');
            this.pdfConverter.setOption("keepChromeAlive", chromeConfig.keepChromeAlive);
        }
    }

    private getGeneralConverterOptions(config: vscode.WorkspaceConfiguration) {
        return new mejs.ConverterSettingsObject({
            newSectionOnHeading: config.general.section.newSectionOnHeading,
            headingDepth: config.general.section.newSectionOnHeadingDepth,
            useSubSections: config.general.sectionLevels.enableSectionLevels,
            subSectionLevel: config.general.sectionLevels.subsectionLevel,
            subsubSectionLevel: config.general.sectionLevels.subSubsectionLevel,
        });
    }

    private getHtmlConverterOptions(config: vscode.WorkspaceConfiguration) {
        let settings = this.getGeneralConverterOptions(config);
        return settings;
    }

    private getPdfConverterOptions(config: vscode.WorkspaceConfiguration) {
        let settings = new mejs.PdfSettingsObject(this.getGeneralConverterOptions(config));
        settings.newPageOnSection = config.pdf.general.newPageOnSection;
        settings.contentZoom = config.pdf.general.zoom;
        settings.customHeader = config.pdf.headerAndFooter.header;
        settings.headerHeight = config.pdf.headerAndFooter.headerHeight;
        settings.customFooter = config.pdf.headerAndFooter.footer;
        settings.footerHeight = config.pdf.headerAndFooter.footerHeight;
        settings.customStyleFile = config.pdf.custom.styleFile;
        settings.chromePath = config.pdf.chrome.path;
        settings.keepChromeAlive = config.pdf.chrome.keepChromeAlive;
        return settings;
    }

    private async getSavePath(fileExtensions: { [key: string]: string[] }) {
        if(!vscode.window.activeTextEditor) return;

        let inputUri = vscode.window.activeTextEditor.document.uri;

        let pathString = path.join(
            path.dirname(inputUri.fsPath),
            path.basename(inputUri.fsPath, path.extname(inputUri.fsPath))).replace(path.sep, "/");
        let extlessUri = inputUri.with({ path: pathString });

        // determine save position
        let uri = await vscode.window.showSaveDialog({
            defaultUri: extlessUri,
            filters: fileExtensions,
        });
        if(!uri) return;

        return uri.fsPath;
    }
}

export default FileWriter;
