import {CompareOp} from "./compareOp";
import {BeginsWithExpression, CompareExpression, ConditionExpressionValue} from "./conditionExpression";
import {ExpressionMap} from "./expression";
import {AndExpression} from "./logicalExpression";

export type FilterCompareOp = Exclude<CompareOp, CompareOp.In>;
export type FilterExpression = FilterCompareExpression | BeginsWithExpression | AndExpression;

export class FilterCompareExpression extends CompareExpression {
    constructor(compareOp: FilterCompareOp, map: ExpressionMap<ConditionExpressionValue>) {
        super(compareOp, map);
    }
}