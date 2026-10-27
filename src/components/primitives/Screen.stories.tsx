import type { Meta, StoryObj } from '@storybook/react';
import { Screen } from './Screen';
import { Text } from './Text';

const meta: Meta<typeof Screen> = { title: 'Primitives/Screen', component: Screen };
export default meta;
type Story = StoryObj<typeof Screen>;

export const Default: Story = { args: { children: <Text>Screen content</Text>, padding: 'md' } };
export const NonScrollable: Story = {
  args: { children: <Text>Fixed screen</Text>, padding: 'lg', scrollable: false },
};
