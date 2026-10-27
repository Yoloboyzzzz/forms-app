import type { Meta, StoryObj } from '@storybook/react';
import { Container } from './Container';
import { Text } from './Text';

const meta: Meta<typeof Container> = { title: 'Primitives/Container', component: Container };
export default meta;
type Story = StoryObj<typeof Container>;

export const Default: Story = { args: { children: <Text>Inside a container</Text> } };
export const WithPadding: Story = { args: { children: <Text>Padded content</Text>, padding: 'md' } };
