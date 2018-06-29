'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const markdown_elearnjs_1 = require("markdown-elearnjs");
const HtmlExportOptionObject_1 = __importDefault(require("markdown-elearnjs/lib/objects/export/HtmlExportOptionObject"));
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vsc-elearnjs" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('vsc-elearnjs.to-html', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
        if (vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document.languageId === "markdown") {
            var file = vscode.window.activeTextEditor.document.uri.fsPath;
            var outputFile = file.substr(0, file.length - path.extname(file).length) + ".html";
            let htmlConverter = new markdown_elearnjs_1.HtmlConverter();
            let exportOptions = new HtmlExportOptionObject_1.default({
                automaticExtensionDetection: true,
                exportAssets: true,
                exportLinkedFiles: true
            });
            htmlConverter.toFile(vscode.window.activeTextEditor.document.getText(), outputFile, path.dirname(file), exportOptions, true).then((filename) => {
                console.log("Saved at:", filename);
            }, err => console.error(err));
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
