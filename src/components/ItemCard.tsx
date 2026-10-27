import type { Item } from '../types/Item';
import { Card } from './primitives/Card';
import { Stack } from './primitives/Stack';
import { Text } from './primitives/Text';

interface ItemCardProps {
  item: Item;
  onPress: () => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <Card onPress={onPress}>
      <Stack gap="sm" padding="md">
        <Text size="lg" weight="bold">{item.title}</Text>
        <Text size="sm">{item.category}</Text>
        <Text numberOfLines={2}>{item.description}</Text>
      </Stack>
    </Card>
  );
}

