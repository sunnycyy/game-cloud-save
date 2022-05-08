import {APIGatewayProxyHandlerV2WithJWTAuthorizer} from "aws-lambda";
import {v4 as uuidv4} from "uuid";
import {ApiHandler, EventClaims, EventData, EventHandler} from "../../lib/apiHandler";
import * as Game from "../../lib/game-lib";
import {assertCondition, assertDefined, assertExist} from "../../lib/assert-lib";
import {GameRecord} from "../../lib/game-lib";

const handlers: Record<string, EventHandler> = Object.freeze({
    getAllGames,
    addGame,
    updateGame,
});

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event, context) => {
    return ApiHandler.handle(event, context, handlers);
}

async function getAllGames(data: EventData, claims: EventClaims): Promise<GameRecord[]> {
    const {userId} = claims;
    return Game.getGames(userId);
}

interface AddGameData extends EventData {
    gameName: string,
}

async function addGame(data: AddGameData, claims: EventClaims): Promise<GameRecord> {
    const {userId} = claims;
    const {gameName} = data;
    assertDefined({gameName});

    const game: GameRecord = {
        gameId: uuidv4(),
        name: gameName,
    }

    await Game.putGame(userId, game);
    return game;
}

interface UpdateGameData extends EventData {
    gameId: string,
    name?: string,
}

async function updateGame(data: UpdateGameData, claims: EventClaims): Promise<GameRecord> {
    const {userId} = claims;
    const {gameId, name} = data;
    assertDefined({gameId});

    const game = await Game.getGame(userId, gameId);
    assertExist({game});

    let updated = false;
    if (name) {
        game.name = name;
        updated = true;
    }

    assertCondition(updated, "Game no update");

    await Game.putGame(userId, game);
    return game;
}