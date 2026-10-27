import { parseTimeAnswer, timePlaceholder } from './timeAnswer';

describe('timePlaceholder', () => {
  it('shows the expected pattern', () => {
    expect(timePlaceholder(false)).toBe('HH:mm');
    expect(timePlaceholder(true)).toBe('HH:mm:ss');
  });
});

describe('parseTimeAnswer: time of day', () => {
  it('reads and normalises a time', () => {
    expect(parseTimeAnswer('14:30', false)).toEqual({ status: 'ok', value: '14:30' });
    expect(parseTimeAnswer(' 9:05 ', false)).toEqual({ status: 'ok', value: '09:05' });
    expect(parseTimeAnswer('00:00', false)).toEqual({ status: 'ok', value: '00:00' });
    expect(parseTimeAnswer('23:59', false)).toEqual({ status: 'ok', value: '23:59' });
  });

  it('treats blank text as empty', () => {
    expect(parseTimeAnswer('  ', false)).toEqual({ status: 'empty' });
  });

  it.each(['24:00', '12:60', '12', '12:5', '1:2:3', 'noon', '12:30:00'])('rejects %s', (text) => {
    expect(parseTimeAnswer(text, false)).toEqual({ status: 'invalid' });
  });
});

describe('parseTimeAnswer: duration', () => {
  it('reads and normalises a duration', () => {
    expect(parseTimeAnswer('01:15:00', true)).toEqual({ status: 'ok', value: '01:15:00' });
    expect(parseTimeAnswer('1:15:30', true)).toEqual({ status: 'ok', value: '01:15:30' });
    expect(parseTimeAnswer('100:00:00', true)).toEqual({ status: 'ok', value: '100:00:00' });
  });

  it('treats blank text as empty', () => {
    expect(parseTimeAnswer('', true)).toEqual({ status: 'empty' });
  });

  it.each(['01:15', '01:60:00', '01:15:60', '1000:00:00', 'abc'])('rejects %s', (text) => {
    expect(parseTimeAnswer(text, true)).toEqual({ status: 'invalid' });
  });
});
