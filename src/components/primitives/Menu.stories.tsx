import type { Meta, StoryObj } from '@storybook/react';
import { Menu } from './Menu';

const meta: Meta<typeof Menu> = { title: 'Primitives/Menu', component: Menu };
export default meta;
type Story = StoryObj<typeof Menu>;

export const Visible: Story = {
  args: {
    visible: true,
    onClose: () => {},
    items: [
      { label: 'Edit', onPress: () => {} },
      { label: 'Delete', onPress: () => {} },
    ],
  },
};
export const Hidden: Story = {
  args: {
    visible: false,
    onClose: () => {},
    items: [{ label: 'Edit', onPress: () => {} }],
  },
};
