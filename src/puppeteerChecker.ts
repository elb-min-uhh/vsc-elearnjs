"use strict";

import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import Puppeteer from 'puppeteer';
import rimraf from 'rimraf';
import util from 'util';
import * as vscode from 'vscode';

/**
 * Checks for Puppeteers bundled Chromium. Allows to download it if not done.
 */
class PuppeteerChecker {

    /**
     * Singleton instance of the PuppeteerChecker
     */
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

                this.addDownloadListener(this.childProcess, progress, token, res, rej);
            }).catch((err) => {
                console.error(err);
            });
        });
    }

    /**
     * Stop the current download process, if there is one.
     */
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

    /**
     * Adds all necessary listeners to the child process.
     * @param childProcess the process to listen to
     * @param progress the progress object, to update the test and status
     * @param token the cancellation token to listen for cancels
     * @param res a resolving function, childProcess suceeded
     * @param rej a rejecting function, childProcess crashed for any reason
     */
    private addDownloadListener(
        childProcess: cp.ChildProcess,
        progress: vscode.Progress<any>,
        token: vscode.CancellationToken,
        res: () => void,
        rej: (err: Error) => void) {
        // progress update
        this.addChildProcessMessageListener(childProcess, progress);

        // close listener
        childProcess.on('close', (num, signal) => {
            if(num === 0) {
                vscode.window.showInformationMessage("vsc-elearnjs: PDF Conversion is now possible.");
                res();
            }
            else if(!signal || signal.toUpperCase() !== "SIGTERM") {
                vscode.window.showErrorMessage(
                    "vsc-elearnjs: Chrome installation failed with an unknown error.\r\n"
                    + num + " " + signal + "\r\n");
                rej(new Error(`Closed unexpectedly: ${num} ${signal}`));
            }
            else {
                res();
            }
        });

        // kill download
        token.onCancellationRequested(async () => {
            vscode.window.showInformationMessage("vsc-elearnjs: Download canceled and deactivated in settings.");
            let chromeConfig = vscode.workspace.getConfiguration('vsc-elearnjs.pdf.chrome');
            await chromeConfig.update('downloadChrome', false, vscode.ConfigurationTarget.Global);
            this.stopDownload();
        });
    }

    /**
     * Adds a listener to child process messages. Updates the progress bar and message.
     * @param childProcess
     * @param progress
     */
    private addChildProcessMessageListener(childProcess: cp.ChildProcess, progress: vscode.Progress<any>) {
        const message = "Downloading Chromium...";
        let lastUpdate: number;
        let lastProgress = 0;
        let values: { time: number, bytes: number }[] = [];
        childProcess.on("message", (msg) => {
            if(msg.downloadedBytes !== undefined && msg.totalBytes !== undefined) {
                // define the new object
                let now = new Date().getTime();

                // add download stat
                let newStat = {
                    time: now,
                    bytes: msg.downloadedBytes,
                };
                values.push(newStat);

                let done = (msg.downloadedBytes * 100) / msg.totalBytes;
                // setup actual report
                let report: any = {};
                report.increment = done - lastProgress;

                // update message with download speed and estimated time
                if(values.length > 1 && (!lastUpdate || (now - lastUpdate) > 1500)) {
                    // get most recent object at least 2s old
                    let oldStat = values[0];
                    while(values.length > 1 && (newStat.time - values[1].time) > 2000) {
                        values.shift(); // remove first
                        oldStat = values[0];
                    }
                    let speed = this.getDownloadSpeed(oldStat, newStat);
                    let est = this.getEstimatedTimeLeft(speed, msg.downloadedBytes, msg.totalBytes);
                    lastUpdate = now;
                    report.message = `${message} ${speed} - ${est}`;
                }

                // publish progress
                progress.report(report);
                lastProgress = done;
            }
        });
    }

    /**
     * Calculates the download speed from two stats
     * @param oldStat the older download stat
     * @param newStat the newer download stat
     */
    private getDownloadSpeed(oldStat: { time: number, bytes: number }, newStat: { time: number, bytes: number }) {
        let byteDelta = newStat.bytes - oldStat.bytes;
        let timeDelta = newStat.time - oldStat.time;
        let unit = "KB/s";
        let downloadSpeed = byteDelta / timeDelta; // KB/s
        if(downloadSpeed > 1000) {
            unit = "MB/s";
            downloadSpeed /= 1000;
        }
        return `${downloadSpeed.toFixed(2)} ${unit}`;
    }

    /**
     * Calculate estimated time left string
     * @param speed string of download speed from `getDownloadSpeed`
     * @param downloadedBytes already downloaded bytes
     * @param totalBytes total number of bytes
     */
    private getEstimatedTimeLeft(speed: string, downloadedBytes: number, totalBytes: number) {
        let speedMatch = speed.toLowerCase().match(/(\d*\.?\d+)\s*(kb|mb)\/s/) || [];
        let estimated = "";
        try {
            let downloadSpeed = parseFloat(speedMatch[1]);
            // adapt to B/s
            switch(speedMatch[2]) {
                case "kb":
                    downloadSpeed *= 1000;
                    break;
                case "mb":
                    downloadSpeed *= 1000000;
                    break;
            }
            let leftBytes = totalBytes - downloadedBytes;
            let leftSeconds = Math.floor(leftBytes / downloadSpeed);
            estimated = `${leftSeconds} second${leftSeconds > 1 ? "s" : ""} left`;
            if(leftSeconds >= 60) {
                estimated = `${Math.floor(leftSeconds / 60)} minute${leftSeconds >= 120 ? "s" : ""} left`;
            }
            else if(leftSeconds > 600) {
                estimated = `more than 10 minutes left`;
            }
        }
        catch(err) {
            // ignore
        }
        return estimated;
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
