import { fireEvent, render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'todo', label: 'To do', testID: 'tab-todo' },
  { value: 'done', label: 'Done', testID: 'tab-done' },
] as const;

describe('SegmentedControl', () => {
  it('marks the selected option', () => {
    render(<SegmentedControl options={[...options]} value="done" onChange={jest.fn()} label="Filter" testID="c" />);
    expect(screen.getByTestId('c').props.accessibilityLabel).toBe('Filter');
    expect(screen.getByTestId('tab-done').props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId('tab-done')).toHaveStyle({ backgroundColor: lightColors.primary });
    expect(screen.getByTestId('tab-todo').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('reports the chosen option', () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={[...options]} value="todo" onChange={onChange} />);
    fireEvent.press(screen.getByTestId('tab-done'));
    expect(onChange).toHaveBeenCalledWith('done');
  });

  it('works without testIDs', () => {
    render(<SegmentedControl options={[{ value: 'a', label: 'A' }]} value="a" onChange={jest.fn()} />);
    expect(screen.getByRole('tab', { name: 'A' })).toBeTruthy();
  });
});
