# Game Cloud Save
This repository is a simple serverless backend for managing game save files.
It is implemented using [Amazon Web Service (AWS)](https://aws.amazon.com/) and [Serverless Framework](https://www.serverless.com/framework).
All cloud scripts are written in [TypeScript](https://www.typescriptlang.org/).

The followings are the AWS services used for this project:
- [Lambda](https://aws.amazon.com/lambda/)
- [DynamoDB](https://aws.amazon.com/dynamodb/)
- [S3](https://aws.amazon.com/s3/)
- [Cognito](https://aws.amazon.com/cognito/)
- [API Gateway](https://aws.amazon.com/api-gateway/)
- [CloudFormation](https://aws.amazon.com/cloudformation/)

## Deployment Instructions
### Prerequisite
1. Install the followings:

| Software / Framework                                            | Version |
|-----------------------------------------------------------------|:-------:|
| [Node.js](https://nodejs.org/)                                  |  16.x   |
| [AWS Command Line Interface (CLI)](https://aws.amazon.com/cli/) |   2.x   |

2. Setup an AWS profile for deployment through AWS CLI.

```shell
aws configure --profile gameCloudSave
```

3. Run the following commands to install all required packages from project root:

```shell
npm install

cd apigateway
npm install

cd ../lambda
npm install
```

### Steps
Run the following commands to deploy all resources to AWS from project root.  
All resources will be deployed to `us-east-1` and `dev` stage by default.
If you wish to deploy to different region, please change `region` to target region in [config.yml](config.yml).
If you wish to deploy to different stage, please add the target stage to `stages` in [config.yml](config.yml), and add `--stage <Target stage>` option after `serverless deploy`.

```shell
cd s3
serverless deploy

cd ../dynamodb
serverless deploy

cd ../cognito
serverless deploy

cd ../apigateway
serverless deploy

cd ../lambda
serverless deploy
```

## Usage
- [Authentication Management](#authentication-management)
  - [User Registration](#user-registration)
  - [User Authentication](#user-authentication)
  - [Reset Password](#reset-password)
- [User Management](#user-management)
  - [Change Password](#change-password)
- [Game Management](#game-management)
  - [Get All Games](#get-all-games)
  - [Add Game](#add-game)
  - [Update Game](#update-game)
- [Cloud Save Management](#cloud-save-management)
  - [Get All Cloud Saves](#get-all-cloud-saves)
  - [Upload Cloud Save](#upload-cloud-save)
  - [Download Cloud Save](#download-cloud-save)

### Authentication Management
#### User Registration
##### Step 1
Send a **POST** request to `/authService/registerUser` with the following payload in JSON to register new user:

| Field Name | Type   | Description                               |
|------------|--------|-------------------------------------------|
| `username` | string | Email address                             |
| `password` | string | [Password](#password-default-requirement) |

###### Password Default Requirement
- At least 8 characters in length
- Include at least an upper-case character
- Include at least a lower-case character
- Include at least a number

Please update the password requirement in `PasswordPolicy` in [cognito/serverless.yml](cognito/serverless.yml) if necessary.

A response with status **200** will be received if user registration is successful, and a verification email with a confirmation code will be sent to the registered email address.

##### Step 2
Send a **POST** request to `/authService/confirmUserRegistration` with the following payload in JSON to confirm the user registration by using the confirmation code received in previous step:

| Field Name         | Type   | Description                |
|--------------------|--------|----------------------------|
| `username`         | string | Email address              |
| `confirmationCode` | string | Confirmation code received |

A response with status **200** will be received if user registration is successfully confirmed.

#### User Authentication
Send a **POST** request to `/authService/userAuth` with the following payload in JSON to login and retrieve access token for the `Authorization` header of all other requests:

| Field Name | Type   | Description                               |
|------------|--------|-------------------------------------------|
| `username` | string | Email address                             |
| `password` | string | [Password](#password-default-requirement) |

The following body in JSON will be returned if login is successful:

| Field Name    | Type   | Description                               |
|---------------|--------|-------------------------------------------|
| `accessToken` | string | Java Web Token (JWT) generated by Cognito |
| `expireAt`    | number | Expiry time in UNIX timestamp             |

#### Reset Password
##### Step 1
Send a **POST** request to `/authService/resetPassword` with the following payload in JSON to request password reset:

| Field Name | Type   | Description   |
|------------|--------|---------------|
| `username` | string | Email address |

A response with status **200** will be received if password reset request is successful, and a verification email with a confirmation code will be sent to the email address.

##### Step 2
Send a **POST** request to `/authService/confirmPasswordReset` with the following payload in JSON to confirm the password reset by using the confirmation code received in previous step:

| Field Name         | Type   | Description                                   |
|--------------------|--------|-----------------------------------------------|
| `username`         | string | Email address                                 |
| `password`         | string | New [password](#password-default-requirement) |
| `confirmationCode` | string | Confirmation code received                    |

A response with status **200** will be received if password reset is successfully confirmed.

### User Management
_For all following requests, the `accessToken` received from [user authentication](#user-authentication) must be provided in the `Authorization` header of the request._

#### Change Password
Send a **POST** request to `/userService/changePassword` with the following payload in JSON to change password:

| Field Name         | Type   | Description                                   |
|--------------------|--------|-----------------------------------------------|
| `oldPassword`      | string | Old [password](#password-default-requirement) |
| `newPassword`      | string | New [password](#password-default-requirement) |

A response with status **200** will be received if changing password is successful.

### Game Management
_For all following requests, the `accessToken` received from [user authentication](#user-authentication) must be provided in the `Authorization` header of the request._

#### Get All Games
Send a **POST** request to `/gameService/getAllGames` to retrieve all added games.

An array of [game records](#game-record-format) will be returned.

##### Game Record Format

| Field Name | Type   | Description               |
|------------|--------|---------------------------|
| `gameId`   | string | Unique identifier of game |
| `name`     | string | Game name                 |

#### Add Game
Send a **POST** request to `/gameService/addGame` with the following payload in JSON to add a new game:

| Field Name | Type   | Description |
|------------|--------|-------------|
| `gameName` | string | Game name   |

A new [game record](#game-record-format) will be returned:

#### Update Game
Send a **POST** request to `/gameService/updateGame` with the following payload in JSON to update game details:

| Field Name | Type   | Description               |
|------------|--------|---------------------------|
| `gameId`   | string | Unique identifier of game |
| `name`     | string | New game name             |

A updated [game record](#game-record-format) will be returned.

### Cloud Save Management
_For all following requests, the `accessToken` received from [user authentication](#user-authentication) must be provided in the `Authorization` header of the request._

#### Get All Cloud Saves
Send a **POST** request to `/cloudSaveService/getAllCloudSaves` with the following payload in JSON to retrieve all cloud saves of specific game:

| Field Name | Type   | Description               |
|------------|--------|---------------------------|
| `gameId`   | string | Unique identifier of game |

An array of [cloud save records](#cloud-save-record-format) will be returned.

##### Cloud Save Record Format

| Field Name         | Type   | Description                                            |
|--------------------|--------|--------------------------------------------------------|
| `gameId`           | string | Unique identifier of game                              |
| `platform`         | number | [Platform index](#platform-index-values)               |
| `version`          | string | Game version                                           |
| `saveFiles`        | Array  | Array of [save file records](#save-file-record-format) |
| `cloudStoragePath` | string | Storage path of cloud save in S3                       |
| `createdAt`        | number | Record creation time in UNIX timestamp                 |

###### Platform Index Values

|  Value  | Platform |
|:-------:|----------|
|    0    | Windows  |
|    1    | Mac      |

###### Save File Record Format

| Field Name | Type   | Description                                   |
|------------|--------|-----------------------------------------------|
| `root`     | number | [Save file root index](#save-file-root-index) |
| `filePath` | string | Save file path from root                      |

###### Save File Root Index

| Value | Save File Root                     | Support Platforms |
|:-----:|------------------------------------|-------------------|
|   0   | Game installation path             | All               |
|   1   | \<User directory>/Documents        | All               |
|   2   | \<User directory>/AppData/Local    | Windows **ONLY**  |
|   3   | \<User directory>/AppData/LocalLow | Windows **ONLY**  |
|   4   | \<User directory>/AppData/Roaming  | Windows **ONLY**  |

#### Upload Cloud Save
##### Step 1
Send a **POST** request to `/cloudSaveService/requestUploadCloudSave` with the following payload in JSON to request a upload URL for uploading a zip file containing all game save related files.

| Field Name         | Type   | Description                                            |
|--------------------|--------|--------------------------------------------------------|
| `gameId`           | string | Unique identifier of game                              |
| `platform`         | number | [Platform index](#platform-index-values)               |
| `version`          | string | Game version                                           |
| `saveFiles`        | Array  | Array of [save file records](#save-file-record-format) |

The following body in JSON will be returned:

| Field Name  | Type   | Description                                        |
|-------------|--------|----------------------------------------------------|
| `cloudSave` | object | New [cloud save record](#cloud-save-record-format) |
| `uploadUrl` | string | URL for uploading save file                        |

##### Step 2
Send a **PUT** request to the `uploadUrl` retrieved in previous step with a zip file containing all game save related files as payload to upload cloud save.  
The `uploadUrl` will be expired in 1 minute by default. Please update `uploadCloudSaveFileUrlExpireInSecond` in [lambda/lib/cloudSave-lib.ts](lambda/lib/cloudSave-lib.ts) to adjust the expiry time if necessary.

##### Step 3
Send a **POST** request to `/cloudSaveService/completeUploadCloudSave` with the following payload in JSON to inform the completion of uploading cloud save:

| Field Name  | Type   | Description                            |
|-------------|--------|----------------------------------------|
| `gameId`    | string | Unique identifier of game              |
| `createdAt` | number | Record creation time in UNIX timestamp |

The updated [cloud save record](#cloud-save-record-format) will be returned.

#### Download Cloud Save
##### Step 1
Send a **POST** request to `/cloudSaveService/requestDownloadCloudSave` with the following payload in JSON to request for a download URL for downloading the cloud save zip file.

| Field Name  | Type   | Description                            |
|-------------|--------|----------------------------------------|
| `gameId`    | string | Unique identifier of game              |
| `createdAt` | number | Record creation time in UNIX timestamp |

A download URL will be returned.

##### Step 2
Send a **GET** request to the download URL retrieved in previous step to download cloud save.  
The download URL will be expired in 5 minutes by default. Please update `downloadCloudSaveFileUrlExpireInSecond` in [lambda/lib/cloudSave-lib.ts](lambda/lib/cloudSave-lib.ts) to adjust the expiry time if necessary. 