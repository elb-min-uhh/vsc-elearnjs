import * as path from 'path';
import * as vscode from 'vscode';

class Util {

    /**
     * Generates a fileExtensions object for `Util.getSavePath` containing either
     * html or pdf or both.
     * @param extensions which extensions to allow.
     */
    public static getFileExtensionsForFileChooser(extensions: ("html" | "pdf")[]) {
        let fileExtensions = {};

        if(extensions.indexOf("html") >= 0) {
            fileExtensions = Object.assign(fileExtensions, { HTML: ["html", "htm"] });
        }
        if(extensions.indexOf("pdf") >= 0) {
            fileExtensions = Object.assign(fileExtensions, { PDF: ["pdf"] });
        }

        return fileExtensions;
    }

    /**
     * Request a file path in a save dialog from the user.
     * @param fileExtensions an array of file extension objects. These are
     * mapping a general type description (e.g. `HTML - Hypertext Markup Language`)
     * on an array of file extensions (e.g. `["html", "htm"]`)
     */
    public static async getSavePath(fileExtensions: { [extensionDescription: string]: string[] }, pathFromCurrentEditor: boolean, inputPath?: string) {
        let options: vscode.SaveDialogOptions = {
            filters: fileExtensions,
        };

        let inputUri: vscode.Uri;

        if(pathFromCurrentEditor) {
            if(!vscode.window.activeTextEditor) return;
            inputUri = vscode.window.activeTextEditor.document.uri;
        }
        else if(inputPath) {
            inputUri = vscode.Uri.file(inputPath);
        }

        if(inputUri) {
            let pathString = path.join(
                path.dirname(inputUri.fsPath),
                path.basename(inputUri.fsPath, path.extname(inputUri.fsPath))).replace(path.sep, "/");
            let extlessUri = inputUri.with({ path: pathString });

            options.defaultUri = extlessUri;
        }

        // determine save position
        let uri = await vscode.window.showSaveDialog(options);
        if(!uri) return;

        let filePath = uri.fsPath.replace(/(\w+):/, (wholeMatch, drive) => {
            return drive.toUpperCase() + wholeMatch.substr(drive.length);
        });

        return filePath;
    }
}

export default Util;
