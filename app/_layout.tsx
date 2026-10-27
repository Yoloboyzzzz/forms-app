import '@/i18n';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useRegisterServiceWorker } from '@/hooks/useRegisterServiceWorker';

export default function RootLayout() {
  const isReady = useAppBootstrap();
  useRegisterServiceWorker();

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Slot />
    </SafeAreaProvider>
  );
}
