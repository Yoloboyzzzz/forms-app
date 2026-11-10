import { ScrollViewStyleReset } from 'expo-router/html';

// Runs at export time in Node; the base path is set when the app is hosted under a sub path (GitHub Pages).
const BASE_URL = process.env.EXPO_BASE_URL ?? '';

/** Root HTML of the web build: viewport, PWA manifest, theme colour and home screen icon. */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#1d4ed8" />
        <link rel="manifest" href={`${BASE_URL}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${BASE_URL}/icons/apple-touch-icon.png`} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
