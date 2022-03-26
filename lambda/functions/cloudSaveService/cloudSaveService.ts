import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2} from "aws-lambda";
import {ApiHandler, EventClaims, EventData} from "../../lib/apiHandler";
import * as CloudSave from "../../lib/cloudSave-lib";
import {CloudSaveRecord, SavePathRootType, SavePathType} from "../../lib/cloudSave-lib";
import {assertDefined} from "../../lib/assert-lib";

const handlers = Object.freeze({
    getAllCloudSaves,
    recordCloudSave,
});

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
    return new ApiHandler(handlers).handle(event);
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

interface RecordCloudSaveData extends EventData {
    gameId: string,
    platform: string,
    version: string,
    savePathType: SavePathType,
    savePathRootType: SavePathRootType,
    savePath: string,
    saveS3Path: string,
}

async function recordCloudSave(data: RecordCloudSaveData, claims: EventClaims): Promise<CloudSaveRecord> {
    const {userId} = claims;
    const {gameId, platform, version, savePathType, savePathRootType, savePath, saveS3Path} = data;
    assertDefined({gameId, platform, version, savePathType, savePathRootType, savePath, saveS3Path});

    const cloudSave: CloudSaveRecord = {
        platform,
        version,
        savePathType,
        savePathRootType,
        savePath,
        saveS3Path
    };

    await CloudSave.putCloudSave(userId, gameId, cloudSave);
    return cloudSave;
}
