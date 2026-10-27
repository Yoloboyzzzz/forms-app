import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { detectDeviceLanguage, isLanguage, setLanguage as applyLanguage, type Language } from '@/i18n';

interface SettingsState {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
}

/**
 * App settings that survive restarts. The language starts as the device language until the
 * user picks one in Profile; only that explicit choice is persisted.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: detectDeviceLanguage(),
      setLanguage: async (language) => {
        await applyLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
      // Apply a stored choice to i18n as soon as it is read back.
      onRehydrateStorage: () => (state) => {
        if (state !== undefined && isLanguage(state.language)) {
          void applyLanguage(state.language);
        }
      },
    },
  ),
);
