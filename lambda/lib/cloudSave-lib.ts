import * as DynamoDB from "../aws/dynamodb/dynamodb";
import {DynamoDBItem} from "../aws/dynamodb/dynamodb";
import {genKey} from "./utils";

export enum SavePathType {
    File,
    Directory,
}

export enum SavePathRootType {
    GameInstallPath,

    // Windows specific
    WindowsAppData,
    WindowsLocalAppData,
    WindowsLocalLowAppData,
}

export interface CloudSaveRecord extends DynamoDBItem {
    id?: string,
    userId?: string,
    gameId?: string,
    platform: string,
    version: string,
    savePathType: SavePathType,
    savePathRootType: SavePathRootType,
    savePath: string,
    saveS3Path: string,
}

const UserCloudSaveTable = process.env.UserCloudSaveTable;

function getId(userId: string, gameId: string): string {
    return genKey(userId, gameId)
}

export async function getCloudSaves(userId: string, gameId: string): Promise<CloudSaveRecord[]> {
    const id = getId(userId, gameId);
    const records = await DynamoDB.query(UserCloudSaveTable, {id});
    return records as CloudSaveRecord[];
}

export async function getCloudSave(userId: string, gameId: string, createdAt: number): Promise<CloudSaveRecord> {
    const id = getId(userId, gameId);
    const record = await DynamoDB.getItem(UserCloudSaveTable, {id, createdAt});
    return record as CloudSaveRecord;
}

export async function putCloudSave(userId: string, gameId: string, record: CloudSaveRecord): Promise<void> {
    const id = getId(userId, gameId);
    record.id = id;
    record.userId = userId;
    record.gameId = gameId;
    await DynamoDB.putItem(UserCloudSaveTable, record);
}