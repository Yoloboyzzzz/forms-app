import { renderHook } from '@testing-library/react-native';
import { useRegisterServiceWorker } from './useRegisterServiceWorker';

describe('useRegisterServiceWorker (native)', () => {
  it('does nothing', () => {
    expect(() => renderHook(() => useRegisterServiceWorker())).not.toThrow();
  });
});
