export interface ColorTokens {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  successBackground: string;
  success: string;
  warningBackground: string;
  warning: string;
  errorBackground: string;
  error: string;
  overlay: string;
}

export const lightColors: ColorTokens = {
  background: '#ffffff',
  surface: '#f9fafb',
  surfaceMuted: '#e5e7eb',
  border: '#d1d5db',
  text: '#111827',
  textMuted: '#4b5563',
  textInverse: '#ffffff',
  primary: '#1d4ed8',
  primaryPressed: '#1e40af',
  onPrimary: '#ffffff',
  successBackground: '#d1fae5',
  success: '#065f46',
  warningBackground: '#fef3c7',
  warning: '#92400e',
  errorBackground: '#fee2e2',
  error: '#b91c1c',
  overlay: 'rgba(17, 24, 39, 0.5)',
};

export const darkColors: ColorTokens = {
  background: '#0b1120',
  surface: '#111827',
  surfaceMuted: '#1f2937',
  border: '#374151',
  text: '#f9fafb',
  textMuted: '#9ca3af',
  textInverse: '#111827',
  primary: '#60a5fa',
  primaryPressed: '#93c5fd',
  onPrimary: '#0b1120',
  successBackground: '#064e3b',
  success: '#a7f3d0',
  warningBackground: '#78350f',
  warning: '#fde68a',
  errorBackground: '#7f1d1d',
  error: '#fecaca',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
