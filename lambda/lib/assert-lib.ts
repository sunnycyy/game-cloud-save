import {strict as assert} from "assert";

export function assertDefined(map: Record<string, any>): void {
    for (const [key, value] of Object.entries(map)) {
        assert.notEqual(value, undefined, `VALUE_UNDEFINED: ${key}`);
    }
}