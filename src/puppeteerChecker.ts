"use strict";

import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import Puppeteer from 'puppeteer';
import util from 'util';
import * as vscode from 'vscode';

/**
 * Created from the activation command. Will manage the extensions behavior.
 */
class PuppeteerChecker {

    /**
     *  Returns whether chromium is installed (`true`) or not (`false`)
     */
    public static checkChromium() {
        return fs.existsSync(Puppeteer.executablePath());
    }

    /**
     * Downloads chromium with VSCode progress indication.
     */
    public static async downloadChromium() {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "vsc-elearnjs",
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "Chromium is not installed. Downloading..." });

            await PuppeteerChecker.rewireInstallScript();

            await new Promise((res, rej) => {
                let child = cp.spawn(process.execPath, [__dirname + "/../node_modules/puppeteer/install_rewrite.js"], {
                    windowsHide: true,
                });

                let lastProgress = 0;
                child.stdout.on('data', (data) => {
                    try {
                        data = data.toString();
                        let sizes = data.match(/(\d+)\s*\/\s*(\d+)\s*bytes/);
                        let done = (parseFloat(sizes[1]) * 100) / parseFloat(sizes[2]);
                        progress.report({
                            increment: done - lastProgress,
                        });
                        lastProgress = done;
                    } catch(err) {
                        // ignore
                    }
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

    /**
     * Rewrites puppeteers install.js script to be able to display a progress bar.
     */
    public static async rewireInstallScript() {
        let installScriptPath = path.join(
            __dirname, '..', 'node_modules', 'puppeteer', 'install.js');
        let installScriptRewritePath = path.join(
            __dirname, '..', 'node_modules', 'puppeteer', 'install_rewrite.js');

        if(!fs.existsSync(installScriptRewritePath)) {
            let content = await util.promisify(fs.readFile)(installScriptPath, "utf8");
            content = content.replace(
                /\r?\nfunction onProgress\(downloadedBytes, totalBytes\) \{[\s\S]*?\r?\n\}/,
                rewrittenOnProgress);

            // write to new file
            await util.promisify(fs.writeFile)(installScriptRewritePath, content, "utf8");
        }
    }
}

const rewrittenOnProgress = `
let lastProgress = new Date();
function onProgress(downloadedBytes, totalBytes) {
    let now = new Date();
    if(now.getTime() - lastProgress.getTime() > 250) {
        lastProgress = now;
        console.log(\`Downloading Chromium r\${revision} - \${downloadedBytes} / \${totalBytes} bytes\`);
    }
}`;

export default PuppeteerChecker;
