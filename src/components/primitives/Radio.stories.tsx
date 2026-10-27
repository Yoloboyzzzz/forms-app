import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './Radio';

const meta: Meta<typeof Radio> = { title: 'Primitives/Radio', component: Radio };
export default meta;
type Story = StoryObj<typeof Radio>;

export const Unselected: Story = {
  args: { label: 'Option A', value: 'a', selected: false, onSelect: () => {} },
};
export const Selected: Story = {
  args: { label: 'Option A', value: 'a', selected: true, onSelect: () => {} },
};
