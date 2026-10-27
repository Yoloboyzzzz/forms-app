const resetters = new Set<() => void>();

/**
 * Registers a store's reset function so logout can clear every store that holds user data.
 * Call it once, right after creating the store.
 */
export function registerStoreReset(reset: () => void): void {
  resetters.add(reset);
}

/** Clears all registered stores (logout, account switch). */
export function resetAllStores(): void {
  resetters.forEach((reset) => reset());
}
