import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
    DeleteCommand,
    DeleteCommandInput,
    DynamoDBDocumentClient,
    GetCommand,
    GetCommandInput,
    PutCommand,
    PutCommandInput,
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    ScanCommand,
    ScanCommandInput,
    ScanCommandOutput,
    UpdateCommand,
    UpdateCommandInput
} from "@aws-sdk/lib-dynamodb";
import {ExpressionAttributes} from "./expressions/expression";
import {ConditionExpression} from "./expressions/conditionExpression";
import {CompareOp} from "./expressions/compareOp";
import {
    SetAttributeExpression,
    SetAttributeIfNotExistExpression,
    UpdateExpression
} from "./expressions/updateExpression";
import {ProjectionExpression} from "./expressions/projectionExpression";
import {KeyCompareExpression, KeyConditionExpression} from "./expressions/keyConditionExpression";
import {AndExpression} from "./expressions/logicalExpression";

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

export interface DynamodbItem extends Record<string, any>{
    createdAt: number,
    updatedAt: number,
    expireAt?: number,
    expireAt_TTL?: number,
}

type DynamoDBKey = Record<string, any>;

export async function getItem(tableName: string, key: DynamoDBKey, projections?: ProjectionExpression | ProjectionExpression[]): Promise<DynamodbItem> {
    const params: GetCommandInput = {
        TableName: tableName,
        Key: key,
        ConsistentRead: true,
    };
    if (projections) {
        const attributes = new ExpressionAttributes();
        params.ProjectionExpression = toProjectionExpressionString(projections, attributes);
        params.ExpressionAttributeNames = attributes.keys;
    }
    const response = await docClient.send(new GetCommand(params));
    return response.Item as DynamodbItem;
}

function toProjectionExpressionString(projections: ProjectionExpression | ProjectionExpression[], attributes: ExpressionAttributes): string {
    return Array.isArray(projections) ?
        projections.map(projection => projection.toExpressionString(attributes)).join(", ") :
        projections.toExpressionString(attributes);
}

function markTimestamp(item: DynamodbItem): void {
    const now = Date.now();
    item.createdAt = item.createdAt || now;
    item.updatedAt = now;
    if (item.expireAt) {
        item.expireAt_TTL = Math.ceil(item.expireAt / 1000);
    }
}

export async function putItem(tableName: string, item: DynamodbItem, condition?: ConditionExpression): Promise<void> {
    markTimestamp(item);
    const params: PutCommandInput = {
        TableName: tableName,
        Item: item,
    };

    if (condition) {
        const attributes = new ExpressionAttributes();
        params.ConditionExpression = condition.toExpressionString(attributes);
        params.ExpressionAttributeNames = attributes.keys;
        if (attributes.hasValues()) {
            params.ExpressionAttributeValues = attributes.values;
        }
    }

    await docClient.send(new PutCommand(params));
}

export async function deleteItem(tableName: string, key: DynamoDBKey, condition?: ConditionExpression): Promise<void> {
    const params: DeleteCommandInput = {
        TableName: tableName,
        Key: key,
    };

    if (condition) {
        const attributes = new ExpressionAttributes();
        params.ConditionExpression = condition.toExpressionString(attributes);
        params.ExpressionAttributeNames = attributes.keys;
        if (attributes.hasValues()) {
            params.ExpressionAttributeValues = attributes.values;
        }
    }

    await docClient.send(new DeleteCommand(params));
}

export async function updateItem(
    tableName: string,
    key: DynamoDBKey,
    updates: UpdateExpression | UpdateExpression[],
    condition?: ConditionExpression
): Promise<DynamodbItem> {
    const params: UpdateCommandInput = {
        TableName: tableName,
        Key: key,
        ReturnValues: "ALL_NEW",
    };

    if (!Array.isArray(updates)) {
        updates = [updates];
    }

    const now = Date.now();
    updates.push(new SetAttributeIfNotExistExpression({createdAt: now}));
    updates.push(new SetAttributeExpression({updatedAt: now}));

    const attributes = new ExpressionAttributes();
    const expressionStrings: Record<string, string[]> = {};
    for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        const expressionString = update.toExpressionString(attributes);
        const updateOp = update.updateOp;
        expressionStrings[updateOp] = expressionStrings[updateOp] || [];
        expressionStrings[updateOp].push(expressionString);
    }

    params.UpdateExpression = Object.entries(expressionStrings)
        .map(([updateOp, expressions]) => `${updateOp} ${expressions.join(", ")}`)
        .join(" ");

    if (condition) {
        params.ConditionExpression = condition.toExpressionString(attributes);
    }

    params.ExpressionAttributeNames = attributes.keys;
    if (attributes.hasValues()) {
        params.ExpressionAttributeValues = attributes.values;
    }

    const response = await docClient.send(new UpdateCommand(params));
    return response.Attributes as DynamodbItem;
}

export async function scan(
    tableName: string,
    filter?: ConditionExpression,
    projections?: ProjectionExpression | ProjectionExpression[],
    limit?: number
): Promise<DynamodbItem[]> {
    const params: ScanCommandInput = {
        TableName: tableName,
        ConsistentRead: true,
    };

    if (limit && limit > 0) {
        params.Limit = limit;
    }

    if (filter || projections) {
        const attributes = new ExpressionAttributes();

        if (filter) {
            params.FilterExpression = filter.toExpressionString(attributes);
        }

        if (projections) {
            params.ProjectionExpression = toProjectionExpressionString(projections, attributes);
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
    projections?: ProjectionExpression | ProjectionExpression[],
    limit?: number,
): Promise<DynamodbItem[]> {
    const params: QueryCommandInput = {
        TableName: tableName,
        ConsistentRead: true,
    };

    return _query(params, partitionKey, sortKeyCondition, filter, projections, limit);
}

export async function queryByDescending(
    tableName: string,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projections?: ProjectionExpression | ProjectionExpression[],
    limit?: number,
): Promise<DynamodbItem[]> {
    const params: QueryCommandInput = {
        TableName: tableName,
        ConsistentRead: true,
        ScanIndexForward: false,
    };

    return _query(params, partitionKey, sortKeyCondition, filter, projections, limit);
}

export async function queryIndex(
    tableName: string,
    indexName: string,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projections?: ProjectionExpression | ProjectionExpression[],
    limit?: number,
): Promise<DynamodbItem[]> {
    const params: QueryCommandInput = {
        TableName: tableName,
        IndexName: indexName,
        ConsistentRead: true,
    };

    return _query(params, partitionKey, sortKeyCondition, filter, projections, limit);
}

export async function queryIndexByDescending(
    tableName: string,
    indexName: string,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projections?: ProjectionExpression | ProjectionExpression[],
    limit?: number,
): Promise<DynamodbItem[]> {
    const params: QueryCommandInput = {
        TableName: tableName,
        IndexName: indexName,
        ConsistentRead: true,
        ScanIndexForward: false,
    };

    return _query(params, partitionKey, sortKeyCondition, filter, projections, limit);
}

async function _query(
    params: QueryCommandInput,
    partitionKey: DynamoDBKey,
    sortKeyCondition?: KeyConditionExpression,
    filter?: ConditionExpression,
    projections?: ProjectionExpression | ProjectionExpression[],
    limit?: number,
): Promise<DynamodbItem[]> {
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

    if (projections) {
        params.ProjectionExpression = toProjectionExpressionString(projections, attributes);
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
    results: DynamodbItem[] = []
) {
    const response: QueryCommandOutput | ScanCommandOutput = await docClient.send(createCommandFn(params));
    results.push(...response.Items as DynamodbItem[]);

    if (response.LastEvaluatedKey && (!params.Limit || results.length < params.Limit)) {
        params.ExclusiveStartKey = response.LastEvaluatedKey;
        return processPaginatedResults(params, createCommandFn, results);
    }

    return results;
}