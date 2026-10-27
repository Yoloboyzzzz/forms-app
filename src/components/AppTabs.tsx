import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface AppTab {
  /** Route name: the folder or file name inside the tab group. */
  name: string;
  /** Translated title, also used as the accessibility label. */
  title: string;
  icon: IconName;
  testID: string;
}

interface AppTabsProps {
  tabs: AppTab[];
}

/** Bottom tab bar (thumb zone) styled with the theme tokens. */
export function AppTabs({ tabs }: AppTabsProps) {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarButtonTestID: tab.testID,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
