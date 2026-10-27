import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import type { GridOptions, GridSettings } from '@/types/models';
import { GridEditor } from './GridEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));
jest.mock('@/hooks/useNewId', () => ({ useNewId: () => () => 'new-id' }));

const options: GridOptions = {
  rows: [
    { id: 'r1', label: 'Food' },
    { id: 'r2', label: 'Service' },
  ],
  columns: [
    { id: 'c1', label: 'Good' },
    { id: 'c2', label: 'Bad' },
  ],
};

function setup(settings: GridSettings = {}, grid: GridOptions = options) {
  const onChangeOptions = jest.fn();
  const onChangeSettings = jest.fn();
  render(
    <GridEditor questionId="q1" options={grid} settings={settings} onChangeOptions={onChangeOptions} onChangeSettings={onChangeSettings} />,
  );
  return { onChangeOptions, onChangeSettings };
}

const line = (kind: 'row' | 'column', id: string) => testIdFor.gridLine('q1', kind, id);
const action = (kind: 'row' | 'column', id: string, name: string) => testIdFor.gridLineAction('q1', kind, id, name);

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('GridEditor rows and columns', () => {
  it('shows every row and column label', () => {
    setup();
    expect(screen.getByTestId(line('row', 'r1')).props.value).toBe('Food');
    expect(screen.getByTestId(line('column', 'c2')).props.value).toBe('Bad');
  });

  it('edits a row label and a column label', () => {
    const { onChangeOptions } = setup();
    fireEvent.changeText(screen.getByTestId(line('row', 'r2')), 'Staff');
    expect(onChangeOptions).toHaveBeenLastCalledWith({ ...options, rows: [options.rows[0], { id: 'r2', label: 'Staff' }] });
    fireEvent.changeText(screen.getByTestId(line('column', 'c1')), 'Great');
    expect(onChangeOptions).toHaveBeenLastCalledWith({ ...options, columns: [{ id: 'c1', label: 'Great' }, options.columns[1]] });
  });

  it('adds numbered rows and columns with stable ids', () => {
    const { onChangeOptions } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.gridAdd('q1', 'row')));
    expect(onChangeOptions).toHaveBeenLastCalledWith({ ...options, rows: [...options.rows, { id: 'new-id', label: 'Row 3' }] });
    fireEvent.press(screen.getByTestId(testIdFor.gridAdd('q1', 'column')));
    expect(onChangeOptions).toHaveBeenLastCalledWith({ ...options, columns: [...options.columns, { id: 'new-id', label: 'Column 3' }] });
  });

  it('removes a line but never the last one', () => {
    const { onChangeOptions } = setup();
    fireEvent.press(screen.getByTestId(action('row', 'r1', 'remove')));
    expect(onChangeOptions).toHaveBeenLastCalledWith({ ...options, rows: [options.rows[1]] });
    fireEvent.press(screen.getByTestId(action('column', 'c2', 'remove')));
    expect(onChangeOptions).toHaveBeenLastCalledWith({ ...options, columns: [options.columns[0]] });
  });

  it('keeps the last row and column', () => {
    const single: GridOptions = { rows: [options.rows[0]], columns: [options.columns[0]] };
    const { onChangeOptions } = setup({}, single);
    fireEvent.press(screen.getByTestId(action('row', 'r1', 'remove')));
    fireEvent.press(screen.getByTestId(action('column', 'c1', 'remove')));
    expect(onChangeOptions).not.toHaveBeenCalled();
  });

  it('moves lines and ignores moves past the edges', () => {
    const { onChangeOptions } = setup();
    fireEvent.press(screen.getByTestId(action('row', 'r2', 'move-up')));
    expect(onChangeOptions).toHaveBeenLastCalledWith({ ...options, rows: [options.rows[1], options.rows[0]] });
    fireEvent.press(screen.getByTestId(action('column', 'c1', 'move-down')));
    expect(onChangeOptions).toHaveBeenLastCalledWith({ ...options, columns: [options.columns[1], options.columns[0]] });
    onChangeOptions.mockClear();
    fireEvent.press(screen.getByTestId(action('row', 'r1', 'move-up')));
    fireEvent.press(screen.getByTestId(action('column', 'c2', 'move-down')));
    expect(onChangeOptions).not.toHaveBeenCalled();
  });
});

describe('GridEditor settings', () => {
  it('shows the current settings', () => {
    setup({ requireEachRow: true });
    expect(screen.getByTestId(testIdFor.setting('q1', 'each-row')).props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId(testIdFor.setting('q1', 'one-per-column')).props.accessibilityState).toMatchObject({ checked: false });
  });

  it.each([
    ['each-row', 'requireEachRow'],
    ['one-per-column', 'limitOnePerColumn'],
    ['shuffle-rows', 'shuffleRows'],
  ])('toggles %s', (name, key) => {
    const { onChangeSettings } = setup();
    fireEvent(screen.getByTestId(testIdFor.setting('q1', name)), 'valueChange', true);
    expect(onChangeSettings).toHaveBeenCalledWith({ [key]: true });
  });
});
