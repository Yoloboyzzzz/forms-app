import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = { title: 'Primitives/Toast', component: Toast };
export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = { args: { message: 'Operation complete', visible: true } };
export const Success: Story = { args: { message: 'Saved!', variant: 'success', visible: true } };
export const ErrorVariant: Story = {
  args: { message: 'Something went wrong', variant: 'error', visible: true },
};
