import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { useTheme } from '@/hooks/useTheme';

describe('useTheme', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the dark theme when the system scheme is dark', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    expect(renderHook(() => useTheme()).result.current.isDark).toBe(true);
  });

  it('returns the light theme otherwise', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    expect(renderHook(() => useTheme()).result.current.isDark).toBe(false);
  });
});
