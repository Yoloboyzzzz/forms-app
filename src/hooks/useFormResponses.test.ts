import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFormResponses, useResponseDetail } from '@/hooks/useFormResponses';
import { ServiceError } from '@/services/errors';
import { getFormResponses, getResponseDetail } from '@/services/responseService';
import { makeDetail } from '@/testUtils/factories';
import type { FormResponses, ResponseDetail } from '@/types/models';

jest.mock('@/services/responseService', () => ({ getFormResponses: jest.fn(), getResponseDetail: jest.fn() }));

const responses: FormResponses = { detail: makeDetail(), rows: [], answers: [] };

beforeEach(() => jest.resetAllMocks());

describe('useFormResponses', () => {
  it('loads the responses of a form', async () => {
    jest.mocked(getFormResponses).mockResolvedValue(responses);
    const { result } = renderHook(() => useFormResponses('f1'));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.data).toBe(responses));

    expect(getFormResponses).toHaveBeenCalledWith('f1');
    expect(result.current).toMatchObject({ isLoading: false, errorKey: undefined });
  });

  it('shows the error and reloads on request', async () => {
    jest.mocked(getFormResponses).mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce(responses);
    const { result } = renderHook(() => useFormResponses('f1'));
    await waitFor(() => expect(result.current.errorKey).toBe('errors.network'));
    expect(result.current.data).toBeUndefined();

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toBe(responses));
    expect(result.current.errorKey).toBeUndefined();
  });

  it('loads again for another form', async () => {
    jest.mocked(getFormResponses).mockResolvedValue(responses);
    const { rerender } = renderHook(({ id }: { id: string }) => useFormResponses(id), { initialProps: { id: 'f1' } });
    await waitFor(() => expect(getFormResponses).toHaveBeenCalledWith('f1'));

    rerender({ id: 'f2' });

    await waitFor(() => expect(getFormResponses).toHaveBeenCalledWith('f2'));
  });

  it('ignores a result that arrives after leaving the screen', async () => {
    let finish: (value: FormResponses) => void = () => undefined;
    jest.mocked(getFormResponses).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result, unmount } = renderHook(() => useFormResponses('f1'));
    unmount();
    await act(async () => finish(responses));
    expect(result.current.data).toBeUndefined();
  });

  it('ignores an error that arrives after leaving the screen', async () => {
    let fail: (error: Error) => void = () => undefined;
    jest.mocked(getFormResponses).mockReturnValue(new Promise((_, reject) => (fail = reject)));
    const { result, unmount } = renderHook(() => useFormResponses('f1'));
    unmount();
    await act(async () => fail(new Error('late')));
    expect(result.current.errorKey).toBeUndefined();
  });
});

describe('useResponseDetail', () => {
  it('loads one response', async () => {
    const detail = { detail: makeDetail(), answers: {} } as unknown as ResponseDetail; // only identity is checked
    jest.mocked(getResponseDetail).mockResolvedValue(detail);
    const { result } = renderHook(() => useResponseDetail('s1'));

    await waitFor(() => expect(result.current.data).toBe(detail));

    expect(getResponseDetail).toHaveBeenCalledWith('s1');
  });

  it('shows a missing response', async () => {
    jest.mocked(getResponseDetail).mockRejectedValue(new ServiceError('notFound'));
    const { result } = renderHook(() => useResponseDetail('nope'));
    await waitFor(() => expect(result.current.errorKey).toBe('errors.notFound'));
  });
});
