/**
 * Safely converts any BigInt instances into strings throughout nested objects/arrays
 */
export function serializeBigInts<T>(data: T): any {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}
