import { orderedOptions } from './options';

const options = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, label: id.toUpperCase() }));

describe('orderedOptions', () => {
  it('keeps the order when shuffling is off', () => {
    expect(orderedOptions({ id: 'q', options, settings: {} })).toBe(options);
    expect(orderedOptions({ id: 'q', options, settings: { shuffleOptions: false } })).toBe(options);
  });

  it('shuffles when asked, keeping every option', () => {
    const shuffled = orderedOptions({ id: 'q', options, settings: { shuffleOptions: true } });
    expect([...shuffled].sort((x, y) => x.id.localeCompare(y.id))).toEqual(options);
  });

  it('shuffles the same way every time for the same question', () => {
    const question = { id: 'question-1', options, settings: { shuffleOptions: true } };
    expect(orderedOptions(question)).toEqual(orderedOptions(question));
  });

  it('shuffles differently for different questions', () => {
    const orders = new Set(
      ['q1', 'q2', 'q3', 'q4', 'q5'].map((id) =>
        orderedOptions({ id, options, settings: { shuffleOptions: true } }).map((option) => option.id).join(''),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});
