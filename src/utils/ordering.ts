export type MoveDirection = 'up' | 'down';

/**
 * Moves the item with `id` one place up or down. Returns the same array when the item is missing or
 * already at the edge, so callers can skip saving.
 */
export function moveItem<T extends { id: string }>(items: T[], id: string, direction: MoveDirection): T[] {
  const index = items.findIndex((item) => item.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= items.length) {
    return items;
  }
  const result = [...items];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

/** Gives items consecutive `orderIndex` values (0, 1, 2, ...) in their current order. */
export function withOrderIndexes<T extends { orderIndex: number }>(items: T[]): T[] {
  return items.map((item, index) => (item.orderIndex === index ? item : { ...item, orderIndex: index }));
}
