import { router } from 'expo-router';
import { LoginForm } from '@/components/LoginForm';
import { Screen } from '@/components/primitives';
import { RouteGuard } from '@/components/RouteGuard';
import { routes } from '@/constants/routes';
import { useLogin } from '@/hooks/useLogin';
import { useRouteAccess } from '@/hooks/useRouteAccess';

export default function LoginScreen() {
  const access = useRouteAccess('public');
  const { signIn, isLoading, errorKey } = useLogin();

  return (
    <RouteGuard access={access}>
      <Screen padding="none">
        <LoginForm
          onSubmit={signIn}
          onForgotPassword={() => router.push(routes.forgotPassword)}
          isLoading={isLoading}
          errorKey={errorKey}
        />
      </Screen>
    </RouteGuard>
  );
}
