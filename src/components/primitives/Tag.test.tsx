import { fireEvent, render, screen } from '@testing-library/react-native';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders the label without a remove button by default', () => {
    render(<Tag label="Reports" testID="t" />);
    expect(screen.getByText('Reports')).toBeTruthy();
    expect(screen.queryByTestId('t-remove')).toBeNull();
  });

  it('removes via the labelled button', () => {
    const onRemove = jest.fn();
    render(<Tag label="Reports" onRemove={onRemove} removeLabel="Remove Reports" testID="t" />);
    fireEvent.press(screen.getByLabelText('Remove Reports'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('t-remove')).toBeTruthy();
  });

  it('works without a testID', () => {
    render(<Tag label="Reports" onRemove={jest.fn()} />);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
