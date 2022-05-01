import * as DynamoDB from "../aws/dynamodb/dynamodb";
import {DynamoDBItem} from "../aws/dynamodb/dynamodb";
import {genKey} from "./utils";
import {Platform} from "./platform-lib";

enum SaveFileRoot {
    GameInstallPath,
    UserDocuments,

    // Windows specific
    WindowsAppDataLocal,
    WindowsAppDataLocalLow,
    WindowsAppDataRoaming,
}

const PlatformAvailableRootType = Object.freeze({
    [Platform.Windows]: [
        SaveFileRoot.GameInstallPath,
        SaveFileRoot.UserDocuments,
        SaveFileRoot.WindowsAppDataLocal,
        SaveFileRoot.WindowsAppDataLocalLow,
        SaveFileRoot.WindowsAppDataRoaming,
    ],
    [Platform.Mac]: [
        SaveFileRoot.GameInstallPath,
        SaveFileRoot.UserDocuments,
    ],
});

export interface CloudSaveRecord extends DynamoDBItem {
    id?: string,
    userId?: string,
    gameId?: string,
    platform: Platform,
    version: string,
    saveFiles: CloudSaveFile[],
    saveS3Path: string,
}

export interface CloudSaveFile {
    root: SaveFileRoot,
    filePath: string,
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

export function isRootTypeAvailableOnPlatform(root: SaveFileRoot, platform: Platform): boolean {
    return PlatformAvailableRootType[platform].includes(root);
}