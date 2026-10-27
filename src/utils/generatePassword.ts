import { MIN_PASSWORD_LENGTH } from '@/constants/auth';

// No look-alike characters (0/O, 1/l/I) because admins read these passwords out or type them over.
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALL = LOWER + UPPER + DIGITS;

/**
 * Builds a first-time password with at least one lowercase letter, one uppercase letter and one digit.
 * `randomBytes` is injected (expo-crypto in the app) to keep this function pure and testable.
 */
export function generateTemporaryPassword(randomBytes: (count: number) => Uint8Array, length = 12): string {
  const size = Math.max(length, MIN_PASSWORD_LENGTH);
  const bytes = randomBytes(size * 2);
  let next = 0;

  // Rejection sampling keeps every character equally likely (256 is not a multiple of the alphabet size).
  function pick(alphabet: string): string {
    const limit = 256 - (256 % alphabet.length);
    while (next < bytes.length && bytes[next] >= limit) next += 1;
    if (next >= bytes.length) {
      throw new Error('Not enough random bytes');
    }
    const character = alphabet[bytes[next] % alphabet.length];
    next += 1;
    return character;
  }

  const characters = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  while (characters.length < size) {
    characters.push(pick(ALL));
  }
  // Fisher-Yates with the same byte source, so the three required characters are not always first.
  for (let i = characters.length - 1; i > 0; i -= 1) {
    const j = bytes[characters.length * 2 - 1 - i] % (i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }
  return characters.join('');
}
