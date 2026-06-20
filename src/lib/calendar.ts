import type { Match } from './matches';
import type { Prediction } from './predictions';

export interface DayGroup {
  dateKey: string;
  label: string;
  dayLetter: string;
  dayNum: string;
  isToday: boolean;
  matches: Match[];
}

export type DotStatus = 'green' | 'red' | 'gray';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shouldCollapseDay(group: DayGroup, now = new Date()): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isBeforeYesterday = group.dateKey < dateKey(yesterday);
  const isComplete = group.matches.every(
    (match) => match.actualScore1 != null && match.actualScore2 != null,
  );
  return isBeforeYesterday && isComplete;
}

export function getDotStatus(
  matches: Match[],
  predMap: Map<string, Prediction>,
  now = new Date(),
): DotStatus {
  let hasOpen = false;
  let allActionable = true;

  for (const match of matches) {
    if (match.actualScore1 != null) continue;
    if (predMap.has(match.id)) continue;
    if (now >= match.date) continue;

    allActionable = false;
    if (match.date.getTime() - now.getTime() <= THREE_DAYS_MS) hasOpen = true;
  }

  if (allActionable) return 'green';
  return hasOpen ? 'red' : 'gray';
}

export function buildDayGroups(matches: Match[], today = new Date()): DayGroup[] {
  const grouped = new Map<string, Match[]>();
  for (const match of matches) {
    const key = dateKey(match.date);
    const matchesForDay = grouped.get(key) ?? [];
    matchesForDay.push(match);
    grouped.set(key, matchesForDay);
  }

  const todayKey = dateKey(today);
  return Array.from(grouped.entries()).map(([key, dayMatches]) => {
    const date = dayMatches[0].date;
    return {
      dateKey: key,
      label: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      dayLetter: DAY_LETTERS[date.getDay()],
      dayNum: String(date.getDate()),
      isToday: key === todayKey,
      matches: dayMatches,
    };
  });
}
