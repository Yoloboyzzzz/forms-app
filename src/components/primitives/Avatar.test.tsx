import { render, screen } from '@testing-library/react-native';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('shows initials of the first two words', () => {
    render(<Avatar name="Ann Marie Jones" testID="a" />);
    expect(screen.getByText('AM')).toBeTruthy();
    expect(screen.getByLabelText('Ann Marie Jones')).toBeTruthy();
  });

  it('ignores extra spaces', () => {
    render(<Avatar name="  ann   lee " />);
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('shows a question mark without a name', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('renders an image when given a uri', () => {
    render(<Avatar uri="https://example.com/a.png" name="Ann" testID="a" size="lg" />);
    expect(screen.getByTestId('a').props.source).toEqual({ uri: 'https://example.com/a.png' });
    expect(screen.getByTestId('a')).toHaveStyle({ width: 56 });
  });
});
