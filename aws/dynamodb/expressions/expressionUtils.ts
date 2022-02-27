import {
    ExpressionArrayIndex,
    ExpressionArrayItemValue,
    ExpressionAttributes,
    ExpressionMap,
    ExpressionValue
} from "./expression";

export function labelExpressionMap<ValueType>(
    expressionMap: ExpressionMap<ValueType>,
    attributes: ExpressionAttributes,
    path = ""
): Array<string | string[] | number> {
    const [[key, value]] = Object.entries(expressionMap);
    const keyLabel = attributes.addKey(key);
    const fullPath = `${path}.${keyLabel}`;

    if (Array.isArray(value)) {
        const valueLabels = value.map(value => attributes.addValue(value));
        return [fullPath, valueLabels];
    }

    if (typeof value === "object" && !(value instanceof ExpressionValue)) {
        return labelExpressionMap(value as ExpressionMap<ValueType>, attributes, fullPath);
    }

    if (value instanceof ExpressionArrayIndex) {
        return [fullPath, null, value.index];
    }

    const valueLabel = attributes.addValue(value as ValueType);
    if (value instanceof ExpressionArrayItemValue) {
        return [fullPath, valueLabel, value.index];
    }

    return [fullPath, valueLabel];
}

export function labelExpressionKeys<ValueType>(
    expressionMap: ExpressionMap<ValueType>,
    attributes: ExpressionAttributes,
    path = ""
): string {
    const [[key, value]] = Object.entries(expressionMap);
    const keyLabel = attributes.addKey(key);
    const fullPath = `${path}.${keyLabel}`;

    if ((typeof value === "object") && !Array.isArray(value)) {
        return labelExpressionKeys(value as ExpressionMap<ValueType>, attributes, fullPath);
    }

    return fullPath;
}