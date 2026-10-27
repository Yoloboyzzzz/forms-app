import { fireEvent, render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { ConfirmDialog } from './ConfirmDialog';

function setup(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  render(
    <ConfirmDialog
      visible
      title="Delete form?"
      message="This cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      testID="dialog"
      {...props}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('shows title and message', () => {
    setup();
    expect(screen.getByRole('header')).toHaveTextContent('Delete form?');
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  });

  it('confirms and cancels', () => {
    const { onConfirm, onCancel } = setup();
    fireEvent.press(screen.getByTestId('dialog-confirm'));
    fireEvent.press(screen.getByTestId('dialog-cancel'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels from the backdrop', () => {
    const { onCancel } = setup({ cancelLabel: 'Close' });
    fireEvent.press(screen.getAllByLabelText('Close')[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it('styles destructive confirmation', () => {
    setup({ destructive: true });
    expect(screen.getByTestId('dialog-confirm')).toHaveStyle({ backgroundColor: lightColors.error });
  });

  it('blocks confirmation while loading', () => {
    const { onConfirm } = setup({ isLoading: true });
    fireEvent.press(screen.getByTestId('dialog-confirm'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders nothing when hidden', () => {
    setup({ visible: false });
    expect(screen.queryByTestId('dialog')).toBeNull();
  });

  it('works without a testID', () => {
    setup({ testID: undefined });
    expect(screen.getByText('Delete')).toBeTruthy();
  });
});
