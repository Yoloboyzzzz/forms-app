import { act, renderHook } from '@testing-library/react-native';
import { useCreateForm } from '@/hooks/useCreateForm';
import { ServiceError } from '@/services/errors';
import { makeForm } from '@/testUtils/factories';

const mockForms = { create: jest.fn() };
const mockAuth: { session?: { userId: string } } = { session: { userId: 'u1' } };

jest.mock('@/state/useFormsStore', () => ({
  useFormsStore: (selector: (state: typeof mockForms) => unknown) => selector(mockForms),
}));
jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuth) => unknown) => selector(mockAuth),
}));

beforeEach(() => {
  mockForms.create = jest.fn();
  mockAuth.session = { userId: 'u1' };
});

describe('useCreateForm', () => {
  it('creates a form owned by the signed-in admin', async () => {
    mockForms.create.mockResolvedValue(makeForm({ id: 'new' }));
    const { result } = renderHook(() => useCreateForm());

    let form;
    await act(async () => {
      form = await result.current.createForm({ title: 'Feedback' });
    });

    expect(mockForms.create).toHaveBeenCalledWith({ title: 'Feedback' }, 'u1');
    expect(form).toMatchObject({ id: 'new' });
    expect(result.current.isLoading).toBe(false);
  });

  it('returns undefined and shows the error when creating fails', async () => {
    mockForms.create.mockRejectedValue(new ServiceError('forbidden'));
    const { result } = renderHook(() => useCreateForm());

    let form;
    await act(async () => {
      form = await result.current.createForm({ title: 'Feedback' });
    });

    expect(form).toBeUndefined();
    expect(result.current.errorKey).toBe('errors.forbidden');
  });

  it('clears the error on the next attempt', async () => {
    mockForms.create.mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce(makeForm());
    const { result } = renderHook(() => useCreateForm());

    await act(async () => void (await result.current.createForm({ title: 'A' })));
    await act(async () => void (await result.current.createForm({ title: 'A' })));

    expect(result.current.errorKey).toBeUndefined();
  });

  it('does nothing without a signed-in user', async () => {
    mockAuth.session = undefined;
    const { result } = renderHook(() => useCreateForm());

    let form;
    await act(async () => {
      form = await result.current.createForm({ title: 'A' });
    });

    expect(form).toBeUndefined();
    expect(mockForms.create).not.toHaveBeenCalled();
  });
});
