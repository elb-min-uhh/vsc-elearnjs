"use strict";

import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import Puppeteer from 'puppeteer';
import rimraf from 'rimraf';
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
            cancellable: true,
        }, async (progress, token) => {
            progress.report({ message: "Chromium is not installed. Downloading..." });

            await PuppeteerChecker.rewireInstallScript();

            await new Promise((res, rej) => {
                let cwd = path.join(__dirname, '..', 'node_modules', 'puppeteer');
                let child = cp.fork(path.join(cwd, 'install_rewrite.js'), [], {
                    cwd,
                    execArgv: [],
                    silent: true,
                });

                // kill download
                token.onCancellationRequested(async () => {
                    vscode.window.showInformationMessage("vsc-elearnjs: Download canceled and deactivated in settings.");
                    let chromeConfig = vscode.workspace.getConfiguration('vsc-elearnjs.pdf.chrome');
                    await chromeConfig.update('downloadChrome', false, vscode.ConfigurationTarget.Global);
                    child.kill();
                    res();
                });

                let lastProgress = 0;
                child.on("message", (msg) => {
                    if(msg.downloadedBytes !== undefined && msg.totalBytes !== undefined) {
                        let done = (msg.downloadedBytes * 100) / msg.totalBytes;
                        progress.report({
                            increment: done - lastProgress,
                        });
                        lastProgress = done;
                    }
                });

                // close listener
                child.on('close', (num, signal) => {
                    if(num === 0) {
                        vscode.window.showInformationMessage("vsc-elearnjs: PDF Conversion is now possible.");
                        res();
                    }
                    else if(!signal || signal.toUpperCase() !== "SIGTERM") {
                        vscode.window.showErrorMessage(
                            "vsc-elearnjs: Chrome installation failed with an unknown error.\r\n"
                            + num + " " + signal + "\r\n");
                        rej(`Closed unexpectedly: ${num} ${signal}, ${child.stderr && child.stderr.read()}, ${child.stdout && child.stdout.read()}`);
                    }
                });
            }).catch((err) => {
                console.error(err);
            });
        });
    }

    /**
     * Removing all locally bundled chromium versions.
     */
    public static async removeChromium() {
        let localChromium = path.join(__dirname, '..', 'node_modules', 'puppeteer', '.local-chromium');
        if(fs.existsSync(localChromium)) {
            await util.promisify(rimraf)(localChromium);
        }
    }

    /**
     * Rewrites puppeteers install.js script to be able to display a progress bar.
     */
    public static async rewireInstallScript() {
        let installScriptPath = path.join(
            __dirname, '..', 'node_modules', 'puppeteer', 'install.js');
        let installScriptRewritePath = path.join(
            __dirname, '..', 'node_modules', 'puppeteer', 'install_rewrite.js');

        let content = await util.promisify(fs.readFile)(installScriptPath, "utf8");
        content = content.replace(
            /\r?\nfunction onProgress\(downloadedBytes, totalBytes\) \{[\s\S]*?\r?\n\}/,
            rewrittenOnProgress);

        // write to new file
        await util.promisify(fs.writeFile)(installScriptRewritePath, content, "utf8");
    }
}

const rewrittenOnProgress = `
let lastProgress = new Date();
function onProgress(downloadedBytes, totalBytes) {
    let now = new Date();
    if(now.getTime() - lastProgress.getTime() > 200) {
        lastProgress = now;
        if(process.send) {
            process.send({
                revision: revision,
                downloadedBytes: downloadedBytes,
                totalBytes: totalBytes,
            });
        }
        console.log(\`Downloading Chromium r\${revision} - \${downloadedBytes} / \${totalBytes} bytes\`);
    }
}`;

export default PuppeteerChecker;
