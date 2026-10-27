import { registerStoreReset, resetAllStores } from './storeRegistry';

describe('storeRegistry', () => {
  it('calls every registered reset function', () => {
    const first = jest.fn();
    const second = jest.fn();
    registerStoreReset(first);
    registerStoreReset(second);

    resetAllStores();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('registers the same function only once', () => {
    const reset = jest.fn();
    registerStoreReset(reset);
    registerStoreReset(reset);

    resetAllStores();

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
