import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from './Text';
import { Card } from './Card';

describe('Card', () => {
  it('renders static content', () => {
    render(<Card testID="c"><Text>body</Text></Card>);
    expect(screen.getByTestId('c').props.accessibilityRole).toBeUndefined();
    expect(screen.getByText('body')).toBeTruthy();
  });

  it('is a button when pressable', () => {
    const onPress = jest.fn();
    render(<Card testID="c" onPress={onPress} accessibilityLabel="Open"><Text>body</Text></Card>);
    fireEvent.press(screen.getByTestId('c'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Open')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
