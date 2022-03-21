import * as DynamoDB from "../aws/dynamodb/dynamodb";
import {DynamoDBItem} from "../aws/dynamodb/dynamodb";
import {BeginsWithExpression} from "../aws/dynamodb/expressions/conditionExpression";
import {UserRecordType} from "./userRecordType";

export interface UserRecord extends DynamoDBItem {
    userId?: string,
    recordId?: string,
}

type Id = string | number | boolean;

export function getRecordId(recordType: UserRecordType, id: Id): string {
    return `${recordType}#${id}`;
}

export async function getUserRecord(userId: string, recordType: UserRecordType, id: Id): Promise<UserRecord> {
    const record = await DynamoDB.getItem(process.env.UserRecordTable, {userId, recordId: getRecordId(recordType, id)});
    return record as UserRecord;
}

export async function putUserRecord(userId: string, recordType: UserRecordType, id: Id, record: UserRecord): Promise<void> {
    record.recordId = record.recordId || getRecordId(recordType, id);
    await DynamoDB.putItem(process.env.UserRecordTable, record);
}

function getRecordIdPrefix(recordType: UserRecordType, identifiers: Id[]): string {
    const idPrefix = identifiers?.join("#");
    return idPrefix ? `${recordType}#${idPrefix}#` : `${recordType}#`;
}

export async function getUserRecords(userId: string, recordType: UserRecordType, ...identifiers: Id[]): Promise<UserRecord[]> {
    const recordIdPrefix = getRecordIdPrefix(recordType, identifiers);
    const records = await DynamoDB.query(process.env.UserRecordTable, {userId}, new BeginsWithExpression({recordId: recordIdPrefix}));
    return records as UserRecord[];
}