import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from "aws-lambda";
import * as Cognito from "../../aws-lib/cognito/cognito-lib";
import {AuthResult} from "../../aws-lib/cognito/cognito-lib";
import {ApiHandler, EventData, EventHandler} from "../../lib/apiHandler";
import {assertDefined} from "../../lib/assert-lib";

const handlers: Record<string, EventHandler> = Object.freeze({
    userAuth,
});

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    return new ApiHandler(handlers).handle(event);
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