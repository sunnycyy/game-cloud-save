export type ExpressionValue = string | number | boolean;

export class ExpressionAttributes {
    private keyLabels = new Map<string, string>();
    private _keys: Record<string, string> = {};
    private keyCount = 0;

    private _values: Record<string, ExpressionValue> = {};
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

    addValue(value: ExpressionValue) {
        const label = `:value${this.valueCount++}`;
        this._values[label] = value;
        return label;
    }
}