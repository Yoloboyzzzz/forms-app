import { seedFrom, shuffleWithSeed } from './shuffle';

const items = [1, 2, 3, 4, 5, 6, 7, 8];

describe('shuffleWithSeed', () => {
  it('keeps every item exactly once', () => {
    expect([...shuffleWithSeed(items, 42)].sort((a, b) => a - b)).toEqual(items);
  });

  it('gives the same order for the same seed', () => {
    expect(shuffleWithSeed(items, 7)).toEqual(shuffleWithSeed(items, 7));
  });

  it('gives different orders for different seeds', () => {
    const orders = new Set([1, 2, 3, 4, 5, 6].map((seed) => shuffleWithSeed(items, seed).join(',')));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('does not change the original and handles tiny lists', () => {
    shuffleWithSeed(items, 3);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(shuffleWithSeed([], 1)).toEqual([]);
    expect(shuffleWithSeed(['only'], 1)).toEqual(['only']);
  });
});

describe('seedFrom', () => {
  it('is stable and differs per text', () => {
    expect(seedFrom('question-1')).toBe(seedFrom('question-1'));
    expect(seedFrom('question-1')).not.toBe(seedFrom('question-2'));
    expect(seedFrom('')).toBeGreaterThanOrEqual(0);
  });
});
