export interface QueryResult {
  data: unknown;
  error: unknown;
  /** Row count, for `select(..., { count: 'exact' })` queries. */
  count?: number | null;
}

export interface RecordedCall {
  method: string;
  args: unknown[];
}

export interface FakeQuery {
  /** Pass to `mockReturnValue` of the mocked `supabase.from`. */
  builder: object;
  calls: RecordedCall[];
  /** Arguments of the first call to `method`, or undefined. */
  argsOf: (method: string) => unknown[] | undefined;
}

/**
 * A stand-in for a Supabase query builder: every chained method returns the builder itself and
 * records its arguments; awaiting it resolves with `result`. For service tests only.
 */
export function fakeQuery(result: QueryResult): FakeQuery {
  const calls: RecordedCall[] = [];
  const handler: ProxyHandler<object> = {
    get(_target, property) {
      if (property === 'then') {
        return (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject);
      }
      return (...args: unknown[]) => {
        calls.push({ method: String(property), args });
        return builder;
      };
    },
  };
  const builder: object = new Proxy({}, handler);
  return { builder, calls, argsOf: (method) => calls.find((call) => call.method === method)?.args };
}
