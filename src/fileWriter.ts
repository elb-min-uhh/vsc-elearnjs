"use strict";

import { PathLike } from 'fs';
import { ExtensionManager, HtmlConverter, PdfConverter } from 'markdown-elearnjs';
import ConverterSettingsObject from 'markdown-elearnjs/out/objects/settings/ConverterSettingsObject';
import PdfSettingsObject from 'markdown-elearnjs/out/objects/settings/PdfSettingsObject';
import * as path from 'path';
import * as vscode from 'vscode';
import ExportOptionManager from './exportOptionManager';
import ISerializable from './iSerializable';
import OptionMenuManager from './optionMenu/optionMenuManager';

/**
 * Manages the actual markdown to file conversion and saving.
 */
class FileWriter implements ISerializable {

    private exportOptionManager: ExportOptionManager;
    private htmlConverter: HtmlConverter;
    private pdfConverter: PdfConverter;

    constructor(optionMenuManager: OptionMenuManager) {
        this.exportOptionManager = new ExportOptionManager(optionMenuManager);
        this.htmlConverter = new HtmlConverter();
        this.pdfConverter = new PdfConverter();
    }

    public serialize() {
        return {
            exportOptionManager: this.exportOptionManager.serialize(),
        };
    }

    public deserialize(state: { [key: string]: any }) {
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
            let outputFile = await this.getSavePath({ HTML: ["html", "htm"] });
            if(!outputFile) return;

            await this.saveHtml(outputFile);
        }
    }

    public async onSavePdf() {
        if(vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.languageId === "markdown") {
            let outputFile = await this.getSavePath({ PDF: ["pdf"] });
            if(!outputFile) return;

            await this.savePdf(outputFile);
        }
    }

    public async saveHtml(outputFile: PathLike) {
        if(!vscode.window.activeTextEditor) throw new Error("No active text editor");

        let config = vscode.workspace.getConfiguration('vsc-elearnjs');
        let text = vscode.window.activeTextEditor.document.getText();
        let inputFile = vscode.window.activeTextEditor.document.uri.fsPath;

        this.htmlConverter.setOptions(this.getHtmlConverterOptions(config));

        let extensions = await ExtensionManager.scanMarkdownForAll(text, this.htmlConverter);
        let options = await this.exportOptionManager.openHtmlExportOptions(
            config.general.export.alwaysDisplayExportOptions,
            this.exportOptionManager.getHtmlDefaults(extensions, config),
            config);

        let filename = await this.htmlConverter.toFile(
            text,
            outputFile.toString(),
            path.dirname(inputFile),
            options,
            true);

        console.log("Saved at:", filename);
    }

    public async savePdf(outputFile: PathLike) {
        if(!vscode.window.activeTextEditor) throw new Error("No active text editor");

        let config = vscode.workspace.getConfiguration('vsc-elearnjs');
        let text = vscode.window.activeTextEditor.document.getText();
        let inputFile = vscode.window.activeTextEditor.document.uri.fsPath;

        this.pdfConverter.setOptions(this.getPdfConverterOptions(config));

        let extensions = await ExtensionManager.scanMarkdownForAll(text, this.pdfConverter);
        let options = await this.exportOptionManager.openPdfExportOptions(
            config.general.export.alwaysDisplayExportOptions,
            this.exportOptionManager.getPdfDefaults(extensions, config),
            config);

        console.log(options);

        let filename = await this.pdfConverter.toFile(
            text,
            outputFile.toString(),
            path.dirname(inputFile),
            options,
            true);

        console.log("Saved at:", filename);
    }

    private getGeneralConverterOptions(config: vscode.WorkspaceConfiguration) {
        return new ConverterSettingsObject({
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
        let settings = new PdfSettingsObject(this.getGeneralConverterOptions(config));
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
