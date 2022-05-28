import {
    AuthFlowType,
    CognitoIdentityProviderClient, ConfirmSignUpCommand, ConfirmSignUpCommandInput,
    InitiateAuthCommand,
    InitiateAuthCommandInput, SignUpCommand, SignUpCommandInput
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export interface AuthResult {
    accessToken: string,
    expireAt: number,
}

export async function registerUser(clientId: string, username: string, password: string): Promise<void> {
    const params: SignUpCommandInput = {
        ClientId: clientId,
        Username: username,
        Password: password,
    };
    await client.send(new SignUpCommand(params));
}

export async function confirmUserRegistration(clientId: string, username: string, confirmationCode: string): Promise<void> {
    const params: ConfirmSignUpCommandInput = {
        ClientId: clientId,
        Username: username,
        ConfirmationCode: confirmationCode,
    };
    await client.send(new ConfirmSignUpCommand(params));
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