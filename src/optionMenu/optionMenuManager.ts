"use strict";

import * as vscode from 'vscode';
import OptionMenu from "./optionMenu";
import OptionMenuResult from './optionMenuResult';
import SelectOption from './selectOption';


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
        return `<label><input type="checkbox" name="${name}" ${checked ? "checked" : ""}/> ${text}</label>`;
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
     * @param placeholder the placeholder and default text
     */
    public static createInputTextLabel(name: string, text: string, placeholder: string) {
        return `<label>${text} <input type="text" name="${name}" placeholder="${placeholder}" value="${placeholder}" /></label>`;
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
