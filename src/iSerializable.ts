"use strict";

interface ISerializable {
    serialize(): { [key: string]: any };
    deserialize(state: { [key: string]: any }): void;
}

export default ISerializable;
