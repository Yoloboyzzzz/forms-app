import { generateTemporaryPassword } from './generatePassword';

function seeded(seed: number): (count: number) => Uint8Array {
  let state = seed;
  return (count) =>
    Uint8Array.from({ length: count }, () => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state % 256;
    });
}

describe('generateTemporaryPassword', () => {
  it('has the requested length', () => {
    expect(generateTemporaryPassword(seeded(1), 16)).toHaveLength(16);
    expect(generateTemporaryPassword(seeded(1))).toHaveLength(12);
  });

  it('never goes below the minimum password length', () => {
    expect(generateTemporaryPassword(seeded(1), 3)).toHaveLength(8);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])('contains a lowercase letter, an uppercase letter and a digit (seed %i)', (seed) => {
    const password = generateTemporaryPassword(seeded(seed));
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
  });

  it('avoids look-alike characters', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      expect(generateTemporaryPassword(seeded(seed), 20)).not.toMatch(/[01OIl]/);
    }
  });

  it('differs between random sources', () => {
    expect(generateTemporaryPassword(seeded(1))).not.toBe(generateTemporaryPassword(seeded(2)));
  });

  it('skips random bytes that would bias the result', () => {
    // 255 is above the rejection limit for every alphabet, so it must be skipped.
    const bytes = Uint8Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? 255 : i));
    expect(generateTemporaryPassword(() => bytes, 8)).toHaveLength(8);
  });

  it('fails clearly when the random source only returns rejected bytes', () => {
    expect(() => generateTemporaryPassword((count) => new Uint8Array(count).fill(255))).toThrow('Not enough random bytes');
  });
});
