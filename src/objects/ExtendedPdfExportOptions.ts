import { PathLike } from "fs";
import { PdfExportOptionObject } from "markdown-elearnjs";

class ExtendedPdfExportOptions extends PdfExportOptionObject {
    public outputFile?: PathLike;

    public constructor(options: ExtendedPdfExportOptions) {
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

export default ExtendedPdfExportOptions;
