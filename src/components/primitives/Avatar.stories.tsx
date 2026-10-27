import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = { title: 'Primitives/Avatar', component: Avatar };
export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithInitials: Story = { args: { name: 'Niels Jacobs' } };
export const Small: Story = { args: { name: 'NJ', size: 'sm' } };
export const Large: Story = { args: { name: 'NJ', size: 'lg' } };
