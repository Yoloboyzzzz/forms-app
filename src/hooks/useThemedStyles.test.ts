import { renderHook } from '@testing-library/react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';

describe('useThemedStyles', () => {
  it('builds styles from the active theme', () => {
    const { result } = renderHook(() => useThemedStyles((theme: Theme) => ({ gap: theme.spacing.md })));
    expect(result.current).toEqual({ gap: 16 });
  });

  it('keeps the same object between renders', () => {
    const create = (theme: Theme) => ({ gap: theme.spacing.sm });
    const { result, rerender } = renderHook(() => useThemedStyles(create));
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });
});
