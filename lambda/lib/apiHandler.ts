import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2} from "aws-lambda";
import {APIGatewayProxyEventV2} from "aws-lambda/trigger/api-gateway-proxy";

export type EventData = Record<string, any> | undefined;
export interface EventClaims {
    userId: string,
}
export type EventHandler = (data: EventData, claims: EventClaims) => Promise<any>;

export class ApiHandler {
    private readonly handlers: Record<string, EventHandler>;

    constructor(handlers: Record<string, EventHandler>) {
        this.handlers = handlers;
    }

    async handle(event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
        try {
            const path = event.rawPath.substring(event.rawPath.lastIndexOf("/") + 1);
            const handler = this.handlers[path];
            if (!handler) {
                throw "HANDLER_NOT_FOUND";
            }

            const data: EventData = event.body ? JSON.parse(event.body) : undefined;
            const jwtEvent = event as APIGatewayProxyEventV2WithJWTAuthorizer;
            const claims: EventClaims = jwtEvent.requestContext.authorizer ? ApiHandler.toEventClaims(jwtEvent.requestContext.authorizer.jwt.claims) : undefined;
            const result = await handler(data, claims);
            return ApiHandler.createResponse(200, result);
        }
        catch (error) {
            console.error(typeof error === "object" ? JSON.stringify(error) : error);
            console.error(`Error occurred in event: ${JSON.stringify(event)}`);
            return ApiHandler.createResponse(500, error);
        }
    }

    private static toEventClaims(jwtAuthorizerClaims: Record<string, any>): EventClaims {
        return {userId: jwtAuthorizerClaims.sub};
    }

    private static createResponse(statusCode: number, body: any): APIGatewayProxyResultV2 {
        return {
            statusCode,
            body: (typeof body === "object") ? JSON.stringify(body) : body.toString(),
        };
    }
}