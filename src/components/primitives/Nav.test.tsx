import { fireEvent, render, screen } from '@testing-library/react-native';
import { Nav } from './Nav';
import { NavItem } from './NavItem';

describe('Nav and NavItem', () => {
  it('renders items in a tablist', () => {
    render(
      <Nav testID="nav">
        <NavItem label="Forms" onPress={jest.fn()} />
        <NavItem label="Profile" onPress={jest.fn()} />
      </Nav>,
    );
    expect(screen.getByTestId('nav').props.accessibilityRole).toBe('tablist');
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('reports presses', () => {
    const onPress = jest.fn();
    render(<NavItem label="Forms" onPress={onPress} testID="item" />);
    fireEvent.press(screen.getByTestId('item'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('marks the active item as selected', () => {
    render(<NavItem label="Forms" onPress={jest.fn()} active icon="document-text" />);
    expect(screen.getByRole('tab', { selected: true })).toBeTruthy();
    expect(screen.getByText('document-text', { includeHiddenElements: true })).toBeTruthy();
  });

  it('is not selected by default and has no icon', () => {
    render(<NavItem label="Forms" onPress={jest.fn()} />);
    expect(screen.getByRole('tab', { selected: false })).toBeTruthy();
  });
});
