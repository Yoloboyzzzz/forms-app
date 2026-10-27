import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = { title: 'Primitives/Tag', component: Tag };
export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = { args: { label: 'React Native' } };
export const WithRemove: Story = { args: { label: 'Removable', onRemove: () => {} } };
