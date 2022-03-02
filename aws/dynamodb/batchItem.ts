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

export class BatchPutItem extends BatchItem {
    private readonly _item: DynamodbItem;

    get item() {
        return this._item;
    }

    constructor(tableName: string, item: DynamodbItem) {
        super(tableName);
        this._item = item;
    }
}

export class BatchKeyItem extends BatchItem {
    private readonly _key: DynamoDBKey;

    get key() {
        return this._key;
    }

    constructor(tableName: string, key: DynamoDBKey) {
        super(tableName);
        this._key = key;
    }
}