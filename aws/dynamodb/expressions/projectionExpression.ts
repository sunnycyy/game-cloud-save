import {Expression, ExpressionArrayItemIndices, ExpressionAttributes, ExpressionMap} from "./expression";
import {labelExpressionKeys} from "./expressionUtils";

export class ProjectionExpression implements Expression {
    private readonly _map: ExpressionMap<boolean | ExpressionArrayItemIndices>;

    constructor(map: ExpressionMap<boolean | ExpressionArrayItemIndices>) {
        this._map = map;
    }

    toExpressionString(attributes: ExpressionAttributes): string {
        const labels = labelExpressionKeys(this._map, attributes);
        return labels
            .map(([keyLabel, indices]) => ProjectionExpression.createExpressionString(keyLabel as string, null, indices as number[]))
            .join(", ");
    }

    private static createExpressionString(keyLabel: string, valueLabel: string | string[], indices: number[]): string {
        return (indices !== undefined) ? `${keyLabel}${indices.map(index => `[${index}]`).join("")}` : keyLabel;
    }
}