import { renderHook } from '@testing-library/react-native';
import { useGeneratePassword } from '@/hooks/useGeneratePassword';

jest.mock('expo-crypto', () => ({
  getRandomBytes: (count: number) => Uint8Array.from({ length: count }, (_, i) => (i * 37 + 11) % 251),
}));

describe('useGeneratePassword', () => {
  it('generates a valid first-time password from the secure random source', () => {
    const generate = renderHook(() => useGeneratePassword()).result.current;
    const password = generate();
    expect(password).toHaveLength(12);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
  });
});
