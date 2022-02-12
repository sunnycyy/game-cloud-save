import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
    DeleteCommand,
    DeleteCommandInput,
    DynamoDBDocumentClient,
    GetCommand,
    GetCommandInput,
    PutCommand,
    PutCommandInput,
    UpdateCommandInput
} from "@aws-sdk/lib-dynamodb";
import {ExpressionAttributes} from "./expressions/expressionAttributes";
import {AttributeNotExistsExpression, CompareExpression, ConditionExpression} from "./expressions/conditionExpression";
import {CompareOp} from "./expressions/compareOp";

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
    expireAt: number,
    expireAt_TTL: number,
}

type DynamoDBKey = Record<string, any>;

export async function get(tableName: string, key: DynamoDBKey, projectionMap: Record<string, any> = undefined) {
    const params: GetCommandInput = {
        TableName: tableName,
        Key: key,
        ConsistentRead: true,
    };
    if (projectionMap) {
        params.ExpressionAttributeNames = {};
        params.ProjectionExpression = "";
        addProjectionExpression(params, projectionMap);
    }
    const response = await docClient.send(new GetCommand(params));
    return response.Item;
}

function addProjectionExpression(params: GetCommandInput, projectionMap: object, attributePath = "", keyCount = 0): number {
    for (const [key, value] of Object.entries(projectionMap)) {
        const attributeNameKey = `#projKey${keyCount++}`;
        params.ExpressionAttributeNames[attributeNameKey] = key;
        const attributeFullPath = attributePath ? `${attributePath}.${attributeNameKey}` : attributeNameKey;
        if (typeof value === "object" && !Array.isArray(value)) {
            keyCount = addProjectionExpression(params, value, attributeFullPath, keyCount);
            continue;
        }
        params.ProjectionExpression = params.ProjectionExpression ? `${params.ProjectionExpression}, ${attributeFullPath}` : attributeFullPath;
    }
    return keyCount;
}

function markTimestamp(item: DynamodbItem) {
    const now = Date.now();
    item.createdAt = item.createdAt || now;
    item.updatedAt = now;
    if (item.expireAt) {
        item.expireAt_TTL = Math.ceil(item.expireAt / 1000);
    }
}

export async function put(tableName: string, item: DynamodbItem) {
    markTimestamp(item);
    const params: PutCommandInput = {
        TableName: tableName,
        Item: item,
    };
    await _put(params);
    return item;
}

async function _put(params: PutCommandInput) {
    return docClient.send(new PutCommand(params));
}

export async function putIfNotExist(tableName: string, item: DynamodbItem, keyName: string) {
    return conditionalPut(tableName, item, new AttributeNotExistsExpression({[keyName]: true}));
}

export async function putIfNotUpdated(tableName: string, item: DynamodbItem) {
    const {updatedAt} = item;
    return conditionalPut(tableName, item, new CompareExpression(CompareOp.Equal, {updatedAt}));
}

async function conditionalPut(tableName: string, item: DynamodbItem, condition: ConditionExpression) {
    try {
        const attributes = new ExpressionAttributes();
        const expressionString = condition.toExpressionString(attributes);
        markTimestamp(item);
        const param: PutCommandInput = {
            TableName: tableName,
            Item: item,
            ConditionExpression: expressionString,
            ExpressionAttributeNames: attributes.keys,
        }
        if (attributes.hasValues()) {
            param.ExpressionAttributeValues = attributes.values;
        }
        await _put(param);
        return param.Item;
    }
    catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
            return null;
        }
        throw error;
    }
}

export async function del(tableName: string, key: DynamoDBKey) {
    const params: DeleteCommandInput = {
        TableName: tableName,
        Key: key,
    };
    await docClient.send(new DeleteCommand(params));
}

type AddMap = Record<string, number | Array<any>>;
type DeleteMap = Record<string, Array<any>>;
export async function update(tableName: string, key: Record<string, any>, setMap: Record<string, any>, removeMap: Record<string, any>, addMap: AddMap, deleteMap: DeleteMap) {
    const params: UpdateCommandInput = {
        TableName: tableName,
        Key: key,
        ReturnValues: "ALL_NEW",
    };

    setMap = setMap || {};
    setMap.updatedAt = Date.now();


}