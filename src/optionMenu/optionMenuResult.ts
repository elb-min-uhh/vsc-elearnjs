"use strict";

/**
 * The result object of an OptionMenu. Will contain all input/select values
 * of the OptionMenu and the return value.
 */
class OptionMenuResult {
    /**
     * Object mapping input/select names on their values. These might be of
     * type string (input[type="text"], select) or boolean (input[type="checkbox"])
     */
    public values: { [inputName: string]: string | boolean };

    /**
     * Return value. This defines which action was used to close the menu.
     * This is usually set as follows:
     * * `-1`: Closed without button press
     * * `0`: Cancel (button of index 0)
     * * `1`: Ok (button of index 1)
     * * ...
     */
    public returnValue: number;

    constructor(values: { [inputName: string]: string | boolean }, returnValue: number) {
        this.values = values;
        this.returnValue = returnValue;
    }
}

export default OptionMenuResult;
