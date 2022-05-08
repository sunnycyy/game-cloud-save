import {ConditionExpression} from "./expressions/conditionExpression";
import {DeleteCommandInput, PutCommandInput, UpdateCommandInput} from "@aws-sdk/lib-dynamodb";
import {ExpressionAttributes} from "./expressions/expression";
import {
    SetAttributeExpression,
    SetAttributeIfNotExistExpression,
    UpdateExpression
} from "./expressions/updateExpression";
import {DynamoDBItem, DynamoDBKey} from "./dynamodbItem";

function markTimestamp(item: DynamoDBItem): void {
    const now = Date.now();
    item.createdAt = item.createdAt || now;
    item.updatedAt = now;
    if (item.expireAt) {
        item.expireAt_TTL = Math.ceil(item.expireAt / 1000);
    }
}

export function createPutItemParams(tableName: string, item: DynamoDBItem, condition?: ConditionExpression): PutCommandInput {
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

    return params;
}

export function createUpdateItemParams(
    tableName: string,
    key: DynamoDBKey,
    updates: UpdateExpression | UpdateExpression[],
    condition?: ConditionExpression
): UpdateCommandInput {
    const params: UpdateCommandInput = {
        TableName: tableName,
        Key: key,
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

    return params;
}

export function createDeleteItemParams(tableName: string, key: DynamoDBKey, condition?: ConditionExpression): DeleteCommandInput {
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

    return params;
}