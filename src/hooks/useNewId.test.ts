import { renderHook } from '@testing-library/react-native';
import { useNewId } from '@/hooks/useNewId';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `uuid-${(counter += 1)}` };
});

describe('useNewId', () => {
  it('makes a different id on every call', () => {
    const newId = renderHook(() => useNewId()).result.current;
    expect(newId()).not.toBe(newId());
  });
});
