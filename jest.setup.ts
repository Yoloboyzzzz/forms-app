import type { TextProps } from 'react-native';

// Ionicons loads its font asynchronously, which causes act() warnings and renders nothing until loaded.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: ({ name, ...rest }: TextProps & { name: string }) => createElement(Text, rest, name),
  };
});
