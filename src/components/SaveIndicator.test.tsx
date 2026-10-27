import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import { SaveIndicator } from './SaveIndicator';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('SaveIndicator', () => {
  it('shows nothing when idle', () => {
    render(<SaveIndicator state="idle" onRetry={jest.fn()} />);
    expect(screen.queryByTestId(testIds.editor.saveIndicator)).toBeNull();
  });

  it.each([
    ['saving', 'Saving…'],
    ['dirty', 'Unsaved changes'],
    ['saved', 'Saved'],
  ] as const)('shows the %s state', (state, text) => {
    render(<SaveIndicator state={state} onRetry={jest.fn()} />);
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('shows a failed save with its reason and a retry button', () => {
    const onRetry = jest.fn();
    render(<SaveIndicator state="error" errorKey="errors.network" onRetry={onRetry} />);
    expect(screen.getByText(/Saving failed: No connection/)).toBeTruthy();
    fireEvent.press(screen.getByTestId(testIds.editor.retrySaveButton));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows a failed save without a reason', () => {
    render(<SaveIndicator state="error" onRetry={jest.fn()} />);
    expect(screen.getByText('Saving failed')).toBeTruthy();
  });

  it('offers no retry unless saving failed', () => {
    render(<SaveIndicator state="saved" onRetry={jest.fn()} />);
    expect(screen.queryByTestId(testIds.editor.retrySaveButton)).toBeNull();
  });
});
