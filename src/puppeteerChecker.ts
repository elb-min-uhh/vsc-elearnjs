"use strict";

import cp from 'child_process';
import fs from 'fs';
import rimraf from 'rimraf';
import util from 'util';
import * as vscode from 'vscode';

/**
 * Created from the activation command. Will manage the extensions behavior.
 */
class PuppeteerChecker {
    public static async checkChromium() {
        let localChromium = __dirname + "/../node_modules/puppeteer/.local-chromium";
        let unfinishedFile = __dirname + "/../node_modules/puppeteer/.local-chromium/vsc-elearnjs_download_unfinished";
        // remove unfinished download
        if(fs.existsSync(unfinishedFile)) {
            await new Promise((res, rej) => {
                rimraf(localChromium, (err) => {
                    if(err) rej(err);
                    else res();
                });
            });
        }

        // download chromium if not done already, asynchronously
        if(!fs.existsSync(localChromium)) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "vsc-elearnjs",
                cancellable: false,
            }, async (progress) => {
                progress.report({ message: "Chromium is not installed. Downloading..." });

                fs.mkdirSync(localChromium);
                fs.writeFileSync(unfinishedFile, "");

                let exec = util.promisify(cp.execFile);
                try {
                    let std = await exec(process.execPath, [__dirname + "/../node_modules/puppeteer/install.js"]);
                    if(std.stderr && std.stderr.trim().length > 0) {
                        console.log(std.stderr);
                        vscode.window.showErrorMessage(
                            "vsc-elearnjs: Chrome installation failed with an unknown error.\r\n"
                            + std.stderr + "\r\n"
                            + std.stdout);
                    }
                    else {
                        fs.unlinkSync(unfinishedFile);
                        vscode.window.showInformationMessage("vsc-elearnjs: PDF Conversion is now possible.");
                    }
                } catch(err) {
                    vscode.window.showErrorMessage("vsc-elearnjs:", err);
                }
            });
        }
    }
}

export default PuppeteerChecker;
