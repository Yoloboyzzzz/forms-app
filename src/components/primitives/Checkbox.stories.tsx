import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = { title: 'Primitives/Checkbox', component: Checkbox };
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {
  args: { label: 'Accept terms', checked: false, onChange: () => {} },
};
export const Checked: Story = {
  args: { label: 'Accept terms', checked: true, onChange: () => {} },
};
