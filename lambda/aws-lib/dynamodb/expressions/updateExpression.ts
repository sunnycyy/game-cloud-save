import {
    Expression,
    ExpressionArrayItemIndices,
    ExpressionArrayValue,
    ExpressionAttributes,
    ExpressionMap,
    ExpressionValue
} from "./expression";
import {labelExpressionKeys, labelExpressionMap} from "./expressionUtils";
import {MathOp} from "./mathOp";
import {UpdateOp} from "./updateOp";

type UpdateExpressionValue = string | number | boolean | ExpressionValue;

export interface UpdateExpression extends Expression {
    get updateOp(): UpdateOp;
}

abstract class UpdateExpressionImpl<ValueType extends UpdateExpressionValue> implements UpdateExpression {
    private readonly _map: ExpressionMap<ValueType>;

    protected get map() {
        return this._map;
    }

    protected constructor(map: ExpressionMap<ValueType>) {
        this._map = map;
    }

    abstract get updateOp();

    toExpressionString(attributes: ExpressionAttributes): string {
        const labels = labelExpressionMap(this._map, attributes);
        return labels
            .map(([keyLabel, valueLabel, indices]) => this.createExpressionString(keyLabel as string, valueLabel as string | string[], indices as number[]))
            .join(", ");
    }

    protected abstract createExpressionString(keyLabel: string, valueLabel?: string | string[], indices?: number[]): string;
}

//region Set
abstract class SetExpression<ValueType extends UpdateExpressionValue> extends UpdateExpressionImpl<ValueType> {
    protected constructor(map: ExpressionMap<ValueType>) {
        super(map);
    }

    override get updateOp() {
        return UpdateOp.Set;
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[], indices: number[]): string {
        return `${SetExpression.createExpressionKeyString(keyLabel, indices)} = ${this.createExpressionValueString(keyLabel, valueLabel)}`;
    }

    private static createExpressionKeyString(keyLabel: string, indices: number[]): string {
        return (indices !== undefined) ? `${keyLabel}${indices.map(index => `[${index}]`).join("")}` : keyLabel;
    }

    protected abstract createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string;
}

export class SetAttributeExpression extends SetExpression<UpdateExpressionValue> {
    constructor(map: ExpressionMap<UpdateExpressionValue>) {
        super(map);
    }

    protected override createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string {
        return valueLabel as string;
    }
}

export class SetExpireAtExpression extends SetAttributeExpression {
    constructor(expireAt: number) {
        super({expireAt, expireAt_TTL: Math.ceil(expireAt / 1000)});
    }
}

const MathOpFn = Object.freeze({
    [MathOp.Add]: (a: string, b: string | string[]) => `${a} + ${b as string}`,
    [MathOp.Minus]: (a: string, b: string | string[]) => `${a} - ${b as string}`,
});

export class ApplyMathOpExpression extends SetExpression<number> {
    private readonly mathOp: MathOp;

    constructor(mathOp: MathOp, map: ExpressionMap<number>) {
        super(map);
        this.mathOp = mathOp;
    }

    protected override createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string {
        return MathOpFn[this.mathOp](keyLabel, valueLabel);
    }
}

export class AppendListItemsExpression extends SetExpression<ExpressionArrayValue<UpdateExpressionValue>> {
    constructor(map: ExpressionMap<ExpressionArrayValue<UpdateExpressionValue>>) {
        super(map);
    }

    protected override createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string {
        return `list_append(${keyLabel},${valueLabel as string})`;
    }
}

export class SetAttributeIfNotExistExpression extends SetExpression<UpdateExpressionValue> {
    constructor(map: ExpressionMap<UpdateExpressionValue>) {
        super(map);
    }

    protected override createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string {
        return `if_not_exists(${keyLabel},${valueLabel as string})`;
    }
}
//endregion

export class RemoveExpression extends UpdateExpressionImpl<boolean | ExpressionArrayItemIndices> {
    constructor(map: ExpressionMap<boolean | ExpressionArrayItemIndices>) {
        super(map);
    }

    override get updateOp() {
        return UpdateOp.Remove;
    }

    override toExpressionString(attributes: ExpressionAttributes): string {
        const labels = labelExpressionKeys(this.map, attributes);
        return labels
            .map(([keyLabel, indices]) => this.createExpressionString(keyLabel as string, null, indices as number[]))
            .join(", ");
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[], indices: number[]): string {
        return (indices !== undefined) ? `${keyLabel}${indices.map(index => `[${index}]`).join("")}` : keyLabel;
    }
}

export class AddExpression extends UpdateExpressionImpl<number | ExpressionArrayValue<UpdateExpressionValue>> {
    constructor(map: ExpressionMap<number | ExpressionArrayValue<UpdateExpressionValue>>) {
        super(map);
    }

    override get updateOp() {
        return UpdateOp.Add;
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `${keyLabel} ${valueLabel as string}`;
    }
}

export class DeleteExpression extends UpdateExpressionImpl<ExpressionArrayValue<UpdateExpressionValue>> {
    constructor(map: ExpressionMap<ExpressionArrayValue<UpdateExpressionValue>>) {
        super(map);
    }

    override get updateOp() {
        return UpdateOp.Delete;
    }

    protected override createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `${keyLabel} ${valueLabel as string}`;
    }
}