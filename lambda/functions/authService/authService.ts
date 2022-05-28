import {APIGatewayProxyHandlerV2} from "aws-lambda";
import * as Cognito from "../../aws-lib/cognito/cognito-lib";
import {AuthResult} from "../../aws-lib/cognito/cognito-lib";
import {ApiHandler, EventData, EventHandler} from "../../lib/apiHandler";
import {assertDefined} from "../../lib/assert-lib";

const handlers: Record<string, EventHandler> = Object.freeze({
    registerUser,
    confirmUserRegistration,
    userAuth,
});

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    return ApiHandler.handle(event, context, handlers);
}

interface RegisterUserData extends EventData {
    username: string,
    password: string,
}

async function registerUser(data: RegisterUserData): Promise<void> {
    const {username, password} = data;
    assertDefined({username, password});

    await Cognito.registerUser(process.env.UserPoolClientId, username, password);
}

interface ConfirmUserRegistrationData extends EventData {
    username: string,
    confirmationCode: string,
}

async function confirmUserRegistration(data: ConfirmUserRegistrationData): Promise<void> {
    const {username, confirmationCode} = data;
    assertDefined({username, confirmationCode});

    await Cognito.confirmUserRegistration(process.env.UserPoolClientId, username, confirmationCode);
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