import { required } from '@/config/required';

describe('required', () => {
  it('returns the value when it is set', () => {
    expect(required('EXPO_PUBLIC_X', 'value')).toBe('value');
  });

  it('throws a clear error naming the variable when undefined', () => {
    expect(() => required('EXPO_PUBLIC_X', undefined)).toThrow('Missing environment variable EXPO_PUBLIC_X');
  });

  it('throws when the value is empty', () => {
    expect(() => required('EXPO_PUBLIC_X', '')).toThrow('Missing environment variable EXPO_PUBLIC_X');
  });
});
