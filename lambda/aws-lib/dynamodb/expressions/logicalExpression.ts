import {ExpressionAttributes} from "./expression";
import {ConditionExpression} from "./conditionExpression";
import {LogicalJoinOp} from "./logicalJoinOp";

abstract class LogicalJoinExpression implements ConditionExpression {
    private readonly logicalOp: LogicalJoinOp;
    private readonly conditions: ConditionExpression[];

    protected constructor(logicalOp: LogicalJoinOp, conditions: ConditionExpression[]) {
        this.logicalOp = logicalOp;
        this.conditions = conditions;
    }

    toExpressionString(attributes: ExpressionAttributes): string {
        return this.conditions.map(condition => `(${condition.toExpressionString(attributes)})`).join(` ${this.logicalOp} `);
    }
}

export class AndExpression extends LogicalJoinExpression {
    constructor(...conditions: ConditionExpression[]) {
        super(LogicalJoinOp.And, conditions);
    }
}

export class OrExpression extends LogicalJoinExpression {
    constructor(...conditions: ConditionExpression[]) {
        super(LogicalJoinOp.Or, conditions);
    }
}

export class NotExpression implements ConditionExpression {
    private readonly _condition: ConditionExpression;

    constructor(condition: ConditionExpression) {
        this._condition = condition;
    }

    toExpressionString(attributes: ExpressionAttributes): string {
        return `NOT (${this._condition.toExpressionString(attributes)})`;
    }
}