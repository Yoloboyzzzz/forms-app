import * as Crypto from 'expo-crypto';

/** @returns a function that makes a new stable id (uuid) for options, rows and columns. */
export function useNewId(): () => string {
  return () => Crypto.randomUUID();
}
