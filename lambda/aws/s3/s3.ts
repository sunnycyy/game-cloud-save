import {
    GetObjectCommand,
    GetObjectCommandInput, HeadObjectCommand, HeadObjectCommandInput,
    PutObjectCommand,
    PutObjectCommandInput,
    S3Client
} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const client = new S3Client({});

export async function isFileExists(bucketName: string, path: string): Promise<boolean> {
    try {
        const params: HeadObjectCommandInput = {
            Bucket: bucketName,
            Key: path,
        };
        const response = await client.send(new HeadObjectCommand(params));
        console.log(JSON.stringify(response));
        return true;
    }
    catch (error) {
        console.error(JSON.stringify(error));
        return false;
    }
}

export async function getUploadFilePresignedUrl(bucketName: string, path: string, expireInSecond: number): Promise<string> {
    const params: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: path,
    };
    return getSignedUrl(client, new PutObjectCommand(params), {expiresIn: expireInSecond});
}

export async function getDownloadFilePresignedUrl(bucketName: string, path: string, expireInSecond: number): Promise<string> {
    const params: GetObjectCommandInput = {
        Bucket: bucketName,
        Key: path,
    };
    return getSignedUrl(client, new GetObjectCommand(params), {expiresIn: expireInSecond});
}