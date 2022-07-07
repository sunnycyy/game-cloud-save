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
### User Management
#### User Registration
1. Send a **POST** request to `/authService/registerUser` with the following payload to register new user:

```json
{
  "username": "<Email address>",
  "password": "<Password>"
}
```

`password` must be at least 8 characters in length, and include at least an upper-case character, a lower-case character and a number by default.
Please update the password requirement in `PasswordPolicy` in [cognito/serverless.yml](cognito/serverless.yml) if necessary.

A response with status **200** and empty body will be received if user registration is successful, and a verification email with a confirmation code will be sent to the registered email address.

2. Send a **POST** request to `/authService/confirmUserRegistration` with the following payload to confirm the user registration by using the confirmation code received in previous step:

```json
{
  "username": "<Email address>",
  "confirmationCode": "<Confirmation code>"
}
```

A response with status **200** will be received if user registration is successfully confirmed.

#### User Authentication
Send a **POST** request to `/authService/userAuth` with the following payload to login and retrieve access token for the `Authorization` header of all other requests:

```json
{
  "username": "<Email address>",
  "password": "<Password>"
}
```

The following is the response body:

```json
{
  "accessToken": "<Java Web Token (JWT)>",
  "expireAt": 1234567890123
}
```

*`expireAt` is access token expiry time in Unix timestamp.

### Game Management
#### Get All Games
Send a **POST** request to `/gameService/getAllGames` to retrieve all added games.  
A list of game records will be returned.

#### Add Game
Send a **POST** request to `/gameService/addGame` with the following payload to add a new game:

```json
{
  "gameName": "<Game name>"
}
```

A new game record with the following format will be returned:

```json
{
  "gameId": "<Game ID>",
  "name": "<Game name>"
}
```

#### Update Game
Send a **POST** request to `/gameService/updateGame` with the following payload to update game details:

```json
{
  "gameId": "<Game ID>",
  "name": "<New game name>"
}
```

A updated game record will be returned;

### Cloud Save Management
#### Get All Cloud Saves
Send a **POST** request to `/cloudSaveService/getAllCloudSaves` with the following payload to retrieve all cloud saves of specific game:

```json
{
  "gameId": "<Game ID>"
}
```

A list of cloud save records will be returned.

#### Upload Cloud Save
1. Send a **POST** request to `/cloudSaveService/requestUploadCloudSave` with the following payload to request a upload URL for uploading a zip file containing all game save related files.

```json
{
  "gameId": "<Game ID>",
  "platform": 0,
  "version": "<Game version>",
  "saveFiles": [
    {
      "root": 0,
      "filePath": "<Path to save file from save file root>"
    }
  ]
}
```

The followings are the available `platform` values:

| Platform | Value |
|----------|:-----:|
| Windows  |   0   |
| Mac      |   1   |

The following are the available `root` values:

| Save File Root                      | Value |
|-------------------------------------|:-----:|
| Game Install Path                   |   0   |
| User Documents                      |   1   |
| App Data Local (_Windows only_)     |   2   |
| App Data Local Low (_Windows only_) |   3   |
| App Data Roaming (_Windows only_)   |   4   |

A new cloud save record and upload URL will be returned with the following body format:

```json
{
  "cloudSave": {
    "gameId": "<Game ID>",
    "platform": 0,
    "version": "<Game version>",
    "saveFile": [
      {
        "root": 0,
        "filePath": "<Path to save file from save file root>"
      }
    ],
    "cloudStoragePath": "<Path to uploaded zip file in S3>",
    "createdAt": 1234567890123
  },
  "uploadUrl": "<Upload URL>"
}
```

*`createdAt` is cloud save record creation time in Unix timestamp.

2. Send a **PUT** request to the upload URL retrieved in previous step with the zip file containing all game save related files as payload to upload cloud save.  
The upload URL will be available for 1 minute by default.


3. Send a **POST** request to `/cloudSaveService/completeUploadCloudSave` with the following payload to inform the completion of uploading cloud save:

```json
{
  "gameId": "<Game ID>",
  "createdAt": 1234567890123
}
```

*`createdAt` is cloud save record creation time in Unix timestamp.

The updated cloud save record will be returned.

#### Download Cloud Save
1. Send a **POST** request to `/cloudSaveService/requestDownloadCloudSave` retrieve a download URL for downloading the cloud save zip file.

```json
{
  "gameId": "<Game ID>",
  "createdAt": 1234567890123
}
```

*`createdAt` is cloud save record creation time in Unix timestamp.

A download URL will be returned.

2. Send a **GET** request to the download URL retrieved in previous step to download cloud save.  
The download URL will be available for 5 minutes by default.