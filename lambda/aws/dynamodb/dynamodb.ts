import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
    BatchGetCommand, BatchGetCommandInput, BatchWriteCommand, BatchWriteCommandInput,
    DeleteCommand,
    DynamoDBDocumentClient,
    GetCommand,
    GetCommandInput,
    PutCommand,
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    ScanCommand,
    ScanCommandInput,
    ScanCommandOutput, TransactWriteCommand, TransactWriteCommandInput,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {ExpressionAttributes} from "./expressions/expression";
import {ConditionExpression} from "./expressions/conditionExpression";
import {CompareOp} from "./expressions/compareOp";
import {UpdateExpression} from "./expressions/updateExpression";
import {ProjectionExpression} from "./expressions/projectionExpression";
import {KeyCompareExpression, KeyConditionExpression} from "./expressions/keyConditionExpression";
import {AndExpression} from "./expressions/logicalExpression";
import {BatchGetItem, BatchWriteItem} from "./batchItem";
import {TransactConditionCheck, TransactDeleteItem, TransactPutItem, TransactUpdateItem} from "./transactItem";
import {toDeleteItemParams, toPutItemParams, toUpdateItemParams} from "./dynamodbUtils";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: false,
    },
    unmarshallOptions: {
        wrapNumbers: false,
    },
});

export interface DynamoDBItem extends DynamoDBKey {
    createdAt: number,
    updatedAt: number,
    expireAt?: number,
    expireAt_TTL?: number,
}

export type DynamoDBKey = Record<string, NonNullable<any>>;

export async function getItem(tableName: string, key: DynamoDBKey, projection?: ProjectionExpression): Promise<DynamoDBItem> {
    const params: GetCommandInput = {
        TableName: tableName,
        Key: key,
        ConsistentRead: true,
    };
    if (projection) {
        const attributes = new ExpressionAttributes();
        params.ProjectionExpression = projection.toExpressionString(attributes);
        params.ExpressionAttributeNames = attributes.keys;
    }
    const response = await docClient.send(new GetCommand(params));
    return response.Item as DynamoDBItem;
}

export async function putItem(tableName: string, item: DynamoDBItem, condition?: ConditionExpression): Promise<void> {
    await docClient.send(new PutCommand(toPutItemParams(tableName, item, condition)));
}

export async function updateItem(
    tableName: string,
    key: DynamoDBKey,
    updates: UpdateExpression | UpdateExpression[],
    condition?: ConditionExpression
): Promise<DynamoDBItem> {
    const params = toUpdateItemParams(tableName, key, updates, condition);
    params.ReturnValues = "ALL_NEW";
    const response = await docClient.send(new UpdateCommand(params));
    return response.Attributes as DynamoDBItem;
}

export async function deleteItem(tableName: string, key: DynamoDBKey, condition?: ConditionExpression): Promise<void> {
    await docClient.send(new DeleteCommand(toDeleteItemParams(tableName, key, condition)));
}

export async function scan(
    tableName: string,
    filter?: ConditionExpression,
    projection?: ProjectionExpression,
    limit?: number
): Promise<DynamoDBItem[]> {
    const params: ScanCommandInput = {
        TableName: tableName,
        ConsistentRead: true,
    };

    if (limit && limit > 0) {
        params.Limit = limit;
    }

    if (filter || projection) {
        const attributes = new ExpressionAttributes();

        if (filter) {
            params.FilterExpression = filter.toExpressionString(attributes);
        }

        if (projection) {
            params.ProjectionExpression = projection.toExpressionString(attributes);
        }

        params.ExpressionAttributeNames = attributes.keys;
        if (attributes.hasValues()) {
            params.ExpressionAttributeValues = attributes.values;
        }
    }

    return processPaginatedResults(params, params => new ScanCommand(params));
}

export async function query(
    tableName: string,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projection?: ProjectionExpression,
    limit?: number,
): Promise<DynamoDBItem[]> {
    const params: QueryCommandInput = {
        TableName: tableName,
        ConsistentRead: true,
    };

    return _query(params, partitionKey, sortKeyCondition, filter, projection, limit);
}

export async function queryByDescending(
    tableName: string,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projection?: ProjectionExpression,
    limit?: number,
): Promise<DynamoDBItem[]> {
    const params: QueryCommandInput = {
        TableName: tableName,
        ConsistentRead: true,
        ScanIndexForward: false,
    };

    return _query(params, partitionKey, sortKeyCondition, filter, projection, limit);
}

export async function queryIndex(
    tableName: string,
    indexName: string,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projection?: ProjectionExpression,
    limit?: number,
): Promise<DynamoDBItem[]> {
    const params: QueryCommandInput = {
        TableName: tableName,
        IndexName: indexName,
        ConsistentRead: true,
    };

    return _query(params, partitionKey, sortKeyCondition, filter, projection, limit);
}

export async function queryIndexByDescending(
    tableName: string,
    indexName: string,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projection?: ProjectionExpression,
    limit?: number,
): Promise<DynamoDBItem[]> {
    const params: QueryCommandInput = {
        TableName: tableName,
        IndexName: indexName,
        ConsistentRead: true,
        ScanIndexForward: false,
    };

    return _query(params, partitionKey, sortKeyCondition, filter, projection, limit);
}

async function _query(
    params: QueryCommandInput,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projection?: ProjectionExpression,
    limit?: number,
): Promise<DynamoDBItem[]> {
    if (limit && limit > 0) {
        params.Limit = limit;
    }

    const attributes = new ExpressionAttributes();
    const partitionKeyCondition = new KeyCompareExpression(CompareOp.Equal, partitionKey);
    const keyCondition = sortKeyCondition ? new AndExpression(partitionKeyCondition, sortKeyCondition) : partitionKeyCondition;
    params.KeyConditionExpression = keyCondition.toExpressionString(attributes);

    if (filter) {
        params.FilterExpression = filter.toExpressionString(attributes);
    }

    if (projection) {
        params.ProjectionExpression = projection.toExpressionString(attributes);
    }

    params.ExpressionAttributeNames = attributes.keys;
    if (attributes.hasValues()) {
        params.ExpressionAttributeValues = attributes.values;
    }

    return processPaginatedResults(params, params => new QueryCommand(params));
}

async function processPaginatedResults(
    params: QueryCommandInput | ScanCommandInput,
    createCommandFn: (params: QueryCommandInput | ScanCommandInput) => QueryCommand | ScanCommand,
    results: DynamoDBItem[] = []
) {
    const response: QueryCommandOutput | ScanCommandOutput = await docClient.send(createCommandFn(params));
    results.push(...response.Items as DynamoDBItem[]);

    if (response.LastEvaluatedKey && (!params.Limit || results.length < params.Limit)) {
        params.ExclusiveStartKey = response.LastEvaluatedKey;
        return processPaginatedResults(params, createCommandFn, results);
    }

    return results;
}

const BatchMaxRetryCount = 3;

export type BatchGetItemProjections = Record<string, ProjectionExpression>;
const BatchGetItemLimit = 100;

export async function batchGetItem(keys: BatchGetItem[], projections?: BatchGetItemProjections): Promise<DynamoDBItem[]> {
    if (keys.length < BatchGetItemLimit) {
        return _batchGetItem(keys, projections);
    }

    const items: DynamoDBItem[] = [];
    const batchCount = Math.ceil(keys.length / BatchGetItemLimit);
    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * BatchGetItemLimit;
        const endIndex = startIndex + BatchGetItemLimit;
        const batchKeys = keys.slice(startIndex, endIndex);
        const results = await _batchGetItem(batchKeys, projections);
        items.push(...results);
    }
    return items;
}

async function _batchGetItem(keys: BatchGetItem[], projections?: BatchGetItemProjections): Promise<DynamoDBItem[]> {
    const params: BatchGetCommandInput = {
        RequestItems: {},
    };
    for (let i = 0; i < keys.length; i++) {
        const {tableName, key} = keys[i];
        let requestItem = params.RequestItems[tableName];
        if (!requestItem) {
            requestItem = {
                Keys: [],
                ConsistentRead: true,
            }
            const projection = projections[tableName];
            if (projection) {
                const attributes = new ExpressionAttributes();
                requestItem.ProjectionExpression = projection.toExpressionString(attributes);
                requestItem.ExpressionAttributeNames = attributes.keys;
            }
            params.RequestItems[tableName] = requestItem;
        }
        requestItem.Keys.push(key);
    }

    return __batchGetItem(params);
}

async function __batchGetItem(params: BatchGetCommandInput, results: DynamoDBItem[] = [], retryCount = 0): Promise<DynamoDBItem[]> {
    const response = await docClient.send(new BatchGetCommand(params));
    for (const items of Object.values(response.Responses)) {
        results.push(...items as DynamoDBItem[]);
    }

    if (!response.UnprocessedKeys) {
        return results;
    }

    if (retryCount >= BatchMaxRetryCount) {
        throw "BATCH_RETRY_LIMIT_EXCEED";
    }

    params.RequestItems = response.UnprocessedKeys;
    const delay = getBatchDelayMs(retryCount);
    const nextRetryCount = retryCount + 1;
    return new Promise<void>((resolve) => setTimeout(() => resolve(), delay))
        .then(_ => __batchGetItem(params, results, nextRetryCount));
}

function getBatchDelayMs(retryCount) {
    return Math.pow(2, retryCount) * 1000;
}

const BatchWriteItemLimit = 25;

export async function batchWriteItem(items: BatchWriteItem[]): Promise<void> {
    if (items.length < BatchWriteItemLimit) {
        return _batchWriteItem(items);
    }

    const batchCount = Math.ceil(items.length / BatchWriteItemLimit);
    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * BatchWriteItemLimit;
        const endIndex = startIndex + BatchWriteItemLimit;
        const batchItems = items.slice(startIndex, endIndex);
        await _batchWriteItem(batchItems);
    }
}

async function _batchWriteItem(items: BatchWriteItem[]): Promise<void> {
    const params: BatchWriteCommandInput = {
        RequestItems: {},
    };
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let requestItem = params.RequestItems[item.tableName];
        if (!requestItem) {
            requestItem = [];
            params.RequestItems[item.tableName] = requestItem;
        }
        requestItem.push(item.toBatchWriteParams());
    }

    return __batchWriteItem(params);
}

async function __batchWriteItem(params: BatchWriteCommandInput, retryCount = 0): Promise<void> {
    const response = await docClient.send(new BatchWriteCommand(params));
    if (!response.UnprocessedItems) {
        return;
    }

    if (retryCount >= BatchMaxRetryCount) {
        throw "BATCH_RETRY_LIMIT_EXCEED";
    }

    params.RequestItems = response.UnprocessedItems;
    const delay = getBatchDelayMs(retryCount);
    const nextRetryCount = retryCount + 1;
    return new Promise<void>((resolve) => setTimeout(() => resolve(), delay))
        .then(_ => __batchWriteItem(params, nextRetryCount));
}

const TransactItemLimit = 25;

type TransactWriteItem = TransactPutItem | TransactUpdateItem | TransactDeleteItem | TransactConditionCheck;

export async function transactWriteItems(items: TransactWriteItem[]): Promise<void> {
    if (items.length > TransactItemLimit) {
        throw "TRANSACT_WRITE_LIMIT_EXCEED";
    }

    const params: TransactWriteCommandInput = {
        TransactItems: items.map(item => item.toTransactParams()),
    };
    await docClient.send(new TransactWriteCommand(params));
}