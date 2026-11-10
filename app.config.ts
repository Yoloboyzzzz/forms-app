import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json. The web build can be hosted under a sub path (GitHub Pages serves
 * https://<user>.github.io/<repo>/), which is set through EXPO_BASE_URL at export time, for example "/forms".
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Forms',
  slug: config.slug ?? 'ucll-mobile-starter',
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL,
  },
});
