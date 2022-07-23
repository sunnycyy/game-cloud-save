import * as DynamoDB from "../aws-lib/dynamodb/dynamodb-lib";
import * as S3 from "../aws-lib/s3/s3-lib";
import {Platform} from "./platform-lib";
import {genKey} from "./utils";
import {DynamoDBItem} from "../aws-lib/dynamodb/dynamodbItem";
import {AttributeNotExistsExpression} from "../aws-lib/dynamodb/expressions/conditionExpression";

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
    cloudStoragePath: string,
}

export interface CloudSaveFile {
    root: SaveFileRoot,
    filePath: string,
}

const UserCloudSaveTable = process.env.UserCloudSaveTable;
const StorageBucket = process.env.StorageBucket;

function getId(userId: string, gameId: string): string {
    return genKey(userId, gameId)
}

export async function getCloudSaves(userId: string, gameId: string): Promise<CloudSaveRecord[]> {
    const id = getId(userId, gameId);
    const records = await DynamoDB.query(UserCloudSaveTable, {id}, null, new AttributeNotExistsExpression({expireAt: true}));
    return records as CloudSaveRecord[];
}

export async function getCloudSave(userId: string, gameId: string, createdAt: number): Promise<CloudSaveRecord> {
    const id = getId(userId, gameId);
    const record = await DynamoDB.getItem(UserCloudSaveTable, {id, createdAt});
    return record as CloudSaveRecord;
}

export async function putCloudSave(userId: string, gameId: string, record: CloudSaveRecord): Promise<void> {
    record.id = getId(userId, gameId);
    record.userId = userId;
    record.gameId = gameId;
    await DynamoDB.putItem(UserCloudSaveTable, record);
}

export function isRootTypeAvailableOnPlatform(root: SaveFileRoot, platform: Platform): boolean {
    return PlatformAvailableRootType[platform].includes(root);
}

const uploadCloudSaveFileUrlExpireInSecond = 60;

export async function getUploadCloudSaveFileUrl(path: string): Promise<string> {
    return S3.getUploadFilePresignedUrl(StorageBucket, path, uploadCloudSaveFileUrlExpireInSecond);
}

export async function isCloudSaveFileUploaded(path: string): Promise<boolean> {
    return S3.isFileExists(StorageBucket, path);
}

const downloadCloudSaveFileUrlExpireInSecond = 300;

export async function getDownloadCloudSaveFileUrl(path: string): Promise<string> {
    return S3.getDownloadFilePresignedUrl(StorageBucket, path, downloadCloudSaveFileUrlExpireInSecond);
}