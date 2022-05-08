import {APIGatewayProxyHandlerV2} from "aws-lambda";
import * as Cognito from "../../aws-lib/cognito/cognito-lib";
import {AuthResult} from "../../aws-lib/cognito/cognito-lib";
import {ApiHandler, EventData, EventHandler} from "../../lib/apiHandler";
import {assertDefined} from "../../lib/assert-lib";

const handlers: Record<string, EventHandler> = Object.freeze({
    userAuth,
});

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    return ApiHandler.handle(event, context, handlers);
}

interface UserAuthData extends EventData {
    username: string,
    password: string,
}

async function userAuth(data: UserAuthData): Promise<AuthResult> {
    const {username, password} = data;
    assertDefined({username, password});

    return Cognito.usernamePasswordAuth(process.env.UserPoolClientId, username, password);
}