import {ServerException} from "./exception-lib";
import {strict as assert} from "assert";

class KeyNotDefinedException extends ServerException {
    constructor(key: string) {
        super("KeyNotDefinedException", `Key not defined: ${key}`, {key});
    }
}

export function assertDefined(map: Record<string, any>): void {
    for (const [key, value] of Object.entries(map)) {
        assert.notEqual(value, undefined, new KeyNotDefinedException(key));
    }
}

class KeyNotExistException extends ServerException {
    constructor(key: string) {
        super("KeyNotExistException", `Key not exist: ${key}`, {key});
    }
}

export function assertExist(map: Record<string, any>): void {
    for (const [key, value] of Object.entries(map)) {
        assert.notEqual(value, undefined, new KeyNotExistException(key));
    }
}

class ArrayEmptyException extends ServerException {
    constructor(key: string) {
        super("ArrayEmptyException", `Array empty: ${key}`, {key});
    }
}

export function assertArrayNotEmpty(map: Record<string, Array<any>>): void {
    for (const [key, arr] of Object.entries(map)) {
        assert(arr.length > 0, new ArrayEmptyException(key));
    }
}

class ConditionNotMatchException extends ServerException {
    constructor(message: string, data?: Record<string, any>) {
        super("ConditionNotMatchException", message || "Condition not match", data);
    }
}

export function assertCondition(condition: boolean, message?: string, data?: Record<string, any>): void {
    assert(condition, new ConditionNotMatchException(message, data));
}