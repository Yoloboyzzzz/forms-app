import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = { title: 'Primitives/Spinner', component: Spinner };
export default meta;
type Story = StoryObj<typeof Spinner>;

export const Small: Story = { args: { size: 'small' } };
export const Large: Story = { args: { size: 'large' } };
