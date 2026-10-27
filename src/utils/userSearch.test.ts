import type { Profile } from '@/types/models';
import { filterUsers } from './userSearch';

function user(id: string, fullName: string, email: string): Profile {
  return { id, fullName, email, role: 'user', mustChangePassword: false, createdAt: new Date(0), updatedAt: new Date(0) };
}

const users = [user('1', 'Ann Peeters', 'ann@example.com'), user('2', 'Bob Janssens', 'bob.j@work.be')];

describe('filterUsers', () => {
  it('keeps everyone for an empty query, without changing the original list', () => {
    const result = filterUsers(users, '  ');
    expect(result).toEqual(users);
    expect(result).not.toBe(users);
  });

  it('matches names ignoring case', () => {
    expect(filterUsers(users, 'PEET').map((item) => item.id)).toEqual(['1']);
  });

  it('matches emails', () => {
    expect(filterUsers(users, 'work.be').map((item) => item.id)).toEqual(['2']);
  });

  it('returns nothing when nobody matches', () => {
    expect(filterUsers(users, 'zzz')).toEqual([]);
  });
});
