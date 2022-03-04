import {
    ExpressionArrayItemIndices,
    ExpressionArrayItemValue,
    ExpressionAttributes, ExpressionBetweenValues,
    ExpressionMap,
    ExpressionValue
} from "./expression";

export function labelExpressionMap<ValueType>(
    expressionMap: ExpressionMap<ValueType>,
    attributes: ExpressionAttributes,
    path = "",
    labels: Array<string | string[] | number[]>[] = []
) {
    for (const [key, value] of Object.entries(expressionMap)) {
        const keyLabel = attributes.addKey(key);
        const fullPath = path ? `${path}.${keyLabel}` : keyLabel;

        if (typeof value === "object" && !Array.isArray(value) && !(value instanceof ExpressionValue)) {
            labelExpressionMap(value as ExpressionMap<ValueType>, attributes, fullPath, labels);
            continue;
        }

        labelExpressionValue(labels, attributes, path, value);
    }
    return labels;
}

function labelExpressionValue<ValueType>(labels: Array<string | string[] | number[]>[], attributes: ExpressionAttributes, path: string, value: ValueType) {
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            labelExpressionValue(labels, attributes, path, value[i]);
        }
        return;
    }

    if (value instanceof ExpressionBetweenValues) {
        const valueLabels = [
            attributes.addValue(value.value1),
            attributes.addValue(value.value2),
        ];
        labels.push([path, valueLabels]);
        return;
    }

    if (value instanceof ExpressionArrayItemIndices) {
        labels.push([path, null, value.indices]);
        return;
    }

    const valueLabel = attributes.addValue(value as ValueType);
    if (value instanceof ExpressionArrayItemValue) {
        labels.push([path, valueLabel, value.indices]);
        return;
    }

    labels.push([path, valueLabel]);
}

export function labelExpressionKeys<ValueType>(
    expressionMap: ExpressionMap<ValueType>,
    attributes: ExpressionAttributes,
    path = "",
    labels: Array<string | number[]>[] = []
) {
    for (const [key, value] of Object.entries(expressionMap)) {
        const keyLabel = attributes.addKey(key);
        const fullPath = path ? `${path}.${keyLabel}` : keyLabel;

        if (typeof value !== "object") {
            labels.push([fullPath]);
            continue;
        }

        if (value instanceof ExpressionArrayItemIndices) {
            labels.push([fullPath, value.indices]);
            continue;
        }

        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const val = value[i];
                if (val instanceof ExpressionArrayItemIndices) {
                    labels.push([fullPath, val.indices]);
                }
            }
            continue;
        }

        if (!(value instanceof ExpressionValue)) {
            labelExpressionKeys(value as ExpressionMap<ValueType>, attributes, fullPath, labels);
        }
    }
    return labels;
}