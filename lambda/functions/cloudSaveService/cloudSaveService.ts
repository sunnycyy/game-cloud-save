import {APIGatewayProxyHandlerV2WithJWTAuthorizer} from "aws-lambda";
import {ApiHandler, EventClaims, EventData, EventHandler} from "../../lib/apiHandler";
import {assertCondition, assertDefined, assertExist, assertArrayNotEmpty} from "../../lib/assert-lib";
import * as CloudSave from "../../lib/cloudSave-lib";
import {CloudSaveFile, CloudSaveRecord} from "../../lib/cloudSave-lib";
import {Hour} from "../../lib/constant-lib";
import {Platform} from "../../lib/platform-lib";

const handlers: Record<string, EventHandler> = Object.freeze({
    getAllCloudSaves,
    requestUploadCloudSave,
    completeUploadCloudSave,
    requestDownloadCloudSave,
});

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event, context) => {
    return ApiHandler.handle(event, context, handlers);
}

interface GetAllCloudSavesData extends EventData {
    gameId: string,
}

async function getAllCloudSaves(data: GetAllCloudSavesData, claims: EventClaims): Promise<CloudSaveRecord[]> {
    const {userId} = claims;
    const {gameId} = data;
    assertDefined({gameId});

    return CloudSave.getCloudSaves(userId, gameId);
}

interface RequestUploadCloudSaveData extends EventData {
    gameId: string,
    platform: Platform,
    version: string,
    saveFiles: CloudSaveFile[],
}

interface RequestUploadCloudSaveResult {
    cloudSave: CloudSaveRecord,
    uploadUrl: string,
}

async function requestUploadCloudSave(data: RequestUploadCloudSaveData, claims: EventClaims): Promise<RequestUploadCloudSaveResult> {
    const {userId} = claims;
    const {gameId, platform, version, saveFiles} = data;
    assertDefined({gameId, platform, version, saveFiles});
    assertArrayNotEmpty({saveFiles});

    verifyCloudSaveFiles(platform, saveFiles);

    const createdAt = Date.now();
    const cloudSave: CloudSaveRecord = {
        platform,
        version,
        saveFiles,
        createdAt,
        cloudStoragePath: `cloudSaves/${userId}/${gameId}/${createdAt}.zip`,
        expireAt: Date.now() + Hour,
    };
    await CloudSave.putCloudSave(userId, gameId, cloudSave);

    const uploadUrl = await CloudSave.getUploadCloudSaveFileUrl(cloudSave.cloudStoragePath);
    return {cloudSave, uploadUrl};
}

function verifyCloudSaveFiles(platform: Platform, saveFiles: CloudSaveFile[]): void {
    for (const saveFile of saveFiles) {
        assertCondition(CloudSave.isRootTypeAvailableOnPlatform(saveFile.root, platform), "Invalid save file root", saveFile);
    }
}

interface CompleteUploadCloudSaveData extends EventData {
    gameId: string,
    createdAt: number,
}

async function completeUploadCloudSave(data: CompleteUploadCloudSaveData, claims: EventClaims): Promise<CloudSaveRecord> {
    const {userId} = claims;
    const {gameId, createdAt} = data;
    assertDefined({gameId, createdAt});

    const cloudSave = await CloudSave.getCloudSave(userId, gameId, createdAt);
    assertExist({cloudSave});
    assertCondition(!!cloudSave.expireAt, "Upload cloud save already completed");

    const fileUploaded = await CloudSave.isCloudSaveFileUploaded(cloudSave.cloudStoragePath);
    assertCondition(fileUploaded, "Cloud save file not uploaded", {cloudStoragePath: cloudSave.cloudStoragePath});

    delete cloudSave.expireAt;

    await CloudSave.putCloudSave(userId, gameId, cloudSave);
    return cloudSave;
}

interface RequestDownloadCloudSaveData extends EventData {
    gameId: string,
    createdAt: number,
}

async function requestDownloadCloudSave(data: RequestDownloadCloudSaveData, claims: EventClaims): Promise<string> {
    const {userId} = claims;
    const {gameId, createdAt} = data;
    assertDefined({gameId, createdAt});

    const cloudSave = await CloudSave.getCloudSave(userId, gameId, createdAt);
    assertExist({cloudSave});

    return CloudSave.getDownloadCloudSaveFileUrl(cloudSave.cloudStoragePath);
}