"use strict";

/**
 * Defines the interface of serializable objects. These have states which
 * can be requested to be saved and can be loaded when given.
 */
interface ISerializable {
    /**
     * Return current state values of any kind. Only need to be understand
     * by the object itself in deserialize.
     */
    serialize(): { [key: string]: any };

    /**
     * Load a given state.
     * @param state the state generated by `serialize`
     */
    deserialize(state: { [key: string]: any }): void;
}

export default ISerializable;
