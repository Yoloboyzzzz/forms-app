import { routes } from '@/constants/routes';
import { testIdFor, testIds } from '@/constants/testIds';

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

describe('testIds', () => {
  it('are unique kebab-case strings', () => {
    const ids = collectStrings(testIds);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it('derives dynamic ids from record ids', () => {
    expect(testIdFor.formCard('f1')).toBe('form-card-f1');
    expect(testIdFor.questionInput('q1')).toBe('question-q1-input');
    expect(testIdFor.questionOption('q1', 'o1')).toBe('question-q1-option-o1');
    expect(testIdFor.assignmentCard('a1')).toBe('assignment-card-a1');
    expect(testIdFor.userListItem('u1')).toBe('user-list-item-u1');
    expect(testIdFor.languageOption('nl')).toBe('language-option-nl');
  });
});

describe('routes', () => {
  it('builds routes from ids', () => {
    expect(routes.admin.formEdit('f1')).toBe('/admin/forms/f1/edit');
    expect(routes.admin.formSettings('f1')).toBe('/admin/forms/f1/settings');
    expect(routes.admin.formPreview('f1')).toBe('/admin/forms/f1/preview');
    expect(routes.admin.formAssign('f1')).toBe('/admin/forms/f1/assign');
    expect(routes.admin.formResponses('f1')).toBe('/admin/forms/f1/responses');
    expect(routes.admin.submission('s1')).toBe('/admin/submissions/s1');
    expect(routes.user.fill('a1')).toBe('/user/forms/a1');
    expect(routes.user.done('a1')).toBe('/user/forms/a1/done');
  });
});
