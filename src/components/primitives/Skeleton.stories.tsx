import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = { title: 'Primitives/Skeleton', component: Skeleton };
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = { args: { width: 200, height: 20 } };
export const Circle: Story = { args: { width: 48, height: 48, borderRadius: 24 } };
