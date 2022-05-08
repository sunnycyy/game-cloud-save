import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    InitiateAuthCommandInput
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export interface AuthResult {
    accessToken: string,
    expireAt: number,
}

export async function usernamePasswordAuth(clientId: string, username: string, password: string): Promise<AuthResult> {
    const params: InitiateAuthCommandInput = {
        ClientId: clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    };
    const response = await client.send(new InitiateAuthCommand(params));
    return {
        accessToken: response.AuthenticationResult.AccessToken,
        expireAt: Date.now() + (response.AuthenticationResult.ExpiresIn * 1000),
    };
}