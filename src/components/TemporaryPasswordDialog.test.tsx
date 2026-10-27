import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import { TemporaryPasswordDialog } from './TemporaryPasswordDialog';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

function setup(props: Partial<React.ComponentProps<typeof TemporaryPasswordDialog>> = {}) {
  const onCopy = jest.fn();
  const onClose = jest.fn();
  render(
    <TemporaryPasswordDialog
      visible
      userName="Ann"
      password="Abc12345xyz9"
      reason="created"
      onCopy={onCopy}
      onClose={onClose}
      {...props}
    />,
  );
  return { onCopy, onClose };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('TemporaryPasswordDialog', () => {
  it('shows the password and who it is for', () => {
    setup();
    expect(screen.getByTestId(testIds.tempPassword.value)).toHaveTextContent('Abc12345xyz9');
    expect(screen.getAllByText(/Give this temporary password to Ann/).length).toBeGreaterThan(0);
  });

  it('titles the dialog by reason', () => {
    setup();
    expect(screen.getByText('Account created')).toBeTruthy();
  });

  it('titles a reset', () => {
    setup({ reason: 'reset' });
    expect(screen.getByText('Password reset')).toBeTruthy();
  });

  it('copies and closes', () => {
    const { onCopy, onClose } = setup();
    fireEvent.press(screen.getByTestId(testIds.tempPassword.copyButton));
    fireEvent.press(screen.getByTestId(testIds.tempPassword.closeButton));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('confirms a copy', () => {
    setup({ copied: true });
    expect(screen.getByText('Copied')).toBeTruthy();
  });

  it('is hidden when not visible', () => {
    setup({ visible: false });
    expect(screen.queryByTestId(testIds.tempPassword.dialog)).toBeNull();
  });
});
