import { act, renderHook } from '@testing-library/react-native';
import { useAdminForms } from '@/hooks/useAdminForms';
import { makeForm } from '@/testUtils/factories';

const mockForms = {
  forms: [
    makeForm({ id: 'a', status: 'draft' }),
    makeForm({ id: 'b', status: 'published' }),
    makeForm({ id: 'c', status: 'draft' }),
  ],
  isLoaded: true,
  isLoading: false,
  errorKey: undefined as string | undefined,
  load: jest.fn(),
};

jest.mock('@/state/useFormsStore', () => ({
  useFormsStore: (selector: (state: typeof mockForms) => unknown) => selector(mockForms),
}));

beforeEach(() => {
  mockForms.load = jest.fn().mockResolvedValue(undefined);
  mockForms.errorKey = undefined;
});

describe('useAdminForms', () => {
  it('loads on mount and shows all forms by default', () => {
    const { result } = renderHook(() => useAdminForms());
    expect(mockForms.load).toHaveBeenCalledTimes(1);
    expect(result.current.filter).toBe('all');
    expect(result.current.forms.map((form) => form.id)).toEqual(['a', 'b', 'c']);
  });

  it('filters by status', () => {
    const { result } = renderHook(() => useAdminForms());
    act(() => result.current.setFilter('draft'));
    expect(result.current.forms.map((form) => form.id)).toEqual(['a', 'c']);
    act(() => result.current.setFilter('archived'));
    expect(result.current.forms).toEqual([]);
  });

  it('reloads on demand and exposes store state', () => {
    mockForms.errorKey = 'errors.network';
    const { result } = renderHook(() => useAdminForms());
    act(() => result.current.reload());
    expect(mockForms.load).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ isLoaded: true, isLoading: false, errorKey: 'errors.network' });
  });
});
