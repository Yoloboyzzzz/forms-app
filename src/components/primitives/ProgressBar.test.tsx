import { render, screen } from '@testing-library/react-native';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('fills to the given fraction', () => {
    render(<ProgressBar value={0.4} label="Progress" testID="p" />);
    expect(screen.getByTestId('p-fill')).toHaveStyle({ width: '40%' });
    expect(screen.getByTestId('p').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });
    expect(screen.getByTestId('p').props.accessibilityLabel).toBe('Progress');
  });

  it('clamps values outside 0 to 1', () => {
    const { rerender } = render(<ProgressBar value={2} testID="p" />);
    expect(screen.getByTestId('p-fill')).toHaveStyle({ width: '100%' });
    rerender(<ProgressBar value={-1} testID="p" />);
    expect(screen.getByTestId('p-fill')).toHaveStyle({ width: '0%' });
  });

  it('works without a testID', () => {
    render(<ProgressBar value={0.5} label="Progress" />);
    expect(screen.getByLabelText('Progress')).toBeTruthy();
  });
});
