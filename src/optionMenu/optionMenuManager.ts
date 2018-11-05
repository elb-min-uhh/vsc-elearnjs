import { PathLike } from 'fs';
import * as vscode from 'vscode';
import OptionMenu from "./optionMenu";
import OptionMenuResult from './optionMenuResult';
import SelectOption from './selectOption';

/**
 * Manages the OptionMenus. Can open OptionMenus and offers methods to create
 * their content.
 */
class OptionMenuManager {
    private context?: vscode.ExtensionContext;
    private openMenu?: OptionMenu;

    public constructor(context?: vscode.ExtensionContext) {
        if(context) this.context = context;
    }

    /**
     * Creates an option block.
     * @param heading The blocks heading.
     * @param content The blocks content.
     */
    public static createBlock(heading: string, content: string) {
        return `<h4>${heading}</h4>${content}`;
    }

    /**
     * Create a description element.
     * @param content the elements content as HTML.
     */
    public static createDescription(content: string) {
        return `<span class="description">${content}</span>`;
    }

    /**
     * Create a checkbox label element.
     * @param name the name of the input element.
     *  This will be used in the `OptionMenuResult.values` as the key
     * @param text the elements text as HTML.
     * @param checked whether the checkbox is checked by default or not
     */
    public static createCheckBoxLabel(name: string, text: string, checked: boolean) {
        return `<label><input type="checkbox" name="${name}" ${checked ? "checked" : ""}/> <span>${text}</span></label>`;
    }

    /**
     * Create a checkbox label element.
     * @param name the name of the input element.
     *  This will be used in the `OptionMenuResult.values` as the key
     * @param options all selectable options
     * @param selectedValue the SelectOption.value of the selected option
     * @param description a description text
     */
    public static createSelectLabel(name: string, options: SelectOption[], selectedValue: string, description?: string) {
        let optionsHtml = "";
        for(let opt of options) {
            optionsHtml += `<option value="${opt.value}" ${opt.value === selectedValue ? "selected" : ""}>${opt.text}</option>`;
        }
        return `<label>${description ? OptionMenuManager.createDescription(description) : ""}
                    <select name="${name}" value="${selectedValue}">${optionsHtml}</select>
                </label>`;
    }

    /**
     * Create a input text label element.
     * @param name the name of the input element.
     *  This will be used in the `OptionMenuResult.values` as the key
     * @param text the describing text for the input
     * @param defaultVal the placeholder and default text
     * @param placeholder the placeholder value
     */
    public static createInputNumberLabel(name: string, text: string, defaultVal: number, placeholder?: number) {
        let input = `<input type="number" step="any" name="${name}" value="${defaultVal.toString()}" placeholder="${placeholder ? placeholder : 0}" />`;
        return `<label><span>${text}</span> ${input}</label>`;
    }

    /**
     * Create a file choose input
     * @param name the name of the input element.
     *  This will be used in the `OptionMenuResult.values` as the key
     * @param text the describing text for the input
     * @param fileTypes a string array of allowed file types (allowed "html", "pdf")
     * @param defaultVal the placeholder and default text
     * @param placeholder the placeholder value
     */
    public static createFileChooserLabel(name: string, text: string, fileTypes: ("html" | "pdf")[], defaultVal: PathLike, placeholder?: string) {
        let fileInput = `<input type="text" class="file-input" name="${name}" value="${defaultVal.toString()}" placeholder="${placeholder ? placeholder : ""}" />`;
        let fileButton = `<button class="btn file-select" data-extensions='${JSON.stringify(fileTypes)}'>Select File</button>`;
        return `${text ? OptionMenuManager.createDescription(text) : ""}<label class="file-label">${fileInput}${fileButton}</label>`;
    }

    /**
     * Opens a new OptionMenu. Will throw an error, if an OptionMenu is opened
     * already
     * @param heading the OptionMenu heading. Should only include simple HTML
     * @param body the body of the OptionMenu. Should contain all the inputs/selects
     * @param buttons an array of buttons to use for OptionMenu closing
     */
    public open(heading: string, body: string, buttons: string[]) {
        if(this.openMenu && !this.openMenu.isClosed()) {
            throw new Error("Menu already open");
        }

        this.openMenu = new OptionMenu(heading, body, buttons, this.context);
        let ret = new Promise<OptionMenuResult>((res) => {
            this.openMenu!.onClose(res);
        });

        return ret;
    }
}

export default OptionMenuManager;
