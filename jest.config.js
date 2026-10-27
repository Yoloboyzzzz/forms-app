/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/cypress/', '/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.stories.tsx', '!src/**/*.d.ts', '!src/types/supabase.ts', '!src/**/testUtils/**'],
  coverageThreshold: {
    global: { lines: 80, branches: 80, functions: 80, statements: 80 },
    './src/utils/': { lines: 90, branches: 90, functions: 90, statements: 90 },
    './src/services/': { lines: 90, branches: 90, functions: 90, statements: 90 },
    './src/state/': { lines: 90, branches: 90, functions: 90, statements: 90 },
  },
};
