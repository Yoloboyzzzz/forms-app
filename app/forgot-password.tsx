import { router } from 'expo-router';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { Screen } from '@/components/primitives';
import { RouteGuard } from '@/components/RouteGuard';
import { routes } from '@/constants/routes';
import { useForgotPassword } from '@/hooks/useForgotPassword';
import { useRouteAccess } from '@/hooks/useRouteAccess';

export default function ForgotPasswordScreen() {
  const access = useRouteAccess('public');
  const { step, isLoading, errorKey, requestCode, resendCode, resetPassword } = useForgotPassword();

  return (
    <RouteGuard access={access}>
      <Screen padding="none">
        <ForgotPasswordForm
          step={step}
          onRequestCode={requestCode}
          onResendCode={resendCode}
          onSubmit={resetPassword}
          onBackToLogin={() => router.replace(routes.login)}
          isLoading={isLoading}
          errorKey={errorKey}
        />
      </Screen>
    </RouteGuard>
  );
}
