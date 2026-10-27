import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/primitives/Screen';
import { Stack } from '../../../src/components/primitives/Stack';
import { Text } from '../../../src/components/primitives/Text';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  console.log('Detail screen opened for item:', id);

  return (
    <Screen padding="lg">
      <Stack gap="md">
        <Text size="xl" weight="bold">Item Detail</Text>
        <Text size="sm">ID: {id}</Text>
        <Text>Implement getItemById() in your itemService and render your data here.</Text>
      </Stack>
    </Screen>
  );
}

