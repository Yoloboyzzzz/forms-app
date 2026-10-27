import type { Meta, StoryObj } from '@storybook/react';
import { Row } from './Row';
import { Text } from './Text';

const meta: Meta<typeof Row> = { title: 'Primitives/Row', component: Row };
export default meta;
type Story = StoryObj<typeof Row>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Text>Left</Text>
        <Text>Right</Text>
      </>
    ),
    gap: 'md',
    justify: 'space-between',
  },
};
