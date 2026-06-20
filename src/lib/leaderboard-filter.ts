import type { LeaderboardEntry } from './leaderboard';

const STORAGE_PREFIX = 'points-are-bad:leaderboard-filter';
const STORAGE_VERSION = 1;

interface StoredLeaderboardFilter {
  version: typeof STORAGE_VERSION;
  excludedUserIds: string[];
}

export interface StorageReader {
  getItem(key: string): string | null;
}

export interface StorageWriter {
  setItem(key: string, value: string): void;
}

export function leaderboardFilterStorageKey(viewerId: string): string {
  return `${STORAGE_PREFIX}:${viewerId}`;
}

export function parseExcludedUserIds(value: string | null): Set<string> {
  if (!value) return new Set();

  try {
    const parsed = JSON.parse(value) as Partial<StoredLeaderboardFilter>;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.excludedUserIds)) {
      return new Set();
    }
    return new Set(parsed.excludedUserIds.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function serializeExcludedUserIds(excludedUserIds: ReadonlySet<string>): string {
  const stored: StoredLeaderboardFilter = {
    version: STORAGE_VERSION,
    excludedUserIds: Array.from(excludedUserIds).sort(),
  };
  return JSON.stringify(stored);
}

export function readExcludedUserIds(storage: StorageReader, viewerId: string): Set<string> {
  try {
    return parseExcludedUserIds(storage.getItem(leaderboardFilterStorageKey(viewerId)));
  } catch {
    return new Set();
  }
}

export function writeExcludedUserIds(
  storage: StorageWriter,
  viewerId: string,
  excludedUserIds: ReadonlySet<string>,
): void {
  try {
    storage.setItem(
      leaderboardFilterStorageKey(viewerId),
      serializeExcludedUserIds(excludedUserIds),
    );
  } catch {
    // Filtering still works in memory when browser storage is unavailable.
  }
}

export function toggleExcludedUser(
  excludedUserIds: ReadonlySet<string>,
  userId: string,
): Set<string> {
  const next = new Set(excludedUserIds);
  if (next.has(userId)) next.delete(userId);
  else next.add(userId);
  return next;
}

export function includeAllAvailableUsers(
  excludedUserIds: ReadonlySet<string>,
  entries: Pick<LeaderboardEntry, 'userId'>[],
): Set<string> {
  const next = new Set(excludedUserIds);
  entries.forEach((entry) => next.delete(entry.userId));
  return next;
}

export function excludeAllAvailableUsers(
  excludedUserIds: ReadonlySet<string>,
  entries: Pick<LeaderboardEntry, 'userId'>[],
): Set<string> {
  const next = new Set(excludedUserIds);
  entries.forEach((entry) => next.add(entry.userId));
  return next;
}

export function filterLeaderboardEntries<T extends Pick<LeaderboardEntry, 'userId'>>(
  entries: T[],
  excludedUserIds: ReadonlySet<string>,
): T[] {
  return entries.filter((entry) => !excludedUserIds.has(entry.userId));
}
