import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta: Meta<typeof Text> = { title: 'Primitives/Text', component: Text };
export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = { args: { children: 'The quick brown fox' } };
export const Small: Story = { args: { children: 'Small text', size: 'sm' } };
export const Large: Story = { args: { children: 'Large text', size: 'lg' } };
export const ExtraLarge: Story = { args: { children: 'XL heading', size: 'xl' } };
export const Bold: Story = { args: { children: 'Bold text', weight: 'bold' } };
export const Centered: Story = { args: { children: 'Centered text', align: 'center' } };
