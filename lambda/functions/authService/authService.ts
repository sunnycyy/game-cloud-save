import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from "aws-lambda";
import {ApiHandler, EventData} from "../../lib/apiHandler";
import * as Cognito from "../../aws/cognito/cognito";
import {AuthResult} from "../../aws/cognito/cognito";

const handlers = Object.freeze({
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
    const clientId = process.env.UserPoolClientId;
    return Cognito.usernamePasswordAuth(clientId, username, password);
}