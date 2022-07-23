import {APIGatewayProxyHandlerV2} from "aws-lambda";
import * as Cognito from "../../aws-lib/cognito/cognito-lib";
import {ApiHandler, EventClaims, EventData, EventHandler} from "../../lib/apiHandler";
import {assertDefined} from "../../lib/assert-lib";

const handlers: Record<string, EventHandler> = Object.freeze({
    changePassword,
});

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    return ApiHandler.handle(event, context, handlers);
}

interface ChangePasswordData extends EventData {
    oldPassword: string,
    newPassword: string,
}

async function changePassword(data: ChangePasswordData, claims: EventClaims): Promise<void> {
    const {accessToken} = claims;
    const {oldPassword, newPassword} = data;
    assertDefined({oldPassword, newPassword});

    await Cognito.changePassword(accessToken, oldPassword, newPassword);
}