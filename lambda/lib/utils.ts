const keySeparator = "#";

export function genKey(...values: any[]): string {
    return values.join(keySeparator);
}