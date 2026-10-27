import { ServiceError } from './errors';
import {
  deleteFiles,
  getSignedUrl,
  getSignedUrls,
  uploadAnswerFile,
  uploadQuestionImage,
} from './storageService';

const mockBucket = {
  upload: jest.fn(),
  remove: jest.fn(),
  createSignedUrl: jest.fn(),
  createSignedUrls: jest.fn(),
};
const mockFrom = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the consts above are initialised.
jest.mock('@/services/supabase/client', () => ({
  supabase: { storage: { from: (bucket: string) => mockFrom(bucket) } },
}));

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ServiceError ? error.code : 'not-a-service-error';
  }
}

const blob = new Blob(['hello'], { type: 'text/plain' });
const webFile = { uri: 'blob:x', name: 'My File.txt', mimeType: 'text/plain', file: blob };

beforeEach(() => {
  jest.resetAllMocks();
  mockFrom.mockReturnValue(mockBucket);
  jest.useFakeTimers().setSystemTime(new Date(1700000000000));
});

afterEach(() => jest.useRealTimers());

describe('uploadAnswerFile', () => {
  it('uploads the browser file into the folder of the user and returns the path', async () => {
    mockBucket.upload.mockResolvedValue({ error: null });

    const path = await uploadAnswerFile('u1', 's1', 'q1', webFile);

    expect(path).toBe('u1/s1/q1/1700000000000-My_File.txt');
    expect(mockFrom).toHaveBeenCalledWith('form-uploads');
    expect(mockBucket.upload).toHaveBeenCalledWith(path, blob, { contentType: 'text/plain', upsert: false });
  });

  it('reads a device file from its uri', async () => {
    mockBucket.upload.mockResolvedValue({ error: null });
    const content = new Blob(['x']);
    const fetchMock = jest.fn().mockResolvedValue({ blob: async () => content });
    const originalFetch = global.fetch;
    global.fetch = fetchMock;

    await uploadAnswerFile('u1', 's1', 'q1', { uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf' });

    global.fetch = originalFetch;
    expect(fetchMock).toHaveBeenCalledWith('file:///a.pdf');
    expect(mockBucket.upload.mock.calls[0][1]).toBe(content);
  });

  it('maps storage errors', async () => {
    mockBucket.upload.mockResolvedValue({ error: { message: 'Failed to fetch' } });
    expect(await codeOf(uploadAnswerFile('u1', 's1', 'q1', webFile))).toBe('network');
  });
});

describe('uploadQuestionImage', () => {
  it('uploads into the media bucket under the form', async () => {
    mockBucket.upload.mockResolvedValue({ error: null });
    const path = await uploadQuestionImage('f1', 'q1', webFile);
    expect(path).toBe('f1/q1/1700000000000-My_File.txt');
    expect(mockFrom).toHaveBeenCalledWith('form-media');
  });
});

describe('deleteFiles', () => {
  it('removes the given paths', async () => {
    mockBucket.remove.mockResolvedValue({ error: null });
    await deleteFiles('form-uploads', ['a', 'b']);
    expect(mockBucket.remove).toHaveBeenCalledWith(['a', 'b']);
  });

  it('does nothing for an empty list', async () => {
    await deleteFiles('form-uploads', []);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('maps errors', async () => {
    mockBucket.remove.mockResolvedValue({ error: { statusCode: '403', message: 'x', status: 403 } });
    expect(await codeOf(deleteFiles('form-media', ['a']))).toBe('forbidden');
  });
});

describe('getSignedUrl', () => {
  it('returns a temporary link', async () => {
    mockBucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://x/y?token=1' }, error: null });
    await expect(getSignedUrl('form-uploads', 'a/b.pdf')).resolves.toBe('https://x/y?token=1');
    expect(mockBucket.createSignedUrl).toHaveBeenCalledWith('a/b.pdf', 3600);
  });

  it('reports a file that cannot be read', async () => {
    mockBucket.createSignedUrl.mockResolvedValue({ data: null, error: null });
    expect(await codeOf(getSignedUrl('form-uploads', 'a'))).toBe('notFound');
  });

  it('maps errors', async () => {
    mockBucket.createSignedUrl.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    expect(await codeOf(getSignedUrl('form-uploads', 'a'))).toBe('network');
  });
});

describe('getSignedUrls', () => {
  it('returns links by path and leaves out the ones that failed', async () => {
    mockBucket.createSignedUrls.mockResolvedValue({
      data: [
        { path: 'a', signedUrl: 'https://x/a', error: null },
        { path: 'b', signedUrl: '', error: 'Object not found' },
        { path: null, signedUrl: 'https://x/c', error: null },
      ],
      error: null,
    });
    await expect(getSignedUrls('form-media', ['a', 'b', 'c'])).resolves.toEqual({ a: 'https://x/a' });
  });

  it('does nothing for an empty list and handles no data', async () => {
    await expect(getSignedUrls('form-media', [])).resolves.toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
    mockBucket.createSignedUrls.mockResolvedValue({ data: null, error: null });
    await expect(getSignedUrls('form-media', ['a'])).resolves.toEqual({});
  });

  it('maps errors', async () => {
    mockBucket.createSignedUrls.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    expect(await codeOf(getSignedUrls('form-media', ['a']))).toBe('network');
  });
});
