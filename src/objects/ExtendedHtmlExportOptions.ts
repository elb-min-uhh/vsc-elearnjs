import { PathLike } from "fs";
import { HtmlExportOptionObject } from "markdown-elearnjs";

class ExtendedHtmlExportOptions extends HtmlExportOptionObject {
    public outputFile?: PathLike;

    public constructor(options: ExtendedHtmlExportOptions) {
        super(options);

        const keys = ["outputFile"];

        if(options) {
            Object.keys(options).forEach((key) => {
                if(keys.indexOf(key) >= 0) {
                    this[key] = options[key];
                }
            });
        }
    }
}

export default ExtendedHtmlExportOptions;
