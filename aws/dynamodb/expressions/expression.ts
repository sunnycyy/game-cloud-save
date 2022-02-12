import {ExpressionAttributes} from "./expressionAttributes";

export interface ExpressionMap<ValueType> extends Record<string, ValueType | Array<ValueType> | ExpressionMap<ValueType>> {}

export interface Expression {
    toExpressionString(attributes: ExpressionAttributes): string;
}