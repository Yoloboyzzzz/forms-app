import type { Meta, StoryObj } from '@storybook/react';
import { Nav } from './Nav';
import { NavItem } from './NavItem';

const meta: Meta<typeof Nav> = { title: 'Primitives/Nav', component: Nav };
export default meta;
type Story = StoryObj<typeof Nav>;

export const Default: Story = {
  args: {
    children: (
      <>
        <NavItem label="Home" onPress={() => {}} active />
        <NavItem label="Explore" onPress={() => {}} />
        <NavItem label="Profile" onPress={() => {}} />
      </>
    ),
  },
};
