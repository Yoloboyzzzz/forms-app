import { renderHook } from '@testing-library/react-native';
import { canRegisterServiceWorker, serviceWorkerUrl, useRegisterServiceWorker } from './useRegisterServiceWorker.web';

const worker = { register: jest.fn() } as unknown as ServiceWorkerContainer; // only `register` is used

describe('canRegisterServiceWorker', () => {
  it('registers in production when the browser supports service workers', () => {
    expect(canRegisterServiceWorker('production', { serviceWorker: worker })).toBe(true);
  });

  it('does not register while developing or testing, so cached files cannot go stale', () => {
    expect(canRegisterServiceWorker('development', { serviceWorker: worker })).toBe(false);
    expect(canRegisterServiceWorker('test', { serviceWorker: worker })).toBe(false);
    expect(canRegisterServiceWorker(undefined, { serviceWorker: worker })).toBe(false);
  });

  it('does nothing without service worker support', () => {
    expect(canRegisterServiceWorker('production', undefined)).toBe(false);
    expect(canRegisterServiceWorker('production', {} as Navigator)).toBe(false); // a browser without the property
  });
});

describe('serviceWorkerUrl', () => {
  it('sits at the root without a base path', () => {
    expect(serviceWorkerUrl(undefined)).toBe('/sw.js');
  });

  it('follows the base path of a sub path deployment', () => {
    expect(serviceWorkerUrl('/forms')).toBe('/forms/sw.js');
    expect(serviceWorkerUrl('/forms/')).toBe('/forms/sw.js');
  });
});

describe('useRegisterServiceWorker (web)', () => {
  it('leaves the browser alone outside production', () => {
    const register = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(global, 'navigator', { value: { serviceWorker: { register } }, configurable: true });
    renderHook(() => useRegisterServiceWorker());
    expect(register).not.toHaveBeenCalled();
  });
});
