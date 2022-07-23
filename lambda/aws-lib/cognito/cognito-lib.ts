import {
    AuthFlowType, ChangePasswordCommand, ChangePasswordCommandInput,
    CognitoIdentityProviderClient, ConfirmForgotPasswordCommand, ConfirmForgotPasswordCommandInput,
    ConfirmSignUpCommand,
    ConfirmSignUpCommandInput,
    ForgotPasswordCommand,
    ForgotPasswordCommandInput,
    InitiateAuthCommand,
    InitiateAuthCommandInput,
    SignUpCommand,
    SignUpCommandInput
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

export async function resetPassword(clientId: string, username: string): Promise<void> {
    const params: ForgotPasswordCommandInput = {
        ClientId: clientId,
        Username: username,
    };
    await client.send(new ForgotPasswordCommand(params));
}

export async function confirmPasswordReset(clientId: string, username: string, password: string, confirmationCode: string): Promise<void> {
    const params: ConfirmForgotPasswordCommandInput = {
        ClientId: clientId,
        Username: username,
        Password: password,
        ConfirmationCode: confirmationCode,
    };
    await client.send(new ConfirmForgotPasswordCommand(params));
}

export async function changePassword(accessToken: string, oldPassword: string, newPassword: string): Promise<void> {
    const params: ChangePasswordCommandInput = {
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
    };
    await client.send(new ChangePasswordCommand(params));
}