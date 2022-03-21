import {getUserRecord, getUserRecords, putUserRecord, UserRecord} from "./userRecord";
import {UserRecordType} from "./userRecordType";

export interface GameRecord extends UserRecord {
    gameId: string,
    name: string,
}

export async function getGames(userId: string): Promise<GameRecord[]> {
    const records = await getUserRecords(userId, UserRecordType.Game);
    return records as GameRecord[];
}

export async function getGame(userId: string, gameId: string): Promise<GameRecord> {
    const record = await getUserRecord(userId, UserRecordType.Game, gameId);
    return record as GameRecord;
}

export async function putGame(userId: string, record: GameRecord): Promise<void> {
    await putUserRecord(userId, UserRecordType.Game, record.gameId, record);
}