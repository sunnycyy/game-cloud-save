export function assertDefined(map: Record<string, any>): void {
    for (const [key, value] of Object.entries(map)) {
        if (value === undefined) {
            throw `VALUE_UNDEFINED: ${key}`;
        }
    }
}

export function assertExist(map: Record<string, any>): void {
    for (const [key, value] of Object.entries(map)) {
        if (value === undefined) {
            throw `VALUE_NOT_EXIST: ${key}`;
        }
    }
}

export function assertNotEmpty(map: Record<string, Array<any>>): void {
    for (const [key, arr] of Object.entries(map)) {
        if (arr.length <= 0) {
            throw `ARRAY_EMPTY: ${key}`;
        }
    }
}