import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import { FormActionsBar } from './FormActionsBar';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.editorActions;

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('FormActionsBar', () => {
  it('shows only the actions that have a handler', () => {
    render(<FormActionsBar onSettings={jest.fn()} />);
    expect(screen.getByTestId(ids.settings)).toBeTruthy();
    [ids.preview, ids.assign, ids.responses, ids.publish, ids.archive, ids.duplicate].forEach((id) =>
      expect(screen.queryByTestId(id)).toBeNull(),
    );
  });

  it('runs each action', () => {
    const handlers = {
      onSettings: jest.fn(),
      onPreview: jest.fn(),
      onAssign: jest.fn(),
      onResponses: jest.fn(),
      onPublish: jest.fn(),
      onArchive: jest.fn(),
      onDuplicate: jest.fn(),
    };
    render(<FormActionsBar {...handlers} />);
    [ids.settings, ids.preview, ids.assign, ids.responses, ids.publish, ids.archive, ids.duplicate].forEach((id) =>
      fireEvent.press(screen.getByTestId(id)),
    );
    Object.values(handlers).forEach((handler) => expect(handler).toHaveBeenCalledTimes(1));
  });

  it('blocks publish, archive and duplicate while working', () => {
    const handlers = { onPublish: jest.fn(), onArchive: jest.fn(), onDuplicate: jest.fn() };
    render(<FormActionsBar {...handlers} isWorking />);
    [ids.publish, ids.archive, ids.duplicate].forEach((id) => fireEvent.press(screen.getByTestId(id)));
    Object.values(handlers).forEach((handler) => expect(handler).not.toHaveBeenCalled());
  });
});
