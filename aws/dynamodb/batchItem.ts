import {DynamodbItem, DynamoDBKey} from "./dynamodb";

abstract class BatchItem {
    private readonly _tableName: string;

    get tableName() {
        return this._tableName;
    }

    protected constructor(tableName: string) {
        this._tableName = tableName;
    }
}

abstract class BatchKeyItem extends BatchItem {
    private readonly _key: DynamoDBKey;

    get key() {
        return this._key;
    }

    protected constructor(tableName: string, key: DynamoDBKey) {
        super(tableName);
        this._key = key;
    }
}

export class BatchGetItem extends BatchKeyItem {
    constructor(tableName: string, key: DynamoDBKey) {
        super(tableName, key);
    }
}

export interface BatchWriteItem {
    get tableName(): string;
    toBatchWriteParams(): Record<string, Record<string, DynamoDBKey>>;
}

export class BatchPutItem extends BatchItem implements BatchWriteItem {
    private readonly _item: DynamodbItem;

    constructor(tableName: string, item: DynamodbItem) {
        super(tableName);
        this._item = item;
    }

    toBatchWriteParams(): {PutRequest: {Item: DynamodbItem}} {
        return {PutRequest: {Item: this._item}};
    }
}

export class BatchDeleteItem extends BatchKeyItem implements BatchWriteItem {
    constructor(tableName: string, key: DynamoDBKey) {
        super(tableName, key);
    }

    toBatchWriteParams(): {DeleteRequest: {Key: DynamoDBKey}} {
        return {DeleteRequest: {Key: this.key}};
    }
}