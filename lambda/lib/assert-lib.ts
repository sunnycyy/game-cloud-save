import {strict as assert} from "assert";

export function assertDefined(map: Record<string, any>, excludedKeys?: string[]): void {
    for (const [key, value] of Object.entries(map)) {
        if (excludedKeys.includes(key)) {
            continue;
        }

        assert.notEqual(value, undefined, `FIELD_UNDEFINED: ${key}`);
    }
}