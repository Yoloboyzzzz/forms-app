import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { Screen } from '@/components/primitives';
import { RouteGuard } from '@/components/RouteGuard';
import { useChangePassword } from '@/hooks/useChangePassword';
import { useRouteAccess } from '@/hooks/useRouteAccess';
import { useAuthStore } from '@/state/useAuthStore';

/** Forced first-login password change. Nothing else is reachable until it is done (guards in utils/routeAccess). */
export default function ChangePasswordScreen() {
  const access = useRouteAccess('passwordChange');
  const signOut = useAuthStore((state) => state.signOut);
  const { changePassword, isLoading, errorKey } = useChangePassword();

  return (
    <RouteGuard access={access}>
      <Screen padding="none">
        <ChangePasswordForm
          mode="forced"
          onSubmit={changePassword}
          onLogout={signOut}
          isLoading={isLoading}
          errorKey={errorKey}
        />
      </Screen>
    </RouteGuard>
  );
}
