import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2} from "aws-lambda";

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> {
    return {
        statusCode: 500,
        body: "DUMMY_FUNCTION_ONLY",
    };
}