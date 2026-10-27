import { render } from '@testing-library/react-native';
import { AppTabs } from './AppTabs';

const mockScreens: { name: string; options: Record<string, unknown> }[] = [];
let mockScreenOptions: Record<string, unknown> = {};

jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const Tabs = ({ children, screenOptions }: { children: React.ReactNode; screenOptions: Record<string, unknown> }) => {
    mockScreenOptions = screenOptions;
    return createElement('Tabs', null, children);
  };
  Tabs.Screen = ({ name, options }: { name: string; options: Record<string, unknown> }) => {
    mockScreens.push({ name, options });
    return null;
  };
  return { Tabs };
});

beforeEach(() => {
  mockScreens.length = 0;
});

describe('AppTabs', () => {
  const tabs = [
    { name: 'forms', title: 'Forms', icon: 'document-text' as const, testID: 'tab-forms' },
    { name: 'profile', title: 'Profile', icon: 'person-circle' as const, testID: 'tab-profile' },
  ];

  it('registers one screen per tab with title, label and testID', () => {
    render(<AppTabs tabs={tabs} />);
    expect(mockScreens.map((screen) => screen.name)).toEqual(['forms', 'profile']);
    expect(mockScreens[0].options).toMatchObject({
      title: 'Forms',
      tabBarAccessibilityLabel: 'Forms',
      tabBarButtonTestID: 'tab-forms',
    });
  });

  it('renders an icon for each tab', () => {
    render(<AppTabs tabs={tabs} />);
    const tabBarIcon = mockScreens[0].options.tabBarIcon;
    expect(typeof tabBarIcon).toBe('function');
    if (typeof tabBarIcon === 'function') {
      const icon = render(tabBarIcon({ color: '#000', size: 20 }));
      expect(icon.getByText('document-text')).toBeTruthy();
    }
  });

  it('styles the bar with theme colours and hides the header', () => {
    render(<AppTabs tabs={tabs} />);
    expect(mockScreenOptions).toMatchObject({
      headerShown: false,
      tabBarActiveTintColor: '#1d4ed8',
      tabBarStyle: { backgroundColor: '#f9fafb' },
    });
  });
});
