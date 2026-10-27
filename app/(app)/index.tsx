import { useAuthStore } from '../../src/state/useAuthStore';
import { Screen } from '../../src/components/primitives/Screen';
import { Stack } from '../../src/components/primitives/Stack';
import { Text } from '../../src/components/primitives/Text';
import { EmptyState } from '../../src/components/primitives/EmptyState';
import { Button } from '../../src/components/primitives/Button';
import {Badge} from "@/components/primitives";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <Screen padding="lg">
      <Stack gap="lg">
        <Text size="xl" weight="bold">
          {user !== null ? `Welcome, ${user.name}` : 'Welcome'}
        </Text>
        <Text>Your items will appear here once you connect Supabase.</Text>
        <Badge label={'Succes badge'} variant={"success"} />
        <EmptyState
          title="No items yet"
          description="Implement getItems() in your itemService to load data."
        />
        <Button label="Log out" onPress={logout} variant="secondary" />
      </Stack>
    </Screen>
  );
}

