import { fireEvent, render, screen } from '@testing-library/react-native';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('is a multiline input that reports text', () => {
    const onChangeText = jest.fn();
    render(<TextArea label="Comments" value="" onChangeText={onChangeText} testID="ta" />);
    const input = screen.getByTestId('ta');
    expect(input.props.multiline).toBe(true);
    expect(input).toHaveStyle({ minHeight: 96 });
    fireEvent.changeText(input, 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('shows errors like InputField', () => {
    render(<TextArea label="Comments" value="" onChangeText={jest.fn()} error="Too short" testID="ta" />);
    expect(screen.getByTestId('ta-error')).toHaveTextContent('Too short');
  });
});
