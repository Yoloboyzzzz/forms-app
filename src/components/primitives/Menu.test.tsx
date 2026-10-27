import { fireEvent, render, screen } from '@testing-library/react-native';
import { Menu } from './Menu';

describe('Menu', () => {
  it('renders nothing when hidden', () => {
    render(<Menu items={[]} visible={false} onClose={jest.fn()} testID="m" />);
    expect(screen.queryByTestId('m')).toBeNull();
  });

  it('runs the item action and closes', () => {
    const onPress = jest.fn();
    const onClose = jest.fn();
    render(<Menu items={[{ label: 'Edit', onPress, testID: 'edit' }]} visible onClose={onClose} testID="m" />);
    fireEvent.press(screen.getByTestId('edit'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the backdrop', () => {
    const onClose = jest.fn();
    render(<Menu items={[]} visible onClose={onClose} closeLabel="Close menu" testID="m" />);
    fireEvent.press(screen.getByLabelText('Close menu'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exposes menu roles', () => {
    render(<Menu items={[{ label: 'Edit', onPress: jest.fn() }]} visible onClose={jest.fn()} testID="m" />);
    expect(screen.getByTestId('m').props.accessibilityRole).toBe('menu');
    expect(screen.getByRole('menuitem')).toBeTruthy();
  });
});
