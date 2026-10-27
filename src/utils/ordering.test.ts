import { moveItem, withOrderIndexes } from './ordering';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('moveItem', () => {
  it('moves an item up', () => {
    expect(moveItem(items, 'b', 'up').map((item) => item.id)).toEqual(['b', 'a', 'c']);
  });

  it('moves an item down', () => {
    expect(moveItem(items, 'b', 'down').map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('does not change the original array', () => {
    moveItem(items, 'b', 'up');
    expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns the same array at the edges', () => {
    expect(moveItem(items, 'a', 'up')).toBe(items);
    expect(moveItem(items, 'c', 'down')).toBe(items);
  });

  it('returns the same array for an unknown id', () => {
    expect(moveItem(items, 'zzz', 'up')).toBe(items);
  });
});

describe('withOrderIndexes', () => {
  it('numbers items from zero in their current order', () => {
    expect(withOrderIndexes([{ orderIndex: 5 }, { orderIndex: 2 }, { orderIndex: 9 }])).toEqual([
      { orderIndex: 0 },
      { orderIndex: 1 },
      { orderIndex: 2 },
    ]);
  });

  it('keeps items that are already right', () => {
    const first = { orderIndex: 0 };
    expect(withOrderIndexes([first, { orderIndex: 4 }])[0]).toBe(first);
  });
});
