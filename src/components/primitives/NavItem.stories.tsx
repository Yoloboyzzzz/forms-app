import type { Meta, StoryObj } from '@storybook/react';
import { NavItem } from './NavItem';

const meta: Meta<typeof NavItem> = { title: 'Primitives/NavItem', component: NavItem };
export default meta;
type Story = StoryObj<typeof NavItem>;

export const Default: Story = { args: { label: 'Home', onPress: () => {} } };
export const Active: Story = { args: { label: 'Profile', onPress: () => {}, active: true } };
