/**
 * Clean Up directory before publish
 */

const fs = require('fs');
const rimraf = require('rimraf');

console.log("Removing old compilation files.");
rimraf(__dirname + "/out", (err) => {
    if(err) console.log(err);
});


// remove all absolute paths from **/package.json
let nodeModules = __dirname + "/node_modules";
console.log("Removing `__dirname` from package.json in node_modules");
directoryCleanPackageJson(nodeModules, __dirname.replace(/\\/g, "\\\\"));

/**
 * Removes the `toRemove` string from every package.json found in the subtree
 * @param {*} dirPath the parent dir
 */
function directoryCleanPackageJson(dirPath, toRemove) {
    // try cleaning package.json in current dir
    let packagePath = dirPath + "/package.json";
    if(fs.existsSync(packagePath)) {
        let content = fs.readFileSync(packagePath).toString();
        while(content.indexOf(toRemove) >= 0) {
            content = content.replace(toRemove, "");
        }
        fs.writeFileSync(packagePath, content);
    }

    // check for subdirectories
    let list = fs.readdirSync(dirPath);
    for(let dir of list) {
        let subDirPath = dirPath + "/" + dir;
        let stat = fs.statSync(subDirPath);
        if(stat.isDirectory()) {
            directoryCleanPackageJson(subDirPath, toRemove);
        }
    }
}
