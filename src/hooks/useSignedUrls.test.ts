import { renderHook, waitFor } from '@testing-library/react-native';
import { useSignedUrls } from '@/hooks/useSignedUrls';
import { getSignedUrls } from '@/services/storageService';

jest.mock('@/services/storageService', () => ({ getSignedUrls: jest.fn() }));

beforeEach(() => jest.resetAllMocks());

describe('useSignedUrls', () => {
  it('fetches links for the paths in one request', async () => {
    jest.mocked(getSignedUrls).mockResolvedValue({ b: 'https://x/b', a: 'https://x/a' });
    const { result } = renderHook(() => useSignedUrls('form-media', ['b', 'a']));

    await waitFor(() => expect(result.current).toEqual({ a: 'https://x/a', b: 'https://x/b' }));

    expect(getSignedUrls).toHaveBeenCalledTimes(1);
    expect(getSignedUrls).toHaveBeenCalledWith('form-media', ['a', 'b']);
  });

  it('does not ask again when the same paths come in another order', async () => {
    jest.mocked(getSignedUrls).mockResolvedValue({});
    const { rerender } = renderHook(({ paths }: { paths: string[] }) => useSignedUrls('form-media', paths), {
      initialProps: { paths: ['a', 'b'] },
    });
    await waitFor(() => expect(getSignedUrls).toHaveBeenCalledTimes(1));

    rerender({ paths: ['b', 'a'] });

    expect(getSignedUrls).toHaveBeenCalledTimes(1);
  });

  it('asks again for new paths', async () => {
    jest.mocked(getSignedUrls).mockResolvedValue({});
    const { rerender } = renderHook(({ paths }: { paths: string[] }) => useSignedUrls('form-media', paths), {
      initialProps: { paths: ['a'] },
    });
    await waitFor(() => expect(getSignedUrls).toHaveBeenCalledTimes(1));

    rerender({ paths: ['a', 'c'] });

    await waitFor(() => expect(getSignedUrls).toHaveBeenCalledTimes(2));
  });

  it('does nothing without paths and clears links when the paths go away', async () => {
    jest.mocked(getSignedUrls).mockResolvedValue({ a: 'https://x/a' });
    const { result, rerender } = renderHook(({ paths }: { paths: string[] }) => useSignedUrls('form-media', paths), {
      initialProps: { paths: ['a'] },
    });
    await waitFor(() => expect(result.current).toEqual({ a: 'https://x/a' }));

    rerender({ paths: [] });

    await waitFor(() => expect(result.current).toEqual({}));
  });

  it('shows no links when fetching fails', async () => {
    jest.mocked(getSignedUrls).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useSignedUrls('form-media', ['a']));
    await waitFor(() => expect(getSignedUrls).toHaveBeenCalled());
    expect(result.current).toEqual({});
  });

  it('ignores a result that arrives after the paths changed or the screen closed', async () => {
    let finish: (value: Record<string, string>) => void = () => undefined;
    jest.mocked(getSignedUrls).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result, unmount } = renderHook(() => useSignedUrls('form-media', ['a']));
    unmount();
    finish({ a: 'https://x/a' });
    await Promise.resolve();
    expect(result.current).toEqual({});
  });
});
