import * as Crypto from 'expo-crypto';
import { generateTemporaryPassword } from '@/utils/generatePassword';

/** @returns a function that makes a new first-time password with the device's secure random source. */
export function useGeneratePassword(): () => string {
  return () => generateTemporaryPassword(Crypto.getRandomBytes);
}
