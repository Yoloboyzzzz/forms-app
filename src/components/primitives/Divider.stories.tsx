import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = { title: 'Primitives/Divider', component: Divider };
export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = { args: { orientation: 'horizontal' } };
export const HorizontalSpaced: Story = { args: { orientation: 'horizontal', spacing: 'md' } };
