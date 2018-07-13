"use strict";

import { HtmlConverter } from 'markdown-elearnjs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Manages the actual markdown to file conversion and saving.
 */
class FileWriter {

    private htmlConverter: HtmlConverter;

    constructor() {
        // do nothing
        this.htmlConverter = new HtmlConverter();
    }

    public onSaveHtml() {
        if(vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.languageId === "markdown") {
            let inputUri = vscode.window.activeTextEditor.document.uri;
            let inputFile = inputUri.fsPath;

            let pathString = path.join("/", path.dirname(inputUri.path), path.basename(inputUri.path, path.extname(inputUri.path)) + ".html").replace(path.sep, "/");
            let extlessUri = inputUri.with({ path: pathString });

            // determine save position
            vscode.window.showSaveDialog({
                defaultUri: extlessUri,
                filters: {
                    HTML: ["html", "htm"],
                },
            }).then((uri) => {
                if(!uri || !vscode.window.activeTextEditor) return;
                let outputFile = uri.fsPath;

                this.htmlConverter.toFile(
                    vscode.window.activeTextEditor.document.getText(),
                    outputFile,
                    path.dirname(inputFile),
                    {
                        language: "de",
                        automaticExtensionDetection: true,
                        exportAssets: true,
                        exportLinkedFiles: true,
                    },
                    true)
                    .then((filename) => {
                        console.log("Saved at:", filename);
                    }, (err) => console.error(err));

            }, (err) => console.error(err));
        }
    }
}

export default FileWriter;
