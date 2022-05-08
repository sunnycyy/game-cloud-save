export abstract class ServerException extends Error {
    data: Record<string, any>;

    protected constructor(name: string, message: string, data?: Record<string, any>) {
        super(message);
        this.name = name;
        this.data = data || {};
    }
}