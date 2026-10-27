import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = { title: 'Primitives/EmptyState', component: EmptyState };
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = { args: { title: 'Nothing here yet' } };
export const WithDescription: Story = {
  args: { title: 'No items found', description: 'Add your first item to get started.' },
};
