import {ConditionExpression} from "./expressions/conditionExpression";
import {UpdateExpression} from "./expressions/updateExpression";
import {ExpressionAttributes} from "./expressions/expression";
import {PutCommandInput, UpdateCommandInput} from "@aws-sdk/lib-dynamodb";
import {createDeleteItemParams, createPutItemParams, createUpdateItemParams} from "./dynamodbUtils";
import {DynamoDBItem, DynamoDBKey} from "./dynamodbItem";

interface TransactParams {
    TableName: string,
}

interface TransactKeyParams extends TransactParams {
    Key: DynamoDBKey,
}

interface TransactConditionParams {
    ConditionExpression?: string,
    ExpressionAttributeNames?: Record<string, string>,
    ExpressionAttributeValues?: Record<string, NonNullable<any>>,
}

abstract class TransactItem {
    private readonly _tableName: string;

    protected get tableName() {
        return this._tableName;
    }

    protected constructor(tableName: string) {
        this._tableName = tableName;
    }

    abstract toTransactParams(): Record<string, TransactParams>;
}

abstract class TransactKeyItem extends TransactItem {
    protected readonly _key: DynamoDBKey;

    get key() {
        return this._key;
    }

    protected constructor(tableName: string, key: DynamoDBKey) {
        super(tableName);
        this._key = key;
    }

    abstract override toTransactParams(): Record<string, TransactKeyParams>;
}

type TransactPutParams = TransactParams & TransactConditionParams & Pick<PutCommandInput, "Item">;

export class TransactPutItem extends TransactItem {
    private readonly item: DynamoDBItem;
    private readonly condition: ConditionExpression;

    constructor(tableName: string, item: DynamoDBItem, condition?: ConditionExpression) {
        super(tableName);
        this.item = item;
        this.condition = condition;
    }

    override toTransactParams(): {Put: TransactPutParams} {
        return {Put: createPutItemParams(this.tableName, this.item, this.condition)};
    }
}

type TransactConditionKeyParams = TransactKeyParams & TransactConditionParams;

abstract class TransactConditionKeyItem extends TransactKeyItem {
    private readonly _condition: ConditionExpression;

    protected get condition() {
        return this._condition;
    }

    protected constructor(tableName: string, key: DynamoDBKey, condition: ConditionExpression) {
        super(tableName, key);
        this._condition = condition;
    }

    abstract override toTransactParams(): Record<string, TransactConditionKeyParams>;
}

type TransactConditionCheckParams = TransactConditionKeyParams & Required<Pick<TransactConditionParams, "ConditionExpression" | "ExpressionAttributeNames">>;

export class TransactConditionCheck extends TransactConditionKeyItem {
    constructor(tableName: string, key: DynamoDBKey, condition: ConditionExpression) {
        super(tableName, key, condition);
    }

    override toTransactParams(): {ConditionCheck: TransactConditionCheckParams} {
        const params: TransactConditionCheckParams = {
            TableName: this.tableName,
            Key: this.key,
            ConditionExpression: undefined,
            ExpressionAttributeNames: undefined,
        };
        const attribute = new ExpressionAttributes();
        params.ConditionExpression = this.condition.toExpressionString(attribute);
        params.ExpressionAttributeNames = attribute.keys;
        if (attribute.hasValues()) {
            params.ExpressionAttributeValues = attribute.values;
        }
        return {ConditionCheck: params};
    }
}

type TransactDeleteParams = TransactConditionKeyParams;

export class TransactDeleteItem extends TransactConditionKeyItem {
    constructor(tableName: string, key: DynamoDBKey, condition?: ConditionExpression) {
        super(tableName, key, condition);
    }

    override toTransactParams(): {Delete: TransactDeleteParams} {
        return {Delete: createDeleteItemParams(this.tableName, this.key, this.condition)};
    }
}

type TransactUpdateParams = TransactConditionKeyParams & Required<Pick<UpdateCommandInput, "UpdateExpression">>;

export class TransactUpdateItem extends TransactConditionKeyItem {
    private readonly _updates: UpdateExpression[];

    constructor(tableName: string, key: DynamoDBKey, updates: UpdateExpression | UpdateExpression[], condition?: ConditionExpression) {
        super(tableName, key, condition);
        this._updates = Array.isArray(updates) ? updates : [updates];
    }

    override toTransactParams(): {Update: TransactUpdateParams} {
        const params = createUpdateItemParams(this.tableName, this.key, this._updates, this.condition);
        delete params.ReturnValues;
        return {Update: params as TransactUpdateParams};
    }
}