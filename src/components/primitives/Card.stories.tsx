import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Text } from './Text';

const meta: Meta<typeof Card> = { title: 'Primitives/Card', component: Card };
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = { args: { children: <Text>Card content</Text> } };
export const Pressable: Story = { args: { children: <Text>Tap me</Text>, onPress: () => {} } };
