import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import type { PendingUserAction } from '@/hooks/useUsersScreen';
import { ConfirmDialog } from './primitives';

interface UserActionConfirmDialogProps {
  action?: PendingUserAction;
  isWorking?: boolean;
  /** i18n key when confirming failed. */
  errorKey?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks the admin to confirm a password reset or role change. */
export function UserActionConfirmDialog({
  action,
  isWorking = false,
  errorKey,
  onConfirm,
  onCancel,
}: UserActionConfirmDialogProps) {
  const { t } = useTranslation();

  if (action === undefined) {
    return null;
  }

  const name = action.user.fullName === '' ? action.user.email : action.user.fullName;
  const title = action.kind === 'reset' ? t('users.resetConfirmTitle') : t('users.roleConfirmTitle');
  const baseMessage =
    action.kind === 'reset'
      ? t('users.resetConfirmMessage', { name })
      : t(action.role === 'admin' ? 'users.roleConfirmToAdmin' : 'users.roleConfirmToUser', { name });

  return (
    <ConfirmDialog
      visible
      title={title}
      message={errorKey === undefined ? baseMessage : `${baseMessage}\n\n${t(errorKey)}`}
      confirmLabel={action.kind === 'reset' ? t('users.reset') : t('users.change')}
      cancelLabel={t('common.cancel')}
      destructive={action.kind === 'reset' || action.role === 'user'}
      isLoading={isWorking}
      onConfirm={onConfirm}
      onCancel={onCancel}
      testID={testIds.users.confirmDialog}
    />
  );
}
