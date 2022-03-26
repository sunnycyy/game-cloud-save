import * as DynamoDB from "../aws/dynamodb/dynamodb";
import {DynamoDBItem} from "../aws/dynamodb/dynamodb";

export interface GameRecord extends DynamoDBItem {
    userId?: string,
    gameId: string,
    name: string,
}

const UserGameTable = process.env.UserGameTable;

export async function getGames(userId: string): Promise<GameRecord[]> {
    const records = await DynamoDB.query(UserGameTable, {userId});
    return records as GameRecord[];
}

export async function getGame(userId: string, gameId: string): Promise<GameRecord> {
    const record = await DynamoDB.getItem(UserGameTable, {userId, gameId});
    return record as GameRecord;
}

export async function putGame(userId: string, record: GameRecord): Promise<void> {
    record.userId = userId;
    await DynamoDB.putItem(UserGameTable, record);
}