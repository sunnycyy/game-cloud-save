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
    path = "",
    labels: Array<string | string[] | number>[] = []
) {
    for (const [key, value] of Object.entries(expressionMap)) {
        const keyLabel = attributes.addKey(key);
        const fullPath = `${path}.${keyLabel}`;

        if (Array.isArray(value)) {
            const valueLabels = value.map(value => attributes.addValue(value));
            labels.push([fullPath, valueLabels]);
            continue;
        }

        if (typeof value === "object" && !(value instanceof ExpressionValue)) {
            labelExpressionMap(value as ExpressionMap<ValueType>, attributes, fullPath, labels);
            continue;
        }

        if (value instanceof ExpressionArrayIndex) {
            labels.push([fullPath, null, value.index]);
            continue;
        }

        const valueLabel = attributes.addValue(value as ValueType);
        if (value instanceof ExpressionArrayItemValue) {
            labels.push([fullPath, valueLabel, value.index]);
            continue;
        }

        labels.push([fullPath, valueLabel]);
    }
    return labels;
}

export function labelExpressionKeys<ValueType>(
    expressionMap: ExpressionMap<ValueType>,
    attributes: ExpressionAttributes,
    path = "",
    keyLabels: string[] = []
) {
    for (const [key, value] of Object.entries(expressionMap)) {
        const keyLabel = attributes.addKey(key);
        const fullPath = `${path}.${keyLabel}`;

        if ((typeof value === "object") && !Array.isArray(value)) {
            labelExpressionKeys(value as ExpressionMap<ValueType>, attributes, fullPath, keyLabels);
            continue;
        }

        keyLabels.push(fullPath);
    }
    return keyLabels;
}