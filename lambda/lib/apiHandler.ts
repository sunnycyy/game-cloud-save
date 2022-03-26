import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2} from "aws-lambda";

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

    async handle(event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
        try {
            const path = event.rawPath.substring(event.rawPath.lastIndexOf("/") + 1);
            const handler = this.handlers[path];
            if (!handler) {
                throw "HANDLER_NOT_FOUND";
            }

            const data: EventData = event.body ? JSON.parse(event.body) : undefined;
            const claims: EventClaims = ApiHandler.toEventClaims(event.requestContext.authorizer.jwt.claims);
            const result = await handler(data, claims);
            return ApiHandler.createResponse(200, result);
        }
        catch (err) {
            console.error(`Error occurred in event: error=${err}, event=${JSON.stringify(event)}`);
            return ApiHandler.createResponse(500, err);
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