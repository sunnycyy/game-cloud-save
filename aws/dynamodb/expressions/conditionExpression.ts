import {ExpressionAttributes, ExpressionValue} from "./expressionAttributes";
import {AttributeType} from "../attributeType";
import {CompareOp} from "./compareOp";
import {Expression, ExpressionMap} from "./expression";

export interface ConditionExpression extends Expression {}

abstract class ConditionExpressionImpl<ValueType> implements ConditionExpression {
    private readonly _map: ExpressionMap<ValueType>;

    protected get map() {
        return this._map;
    }

    protected constructor(map: ExpressionMap<ValueType>) {
        this._map = map;
    }

    toExpressionString(attributes: ExpressionAttributes): string {
        const [keyLabel, valueLabel] = this.labelExpressionMap(this._map, attributes);
        return this.createExpressionString(keyLabel as string, valueLabel);
    }

    protected abstract createExpressionString(keyLabel: string, valueLabel?: string | string[]): string;

    private labelExpressionMap(expressionMap: ExpressionMap<ValueType>, attributes: ExpressionAttributes, path = ""): Array<string | string[]> {
        const [[key, value]] = Object.entries(expressionMap);
        const keyLabel = attributes.addKey(key);
        const fullPath = `${path}.${keyLabel}`;

        if (Array.isArray(value)) {
            const valueLabels = value.map(value => attributes.addValue(value as unknown as ExpressionValue));
            return [fullPath, valueLabels];
        }

        if (typeof value === "object") {
            return this.labelExpressionMap(value as ExpressionMap<ValueType>, attributes, fullPath);
        }

        const valueLabel = attributes.addValue(value as unknown as ExpressionValue);
        return [fullPath, valueLabel];
    }
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

export class CompareExpression extends ConditionExpressionImpl<ExpressionValue> {
    private readonly compareOp: CompareOp;

    constructor(compareOp: CompareOp, map: ExpressionMap<ExpressionValue>) {
        super(map);
        this.compareOp = compareOp;
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return CompareOpFn[this.compareOp](keyLabel, valueLabel);
    }
}

//region Functions
interface AttributeExpressionMap extends ExpressionMap<boolean> {}

abstract class AttributeExpression extends ConditionExpressionImpl<boolean> {
    protected constructor(map: AttributeExpressionMap) {
        super(map);
    }

    toExpressionString(attributes: ExpressionAttributes): string {
        const keyLabel = this.labelExpressionKeys(this.map, attributes);
        return this.createExpressionString(keyLabel);
    }

    private labelExpressionKeys(expressionMap: AttributeExpressionMap, attributes: ExpressionAttributes, path = ""): string {
        const [[key, value]] = Object.entries(expressionMap);
        const keyLabel = attributes.addKey(key);
        const fullPath = `${path}.${keyLabel}`;
        if ((typeof value === "object") && !Array.isArray(value)) {
            return this.labelExpressionKeys(value, attributes, fullPath);
        }
        else {
            return fullPath;
        }
    }
}

export class AttributeExistsExpression extends AttributeExpression {
    constructor(map: AttributeExpressionMap) {
        super(map);
    }

    protected createExpressionString(keyLabel: string): string {
        return `attribute_exists(${keyLabel})`;
    }
}

export class AttributeNotExistsExpression extends AttributeExpression {
    constructor(map: AttributeExpressionMap) {
        super(map);
    }

    protected createExpressionString(keyLabel: string): string {
        return `attribute_not_exists(${keyLabel})`;
    }
}

export class AttributeTypeExpression extends ConditionExpressionImpl<AttributeType> {
    constructor(map: ExpressionMap<AttributeType>) {
        super(map);
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `attribute_type(${keyLabel},${valueLabel})`;
    }
}

export class BeginsWithExpression extends ConditionExpressionImpl<string> {
    constructor(map: ExpressionMap<string>) {
        super(map);
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `begins_with(${keyLabel}, ${valueLabel as string})`;
    }
}

export class ContainsExpression extends ConditionExpressionImpl<ExpressionValue> {
    constructor(map: ExpressionMap<ExpressionValue>) {
        super(map);
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `contains(${keyLabel}, ${valueLabel as string})`;
    }
}

export class SizeExpression extends ConditionExpressionImpl<number> {
    private readonly compareOp: CompareOp;

    constructor(map: ExpressionMap<number>, compareOp: CompareOp) {
        super(map);
        this.compareOp = compareOp;
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return CompareOpFn[this.compareOp](`size(${keyLabel})`, valueLabel);
    }
}
//endregion