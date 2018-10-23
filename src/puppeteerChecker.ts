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

    public static readonly INSTANCE = new PuppeteerChecker();

    private childProcess?: cp.ChildProcess;

    private constructor() { }

    /**
     *  Returns whether chromium is installed (`true`) or not (`false`)
     */
    public static checkChromium() {
        return fs.existsSync(Puppeteer.executablePath());
    }

    /**
     * Downloads chromium with VSCode progress indication.
     */
    public async downloadChromium() {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "vsc-elearnjs",
            cancellable: true,
        }, async (progress, token) => {
            progress.report({ message: "Chromium is not installed. Downloading..." });

            await this.rewriteInstallScript();

            await new Promise((res, rej) => {
                let cwd = path.join(__dirname, '..', 'node_modules', 'puppeteer');
                this.childProcess = cp.fork(path.join(cwd, 'install_rewrite.js'), [], {
                    cwd,
                    execArgv: [],
                    silent: true,
                });

                // kill download
                token.onCancellationRequested(async () => {
                    vscode.window.showInformationMessage("vsc-elearnjs: Download canceled and deactivated in settings.");
                    let chromeConfig = vscode.workspace.getConfiguration('vsc-elearnjs.pdf.chrome');
                    await chromeConfig.update('downloadChrome', false, vscode.ConfigurationTarget.Global);
                    this.stopDownload();
                });

                let lastProgress = 0;
                this.childProcess.on("message", (msg) => {
                    if(msg.downloadedBytes !== undefined && msg.totalBytes !== undefined) {
                        let done = (msg.downloadedBytes * 100) / msg.totalBytes;
                        progress.report({
                            increment: done - lastProgress,
                        });
                        lastProgress = done;
                    }
                });

                // close listener
                this.childProcess.on('close', (num, signal) => {
                    if(num === 0) {
                        vscode.window.showInformationMessage("vsc-elearnjs: PDF Conversion is now possible.");
                        res();
                    }
                    else if(!signal || signal.toUpperCase() !== "SIGTERM") {
                        vscode.window.showErrorMessage(
                            "vsc-elearnjs: Chrome installation failed with an unknown error.\r\n"
                            + num + " " + signal + "\r\n");
                        rej(`Closed unexpectedly: ${num} ${signal}`);
                    }
                    else {
                        res();
                    }
                });
            }).catch((err) => {
                console.error(err);
            });
        });
    }

    public stopDownload() {
        if(this.childProcess && !this.childProcess.killed) this.childProcess.kill();
    }

    /**
     * Removing all locally bundled chromium versions.
     */
    public async removeChromium() {
        this.stopDownload();
        let localChromium = path.join(__dirname, '..', 'node_modules', 'puppeteer', '.local-chromium');
        if(fs.existsSync(localChromium)) {
            await util.promisify(rimraf)(localChromium);
        }
    }

    /**
     * Rewrites puppeteers install.js script to be able to display a progress bar.
     */
    public async rewriteInstallScript() {
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
