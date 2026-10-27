import { render, screen } from '@testing-library/react-native';
import { Text } from './Text';
import { Stack } from './Stack';

describe('Stack', () => {
  it('lays children out in a column with gap and padding tokens', () => {
    render(
      <Stack testID="s" gap="md" padding="lg" flex={1}>
        <Text>a</Text>
      </Stack>,
    );
    expect(screen.getByTestId('s')).toHaveStyle({ flexDirection: 'column', gap: 16, padding: 24, flex: 1 });
    expect(screen.getByText('a')).toBeTruthy();
  });

  it('defaults to no gap and stretch alignment', () => {
    render(<Stack testID="s">{null}</Stack>);
    expect(screen.getByTestId('s')).toHaveStyle({ gap: 0, alignItems: 'stretch' });
  });
});
