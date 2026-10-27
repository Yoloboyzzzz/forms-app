import { makeSection } from '@/testUtils/factories';
import { afterActionValue, jumpValue, parseAfterActionValue, parseJumpValue } from './sectionActions';

describe('after this section', () => {
  it('describes each choice as one value', () => {
    expect(afterActionValue(makeSection('s1', 0))).toBe('next');
    expect(afterActionValue(makeSection('s1', 0, { afterAction: 'submit' }))).toBe('submit');
    expect(afterActionValue(makeSection('s1', 0, { afterAction: 'goto', goToSectionId: 's3' }))).toBe('goto:s3');
  });

  it('treats a jump without a target as continuing', () => {
    expect(afterActionValue(makeSection('s1', 0, { afterAction: 'goto' }))).toBe('next');
  });

  it('turns a value back into the fields to save', () => {
    expect(parseAfterActionValue('next')).toEqual({ afterAction: 'next', goToSectionId: undefined });
    expect(parseAfterActionValue('submit')).toEqual({ afterAction: 'submit', goToSectionId: undefined });
    expect(parseAfterActionValue('goto:s3')).toEqual({ afterAction: 'goto', goToSectionId: 's3' });
  });

  it('treats anything unknown as continuing', () => {
    expect(parseAfterActionValue('bogus')).toEqual({ afterAction: 'next', goToSectionId: undefined });
  });
});

describe('option jumps', () => {
  it('maps a stored jump to a value and back', () => {
    expect(jumpValue(undefined)).toBe('continue');
    expect(jumpValue('submit')).toBe('submit');
    expect(jumpValue('s3')).toBe('s3');
    expect(parseJumpValue('continue')).toBeUndefined();
    expect(parseJumpValue('submit')).toBe('submit');
    expect(parseJumpValue('s3')).toBe('s3');
  });
});
