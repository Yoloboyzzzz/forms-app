import {
  buildAnswerFilePath,
  buildQuestionImagePath,
  checkUpload,
  fileNameOf,
  safeFileName,
} from './uploads';

const MB = 1024 * 1024;
const pdf = { name: 'cv.pdf', mimeType: 'application/pdf', size: 1 * MB };

describe('checkUpload', () => {
  it('accepts a file within the defaults', () => {
    expect(checkUpload(pdf, 0, {})).toBeUndefined();
  });

  it('refuses more files than allowed (one by default)', () => {
    expect(checkUpload(pdf, 1, {})).toBe('tooMany');
    expect(checkUpload(pdf, 4, { maxFiles: 5 })).toBeUndefined();
    expect(checkUpload(pdf, 5, { maxFiles: 5 })).toBe('tooMany');
  });

  it('refuses files above the size limit (10 MB by default)', () => {
    expect(checkUpload({ ...pdf, size: 10 * MB }, 0, {})).toBeUndefined();
    expect(checkUpload({ ...pdf, size: 10 * MB + 1 }, 0, {})).toBe('tooLarge');
    expect(checkUpload({ ...pdf, size: 3 * MB }, 0, { maxFileSizeMb: 2 })).toBe('tooLarge');
  });

  it('accepts a file of unknown size', () => {
    expect(checkUpload({ name: 'a.pdf', mimeType: 'application/pdf' }, 0, {})).toBeUndefined();
  });

  it('accepts any type when none are listed', () => {
    expect(checkUpload(pdf, 0, { allowedTypes: [] })).toBeUndefined();
  });

  it.each([
    ['a mime type', ['application/pdf']],
    ['a wildcard', ['application/*']],
    ['an extension', ['.pdf']],
    ['an extension in capitals', ['.PDF']],
    ['one of several', ['image/*', '.pdf']],
  ])('accepts a matching type given as %s', (_name, allowedTypes) => {
    expect(checkUpload(pdf, 0, { allowedTypes })).toBeUndefined();
  });

  it('refuses other types', () => {
    expect(checkUpload(pdf, 0, { allowedTypes: ['image/*'] })).toBe('wrongType');
    expect(checkUpload(pdf, 0, { allowedTypes: ['.png'] })).toBe('wrongType');
    expect(checkUpload({ name: 'noext', mimeType: undefined }, 0, { allowedTypes: ['.png', 'image/png'] })).toBe('wrongType');
  });

  it('matches extensions of files without a mime type', () => {
    expect(checkUpload({ name: 'Photo.JPG' }, 0, { allowedTypes: ['.jpg'] })).toBeUndefined();
  });

  it('checks the count before the type and the size', () => {
    expect(checkUpload({ ...pdf, size: 99 * MB }, 1, { allowedTypes: ['.png'] })).toBe('tooMany');
    expect(checkUpload({ ...pdf, size: 99 * MB }, 0, { allowedTypes: ['.png'] })).toBe('wrongType');
  });
});

describe('safeFileName', () => {
  it('replaces unsafe characters', () => {
    expect(safeFileName('my résumé (final).pdf')).toBe('my_r_sum_final_.pdf');
    expect(safeFileName('../../etc/passwd')).toBe('.._.._etc_passwd');
  });

  it('never returns an empty name', () => {
    expect(safeFileName('???')).toBe('file');
    expect(safeFileName('')).toBe('file');
  });
});

describe('paths', () => {
  const now = new Date(1700000000000);

  it('puts answer files in the folder of the user', () => {
    expect(buildAnswerFilePath('u1', 's1', 'q1', 'cv.pdf', now)).toBe('u1/s1/q1/1700000000000-cv.pdf');
  });

  it('puts question images in the folder of the form', () => {
    expect(buildQuestionImagePath('f1', 'q1', 'photo.png', now)).toBe('f1/q1/1700000000000-photo.png');
  });

  it('gets the original name back from a stored path', () => {
    expect(fileNameOf('u1/s1/q1/1700000000000-cv.pdf')).toBe('cv.pdf');
    expect(fileNameOf('plain.pdf')).toBe('plain.pdf');
  });
});
