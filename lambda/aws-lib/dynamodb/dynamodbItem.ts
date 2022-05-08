export interface DynamoDBItem extends DynamoDBKey {
    createdAt?: number,
    updatedAt?: number,
    expireAt?: number,
    expireAt_TTL?: number,
}

export type DynamoDBKey = Record<string, NonNullable<any>>;