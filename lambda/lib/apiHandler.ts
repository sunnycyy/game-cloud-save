import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2, Context} from "aws-lambda";
import {APIGatewayProxyEventV2} from "aws-lambda/trigger/api-gateway-proxy";
import {ServerException} from "./exception-lib";

export type EventData = Record<string, any> | undefined;
export interface EventClaims {
    userId: string,
    accessToken: string,
}
export type EventHandler = (data: EventData, claims: EventClaims) => Promise<any>;

class EventHandlerNotFoundException extends ServerException {
    constructor(eventPath) {
        super("EventHandlerNotFoundException", `Handler not found: ${eventPath}`, {eventPath});
    }
}

export const ApiHandler = Object.freeze({
    handle: async (event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer, context: Context, handlers: Record<string, EventHandler>) => {
        try {
            const path = getEventPath(event);
            const handler = handlers[path];
            if (!handler) {
                throw new EventHandlerNotFoundException(event.rawPath);
            }

            const data = getEventData(event);
            const claims = getEventClaims(event as APIGatewayProxyEventV2WithJWTAuthorizer);
            const result = await handler(data, claims);
            return success(result);
        }
        catch (error) {
            console.error(error);
            console.error(`Error occurred when processing event: ${JSON.stringify(event)}`);
            return failure(error);
        }
    }
});

function getEventPath(event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer): string {
    return event.rawPath.substring(event.rawPath.lastIndexOf("/") + 1);
}

function getEventData(event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer): EventData {
    if (event.body) {
        return JSON.parse(event.body);
    }
}

function getEventClaims(event: APIGatewayProxyEventV2WithJWTAuthorizer): EventClaims {
    if (event.requestContext.authorizer) {
        return {
            userId: event.requestContext.authorizer.jwt.claims.sub as string,
            accessToken: event.headers.authorization,
        };
    }
}

function createResponse(statusCode: number, body: any): APIGatewayProxyResultV2 {
    const response: APIGatewayProxyResultV2 = {statusCode};
    if (body !== undefined) {
        response.body = (typeof body === "object") ? JSON.stringify(body) : body.toString();
    }
    return response;
}

export function success(body): APIGatewayProxyResultV2 {
    return createResponse(200, body);
}

interface EventError {
    type: string,
    message: string,
    data?: Record<string, any>,
}

function isServiceException(error) {
    return !!error.$fault;
}

export function failure(error): APIGatewayProxyResultV2 {
    let eventError: EventError;
    if (error instanceof ServerException) {
        eventError = {
            type: error.name,
            message: error.stack,
            data: error.data,
        };
    }
    else if (isServiceException(error)) {
        eventError = {
            type: error.name,
            message: error.stack,
            data: error,
        };
    }
    else {
        eventError = {
            type: "RuntimeException",
            message: error.stack,
        };
    }
    return createResponse(500, eventError);
}