import { render, screen } from '@testing-library/react-native';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  // The looping animation would otherwise tick outside act() while the test runs.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('uses minHeight so it never clips', () => {
    render(<Skeleton testID="s" width={120} height={24} radius="pill" />);
    expect(screen.getByTestId('s', { includeHiddenElements: true })).toHaveStyle({ width: 120, minHeight: 24 });
  });

  it('is hidden from assistive tech', () => {
    render(<Skeleton testID="s" />);
    expect(screen.getByTestId('s', { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
  });

  it('stops animating on unmount', () => {
    const { unmount } = render(<Skeleton testID="s" />);
    expect(() => unmount()).not.toThrow();
  });
});
