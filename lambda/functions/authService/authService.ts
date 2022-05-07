import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from "aws-lambda";
import * as Cognito from "../../aws/cognito/cognito";
import {AuthResult} from "../../aws/cognito/cognito";
import {ApiHandler, EventData} from "../../lib/apiHandler";
import {assertDefined} from "../../lib/assert-lib";

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
    assertDefined({username, password});

    return Cognito.usernamePasswordAuth(process.env.UserPoolClientId, username, password);
}