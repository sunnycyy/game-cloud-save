import {AttributeType} from "../attributeType";
import {CompareOp} from "./compareOp";
import {Expression, ExpressionAttributes, ExpressionBetweenValues, ExpressionMap} from "./expression";
import {labelExpressionKeys, labelExpressionMap} from "./expressionUtils";
import {LogicalJoinOp} from "./logicalJoinOp";

export type ConditionExpressionValue = string | number | boolean | ExpressionBetweenValues;

export interface ConditionExpression extends Expression {
}

abstract class ConditionExpressionImpl<ValueType extends ConditionExpressionValue> implements ConditionExpression {
    private readonly _map: ExpressionMap<ValueType>;

    protected get map() {
        return this._map;
    }

    protected constructor(map: ExpressionMap<ValueType>) {
        this._map = map;
    }

    toExpressionString(attributes: ExpressionAttributes): string {
        const labels = labelExpressionMap(this._map, attributes);
        return labels
            .map(([keyLabel, valueLabel]) => this.createExpressionString(keyLabel as string, valueLabel as string | string[]))
            .join(` ${LogicalJoinOp.And} `);
    }

    protected abstract createExpressionString(keyLabel: string, valueLabel?: string | string[]): string;
}

export const CompareOpFn = Object.freeze({
    [CompareOp.Equal]: (a: string, b: string | string[]) => `${a} = ${b as string}`,
    [CompareOp.NotEqual]: (a: string, b: string | string[]) => `${a} <> ${b as string}`,
    [CompareOp.LessThan]: (a: string, b: string | string[]) => `${a} < ${b as string}`,
    [CompareOp.LessThanOrEqual]: (a: string, b: string | string[]) => `${a} <= ${b as string}`,
    [CompareOp.GreaterThan]: (a: string, b: string | string[]) => `${a} > ${b as string}`,
    [CompareOp.GreaterThanOrEqual]: (a: string, b: string | string[]) => `${a} >= ${b as string}`,
    [CompareOp.Between]: (a: string, b: string | string[]) => {
        const [b1, b2] = b as string[];
        return `${a} BETWEEN ${b1} AND ${b2}`;
    },
    [CompareOp.In]: (a: string, b: string | string[]) => `${a} IN (${(b as string[]).join(", ")})`,
});

export class CompareExpression extends ConditionExpressionImpl<ConditionExpressionValue> {
    private readonly compareOp: CompareOp;

    constructor(compareOp: CompareOp, map: ExpressionMap<ConditionExpressionValue>) {
        super(map);
        this.compareOp = compareOp;
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return CompareOpFn[this.compareOp](keyLabel, valueLabel);
    }
}

//region Functions
interface AttributeExpressionMap extends ExpressionMap<boolean> {}

abstract class AttributeExpression extends ConditionExpressionImpl<boolean> {
    protected constructor(map: AttributeExpressionMap) {
        super(map);
    }

    override toExpressionString(attributes: ExpressionAttributes): string {
        const labels = labelExpressionKeys(this.map, attributes);
        return labels.map(([keyLabel]) => this.createExpressionString(keyLabel as string)).join(` ${LogicalJoinOp.And} `);
    }
}

export class AttributeExistsExpression extends AttributeExpression {
    constructor(map: AttributeExpressionMap) {
        super(map);
    }

    protected override createExpressionString(keyLabel: string): string {
        return `attribute_exists(${keyLabel})`;
    }
}

export class AttributeNotExistsExpression extends AttributeExpression {
    constructor(map: AttributeExpressionMap) {
        super(map);
    }

    protected override createExpressionString(keyLabel: string): string {
        return `attribute_not_exists(${keyLabel})`;
    }
}

export class AttributeTypeExpression extends ConditionExpressionImpl<AttributeType> {
    constructor(map: ExpressionMap<AttributeType>) {
        super(map);
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `attribute_type(${keyLabel},${valueLabel})`;
    }
}

export class BeginsWithExpression extends ConditionExpressionImpl<string> {
    constructor(map: ExpressionMap<string>) {
        super(map);
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `begins_with(${keyLabel}, ${valueLabel as string})`;
    }
}

export class ContainsExpression extends ConditionExpressionImpl<ConditionExpressionValue> {
    constructor(map: ExpressionMap<ConditionExpressionValue>) {
        super(map);
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `contains(${keyLabel}, ${valueLabel as string})`;
    }
}

export class SizeExpression extends ConditionExpressionImpl<number> {
    private readonly compareOp: CompareOp;

    constructor(map: ExpressionMap<number>, compareOp: CompareOp) {
        super(map);
        this.compareOp = compareOp;
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return CompareOpFn[this.compareOp](`size(${keyLabel})`, valueLabel);
    }
}
//endregion