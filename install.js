/**
 * Installation Script.
 */

var fs = require('fs');

console.log(os.platform(), process.env);
fs.writeFileSync(__dirname + "/" + "install.out", os.platform() + "\r\n" + JSON.stringify(process.env, null, 2));
