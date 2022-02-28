import {BeginsWithExpression, CompareExpression, ConditionExpressionValue} from "./conditionExpression";
import {CompareOp} from "./compareOp";
import {ExpressionMap} from "./expression";

export type KeyCompareOp = Exclude<CompareOp, CompareOp.NotEqual | CompareOp.In>;
export type KeyConditionExpression = KeyCompareExpression | BeginsWithExpression;

export class KeyCompareExpression extends CompareExpression {
    constructor(compareOp: KeyCompareOp, map: ExpressionMap<ConditionExpressionValue>) {
        super(compareOp, map);
    }
}