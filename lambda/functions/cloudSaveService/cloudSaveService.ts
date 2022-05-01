import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2} from "aws-lambda";
import {ApiHandler, EventClaims, EventData} from "../../lib/apiHandler";
import * as CloudSave from "../../lib/cloudSave-lib";
import {CloudSaveFile, CloudSaveRecord} from "../../lib/cloudSave-lib";
import {assertDefined, assertNotEmpty} from "../../lib/assert-lib";
import {Platform} from "../../lib/platform-lib";

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
    platform: Platform,
    version: string,
    saveFiles: CloudSaveFile[],
    saveS3Path: string,
}

async function recordCloudSave(data: RecordCloudSaveData, claims: EventClaims): Promise<CloudSaveRecord> {
    const {userId} = claims;
    const {gameId, platform, version, saveFiles, saveS3Path} = data;
    assertDefined({gameId, platform, version, saveFiles, saveS3Path});
    assertNotEmpty({saveFiles});

    verifyCloudSaveFiles(platform, saveFiles);

    const cloudSave: CloudSaveRecord = {
        platform,
        version,
        saveFiles,
        saveS3Path,
    };

    await CloudSave.putCloudSave(userId, gameId, cloudSave);
    return cloudSave;
}

function verifyCloudSaveFiles(platform: Platform, saveFiles: CloudSaveFile[]): void {
    for (const saveFile of saveFiles) {
        if (!CloudSave.isRootTypeAvailableOnPlatform(saveFile.root, platform)) {
            throw `INVALID_SAVE_FILE_ROOT: ${saveFile.filePath}`;
        }
    }
}