"use strict";

import cp from 'child_process';
import fs from 'fs';
import Puppeteer from 'puppeteer';
import * as vscode from 'vscode';

/**
 * Created from the activation command. Will manage the extensions behavior.
 */
class PuppeteerChecker {
    public static async checkChromium() {
        // download chromium if not done already, asynchronously
        if(!fs.existsSync(Puppeteer.executablePath())) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "vsc-elearnjs",
                cancellable: false,
            }, async (progress) => {
                progress.report({ message: "Chromium is not installed. Downloading..." });

                await new Promise((res, rej) => {
                    let child = cp.spawn(process.execPath, [__dirname + "/../node_modules/puppeteer/install.js"], {
                        windowsHide: true,
                    });

                    // close listener
                    child.on('close', (num, signal) => {
                        if(num === 0) {
                            vscode.window.showInformationMessage("vsc-elearnjs: PDF Conversion is now possible.");
                            res();
                        }
                        else {
                            vscode.window.showErrorMessage(
                                "vsc-elearnjs: Chrome installation failed with an unknown error.\r\n"
                                + signal + "\r\n"
                                + child.stderr.read() + "\r\n"
                                + child.stdout.read());
                            rej(child.stderr);
                        }
                    });
                });
            });
        }
    }
}

export default PuppeteerChecker;
