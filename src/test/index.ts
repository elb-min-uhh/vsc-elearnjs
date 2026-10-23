//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//

import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
    });

    const testsRoot = path.resolve(__dirname, '..');

    const files = await glob('**/**.test.js', { cwd: testsRoot });
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise<void>((resolve, reject) => {
        mocha.run((failures) => {
            if(failures > 0) reject(new Error(`${failures} tests failed.`));
            else resolve();
        });
    });
}
