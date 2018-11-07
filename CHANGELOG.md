## 1.0.10
* Additional output file selection in OptionMenu
* Update `markdown-elearnjs` to v1.6.2
## 1.0.9
* Updated export option menu
    * Style is closer to VSCode default style
    * hover indicator for labels
    * number input for `renderDelay` which indicates invalid values
## 1.0.8
* Chromium download progress updated and added `Extracting` state
## 1.0.7
* Add download speed and estimated time to chrome download
* Internal refactoring and comment additions
## 1.0.6
* Setting changes regarding `chrome` will change immediately
    * deactivating `download chrome` will remove the bundled version on closing VSCode
    * deactivating `keep chrome alive` will immediately stop remaining processes
## 1.0.5
* Chromium download can be deactivated
    * You can use your own Chrome without wasting storage space of the bundled version
## 1.0.4
* Improved Puppeteer/Chromium check for installed version and autoinstall
    * Added progress bar to download indicator
* Update `markdown-elearnjs` to v1.6.1
## 1.0.3
* Update `markdown-elearnjs` to v1.6.0
## 1.0.2
* fix default setting for `footerHeight` of PDF output
## 1.0.1
* updated README
* updated settings descriptions
* in the published package:
    * remove unnecessary strings from `node_modules` packages
## 1.0.0
* detects canceled chromium downloads and restarts the download
## 0.0.3
* ignore `/puppeteer/.local-chromium` in published version
* added automatic chromium download on extension activation
## 0.0.2
* debugging pre-release
## 0.0.1
* pre-release
* based on atom-elearnjs v0.5.9
