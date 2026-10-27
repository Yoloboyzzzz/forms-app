import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from './Stack';
import { Text } from './Text';

const meta: Meta<typeof Stack> = { title: 'Primitives/Stack', component: Stack };
export default meta;
type Story = StoryObj<typeof Stack>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Text>Item 1</Text>
        <Text>Item 2</Text>
        <Text>Item 3</Text>
      </>
    ),
    gap: 'md',
  },
};

export const Centered: Story = {
  args: {
    children: (
      <>
        <Text>Centered A</Text>
        <Text>Centered B</Text>
      </>
    ),
    align: 'center',
    gap: 'sm',
  },
};
