import { describe, expect, it } from 'vitest';
import {
  excludeAllAvailableUsers,
  filterLeaderboardEntries,
  includeAllAvailableUsers,
  leaderboardFilterStorageKey,
  parseExcludedUserIds,
  readExcludedUserIds,
  serializeExcludedUserIds,
  toggleExcludedUser,
  writeExcludedUserIds,
} from './leaderboard-filter';

const entries = [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }];

describe('leaderboard filter persistence', () => {
  it('uses a separate key for each viewer', () => {
    expect(leaderboardFilterStorageKey('one')).not.toBe(leaderboardFilterStorageKey('two'));
  });

  it('round-trips a stable versioned record', () => {
    const serialized = serializeExcludedUserIds(new Set(['b', 'a']));
    expect(serialized).toBe('{"version":1,"excludedUserIds":["a","b"]}');
    expect(parseExcludedUserIds(serialized)).toEqual(new Set(['a', 'b']));
  });

  it.each([null, '', 'bad json', '{}', '{"version":2,"excludedUserIds":["a"]}']) (
    'falls back safely for invalid value %s',
    (value) => expect(parseExcludedUserIds(value)).toEqual(new Set()),
  );

  it('handles unavailable browser storage', () => {
    const unavailable = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    expect(readExcludedUserIds(unavailable, 'viewer')).toEqual(new Set());
    expect(() => writeExcludedUserIds(unavailable, 'viewer', new Set(['a']))).not.toThrow();
  });
});

describe('leaderboard filter operations', () => {
  it('toggles individual users without mutating the source set', () => {
    const original = new Set(['a']);
    expect(toggleExcludedUser(original, 'a')).toEqual(new Set());
    expect(toggleExcludedUser(original, 'b')).toEqual(new Set(['a', 'b']));
    expect(original).toEqual(new Set(['a']));
  });

  it('filters entries while preserving their ranked order', () => {
    expect(filterLeaderboardEntries(entries, new Set(['b']))).toEqual([
      { userId: 'a' }, { userId: 'c' },
    ]);
  });

  it('selects or clears all available users while retaining stale exclusions', () => {
    const exclusions = new Set(['b', 'absent']);
    expect(includeAllAvailableUsers(exclusions, entries)).toEqual(new Set(['absent']));
    expect(excludeAllAvailableUsers(exclusions, entries)).toEqual(
      new Set(['a', 'b', 'c', 'absent']),
    );
  });

  it('selects newly added users by default', () => {
    const filtered = filterLeaderboardEntries([...entries, { userId: 'new' }], new Set(['b']));
    expect(filtered.map((entry) => entry.userId)).toEqual(['a', 'c', 'new']);
  });
});
