export interface ExpressionMap<ValueType> extends Record<string, ValueType | Array<ValueType> | ExpressionMap<ValueType>> {}

export interface Expression {
    toExpressionString(attributes: ExpressionAttributes): string;
}

export abstract class ExpressionValue {
    private readonly _value;

    protected constructor(value) {
        this._value = value;
    }

    get value() {
        return this._value;
    }
}

export class ExpressionArrayValue<ValueType> extends ExpressionValue {
    constructor(array: Array<ValueType>) {
        super(array);
    }
}

export class ExpressionMapValue<ValueType> extends ExpressionValue {
    constructor(map: Record<string, ValueType>) {
        super(map);
    }
}

export class ExpressionArrayItemValue<ValueType> extends ExpressionValue {
    private readonly _index: number;

    constructor(index: number, value: ValueType) {
        super(value);
        this._index = index;
    }

    get index() {
        return this._index;
    }
}

export class ExpressionArrayIndex extends ExpressionArrayItemValue<undefined> {
    constructor(index: number) {
        super(index, undefined);
    }
}

export class ExpressionAttributes {
    private readonly keyLabels = new Map<string, string>();
    private readonly _keys: Record<string, string> = {};
    private keyCount = 0;

    private readonly _values: Record<string, NonNullable<any>> = {};
    private valueCount = 0;

    get keys() {
        return this._keys;
    }

    get values() {
        return this._values;
    }

    hasValues() {
        return this.valueCount > 0;
    }

    addKey(key: string) {
        let label = this.keyLabels.get(key);
        if (!label) {
            label = `#key${this.keyCount++}`;
            this.keyLabels.set(key, label);
            this._keys[label] = key;
        }
        return label;
    }

    addValue(value: NonNullable<any>) {
        const label = `:value${this.valueCount++}`;
        this._values[label] = (value instanceof ExpressionValue) ? value.value : value;
        return label;
    }
}