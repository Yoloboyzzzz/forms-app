import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { RouteGuard } from './RouteGuard';

const mockRedirect = jest.fn();

jest.mock('expo-router', () => ({
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
}));

beforeEach(() => mockRedirect.mockClear());

describe('RouteGuard', () => {
  it('renders children when allowed', () => {
    render(<RouteGuard access={{ status: 'allowed' }}><Text>secret</Text></RouteGuard>);
    expect(screen.getByText('secret')).toBeTruthy();
  });

  it('redirects instead of rendering children', () => {
    render(<RouteGuard access={{ status: 'redirect', href: '/login' }}><Text>secret</Text></RouteGuard>);
    expect(mockRedirect).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('renders nothing while waiting', () => {
    render(<RouteGuard access={{ status: 'wait' }}><Text>secret</Text></RouteGuard>);
    expect(screen.queryByText('secret')).toBeNull();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
