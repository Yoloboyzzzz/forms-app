import { render, screen } from '@testing-library/react-native';
import { Text } from './Text';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows a heading', () => {
    render(<EmptyState title="Nothing here" testID="e" />);
    expect(screen.getByRole('header')).toHaveTextContent('Nothing here');
  });

  it('shows the description and action when given', () => {
    render(<EmptyState title="t" description="Try later" action={<Text>Retry</Text>} />);
    expect(screen.getByText('Try later')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('omits optional parts', () => {
    render(<EmptyState title="t" />);
    expect(screen.queryByText('Try later')).toBeNull();
  });
});
