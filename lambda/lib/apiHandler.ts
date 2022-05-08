import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2, Context} from "aws-lambda";
import {APIGatewayProxyEventV2} from "aws-lambda/trigger/api-gateway-proxy";

export type EventData = Record<string, any> | undefined;
export interface EventClaims {
    userId: string,
}
export type EventHandler = (data: EventData, claims: EventClaims) => Promise<any>;

export const ApiHandler = Object.freeze({
    handle: async (event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer, context: Context, handlers: Record<string, EventHandler>) => {
        try {
            const path = event.rawPath.substring(event.rawPath.lastIndexOf("/") + 1);
            const handler = handlers[path];
            if (!handler) {
                throw "HANDLER_NOT_FOUND";
            }

            const data: EventData = event.body ? JSON.parse(event.body) : undefined;
            const jwtEvent = event as APIGatewayProxyEventV2WithJWTAuthorizer;
            const claims: EventClaims = jwtEvent.requestContext.authorizer ? toEventClaims(jwtEvent.requestContext.authorizer.jwt.claims) : undefined;
            const result = await handler(data, claims);
            return success(result);
        }
        catch (error) {
            console.error(error);
            console.error(`Error occurred when processing event: ${JSON.stringify(event)}`);
            switch (typeof error) {
                case "object":
                    return !Array.isArray(error) ? exception(error) : badRequest(JSON.stringify(error));
                default:
                    return badRequest(error);
            }
        }
    }
});

function toEventClaims(jwtAuthorizerClaims: Record<string, any>): EventClaims {
    return {userId: jwtAuthorizerClaims.sub};
}

function createResponse(statusCode: number, body: any): APIGatewayProxyResultV2 {
    return {
        statusCode,
        body: (typeof body === "object") ? JSON.stringify(body) : body.toString(),
    };
}

export function success(body): APIGatewayProxyResultV2 {
    return createResponse(200, body);
}

interface EventError {
    error: string,
    message: string,
}

export function failure(error: EventError): APIGatewayProxyResultV2 {
    return createResponse(500, error);
}

type Exception = Error | Record<string, any>;

export function exception(error: Exception): APIGatewayProxyResultV2 {
    const json = JSON.stringify(error);
    let message;
    if (error.stack) {
        message = (Object.keys(error).length > 0) ? `${error.stack}\n${json}` : error.stack;
    }
    else {
        message = json;
    }
    return failure({error: "ServerException", message});
}

export function badRequest(error: Exclude<any, Exception>): APIGatewayProxyResultV2 {
    return failure({error: "ValidationFailedException", message: error.toString()});
}