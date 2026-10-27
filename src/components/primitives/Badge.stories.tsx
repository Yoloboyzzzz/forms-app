import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = { title: 'Primitives/Badge', component: Badge };
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { label: 'Default' } };
export const Success: Story = { args: { label: 'Success', variant: 'success' } };
export const Warning: Story = { args: { label: 'Warning', variant: 'warning' } };
export const ErrorVariant: Story = { args: { label: 'Error', variant: 'error' } };
