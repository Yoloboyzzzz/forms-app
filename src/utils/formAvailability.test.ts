import { isFormOpen } from './formAvailability';

const now = new Date(2026, 10, 1, 12);

describe('isFormOpen', () => {
  it('is open when accepting responses and without a closing time', () => {
    expect(isFormOpen({ isAcceptingResponses: true }, now)).toBe(true);
  });

  it('is closed when responses are switched off', () => {
    expect(isFormOpen({ isAcceptingResponses: false }, now)).toBe(false);
  });

  it('is open before the closing time and closed at or after it', () => {
    expect(isFormOpen({ isAcceptingResponses: true, closesAt: new Date(2026, 10, 2) }, now)).toBe(true);
    expect(isFormOpen({ isAcceptingResponses: true, closesAt: now }, now)).toBe(false);
    expect(isFormOpen({ isAcceptingResponses: true, closesAt: new Date(2026, 9, 1) }, now)).toBe(false);
  });
});
