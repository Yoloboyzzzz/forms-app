import * as DocumentPicker from 'expo-document-picker';
import { usePickFiles } from '@/hooks/usePickFiles';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

const pick = usePickFiles();

beforeEach(() => jest.resetAllMocks());

describe('usePickFiles', () => {
  it('returns the chosen files', async () => {
    const file = new Blob(['x']);
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf', size: 12, file: file as File, lastModified: 0 }],
    });

    await expect(pick()).resolves.toEqual([{ uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf', size: 12, file }]);
  });

  it('returns nothing when the picker was cancelled', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: true, assets: null });
    await expect(pick()).resolves.toEqual([]);
  });

  it('allows everything by default and one file at a time', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: true, assets: null });
    await pick();
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({ type: '*/*', multiple: false, copyToCacheDirectory: true });
  });

  it('passes mime types to the picker and leaves extensions for the check afterwards', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: true, assets: null });
    await pick({ types: ['image/*', '.pdf'], multiple: true });
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({ type: ['image/*'], multiple: true, copyToCacheDirectory: true });
  });

  it('allows everything when only extensions are listed', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: true, assets: null });
    await pick({ types: ['.pdf'] });
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith(expect.objectContaining({ type: '*/*' }));
  });
});
