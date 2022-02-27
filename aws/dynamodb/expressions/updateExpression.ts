import {
    Expression,
    ExpressionArrayIndex,
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
        const [keyLabel, valueLabel, index] = labelExpressionMap(this._map, attributes);
        return this.createExpressionString(keyLabel as string, valueLabel as string | string[], index as number);
    }

    protected abstract createExpressionString(keyLabel: string, valueLabel?: string | string[], index?: number): string;
}

//region Set
abstract class SetExpression<ValueType extends UpdateExpressionValue> extends UpdateExpressionImpl<ValueType> {
    protected constructor(map: ExpressionMap<ValueType>) {
        super(map);
    }

    get updateOp() {
        return UpdateOp.Set;
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[], index: number): string {
        return `${SetExpression.createExpressionKeyString(keyLabel, index)} = ${this.createExpressionValueString(keyLabel, valueLabel)}`;
    }

    private static createExpressionKeyString(keyLabel: string, index: number): string {
        return (index !== undefined) ? `${keyLabel}[${index}]` : keyLabel;
    }

    protected abstract createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string;
}

export class SetAttributeExpression extends SetExpression<UpdateExpressionValue> {
    constructor(map: ExpressionMap<UpdateExpressionValue>) {
        super(map);
    }

    protected createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string {
        return valueLabel as string;
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

    protected createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string {
        return MathOpFn[this.mathOp](keyLabel, valueLabel);
    }
}

export class AppendListItemsExpression extends SetExpression<ExpressionArrayValue<UpdateExpressionValue>> {
    constructor(map: ExpressionMap<ExpressionArrayValue<UpdateExpressionValue>>) {
        super(map);
    }

    protected createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string {
        return `list_append(${keyLabel},${valueLabel as string})`;
    }
}

export class SetAttributeIfNotExistExpression extends SetExpression<UpdateExpressionValue> {
    constructor(map: ExpressionMap<UpdateExpressionValue>) {
        super(map);
    }

    protected createExpressionValueString(keyLabel: string, valueLabel: string | string[]): string {
        return `if_not_exists(${keyLabel},${valueLabel as string})`;
    }
}

export class SetExpireAtExpression extends SetAttributeExpression {
    private readonly _expireAt: number;

    get expireAt() {
        return this._expireAt;
    }

    constructor(expireAt: number) {
        super({expireAt});
    }
}
//endregion

//region Remove
abstract class RemoveExpression<ValueType extends boolean | ExpressionArrayIndex> extends UpdateExpressionImpl<ValueType> {
    protected constructor(map: ExpressionMap<ValueType>) {
        super(map);
    }

    get updateOp() {
        return UpdateOp.Remove;
    }
}

export class RemoveAttributeExpression extends RemoveExpression<boolean> {
    constructor(map: ExpressionMap<boolean>) {
        super(map);
    }

    toExpressionString(attributes: ExpressionAttributes): string {
        const keyLabel = labelExpressionKeys(this.map, attributes);
        return this.createExpressionString(keyLabel);
    }

    protected createExpressionString(keyLabel: string): string {
        return keyLabel;
    }
}

export class RemoveListItemExpression extends RemoveExpression<ExpressionArrayIndex> {
    constructor(map: ExpressionMap<ExpressionArrayIndex>) {
        super(map);
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[], index: number): string {
        return `${keyLabel}[${index}]`;
    }
}
//endregion

//region Add
abstract class AddExpression<ValueType extends number | ExpressionArrayValue<UpdateExpressionValue>> extends UpdateExpressionImpl<ValueType> {
    protected constructor(map: ExpressionMap<ValueType>) {
        super(map);
    }

    get updateOp() {
        return UpdateOp.Add;
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `${keyLabel} ${valueLabel as string}`;
    }
}

export class AddNumberExpression extends AddExpression<number> {
    constructor(map: ExpressionMap<number>) {
        super(map);
    }
}

export class AddListItemsExpression extends AddExpression<ExpressionArrayValue<UpdateExpressionValue>> {
    constructor(map: ExpressionMap<ExpressionArrayValue<UpdateExpressionValue>>) {
        super(map);
    }
}
//endregion

export class DeleteExpression extends UpdateExpressionImpl<ExpressionArrayValue<UpdateExpressionValue>> {
    constructor(map: ExpressionMap<ExpressionArrayValue<UpdateExpressionValue>>) {
        super(map);
    }

    get updateOp() {
        return UpdateOp.Delete;
    }

    protected createExpressionString(keyLabel: string, valueLabel: string | string[]): string {
        return `${keyLabel} ${valueLabel as string}`;
    }
}