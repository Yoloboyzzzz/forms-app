/** Use in the `default` branch of a switch to make it exhaustive at compile time. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
