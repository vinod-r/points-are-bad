import { describe, expect, it } from 'vitest';
import type { Match } from './matches';
import type { Prediction } from './predictions';
import { buildDayGroups, getDotStatus, shouldCollapseDay } from './calendar';

function match(id: string, date: string, finished = false): Match {
  return {
    id, team1: 'A', team2: 'B', group: 'A', venue: 'Test', date: new Date(date),
    ...(finished ? { actualScore1: 1, actualScore2: 0 } : {}),
  };
}

describe('buildDayGroups', () => {
  it('groups matches by local calendar day and identifies today', () => {
    const today = new Date(2026, 5, 20, 12);
    const matches = [
      match('one', new Date(2026, 5, 20, 10).toISOString()),
      match('two', new Date(2026, 5, 20, 18).toISOString()),
      match('three', new Date(2026, 5, 21, 10).toISOString()),
    ];

    const groups = buildDayGroups(matches, today);
    expect(groups).toHaveLength(2);
    expect(groups[0].matches).toHaveLength(2);
    expect(groups[0].isToday).toBe(true);
    expect(groups[1].isToday).toBe(false);
  });
});

describe('getDotStatus', () => {
  const now = new Date('2026-06-20T12:00:00Z');

  it('is red when an unpredicted match is actionable', () => {
    expect(getDotStatus([match('one', '2026-06-21T12:00:00Z')], new Map(), now)).toBe('red');
  });

  it('is gray when unpredicted matches are not open yet', () => {
    expect(getDotStatus([match('one', '2026-06-24T12:00:00Z')], new Map(), now)).toBe('gray');
  });

  it('is green when every match is handled', () => {
    const predictions = new Map([['one', {} as Prediction]]);
    expect(getDotStatus([match('one', '2026-06-21T12:00:00Z')], predictions, now)).toBe('green');
  });
});

describe('shouldCollapseDay', () => {
  const now = new Date(2026, 5, 20, 12);

  function groupFor(date: Date, complete: boolean) {
    return buildDayGroups([
      match('one', date.toISOString(), complete),
      match('two', new Date(date.getTime() + 60_000).toISOString(), complete),
    ], now)[0];
  }

  it('collapses completed days older than yesterday', () => {
    expect(shouldCollapseDay(groupFor(new Date(2026, 5, 18, 10), true), now)).toBe(true);
  });

  it('keeps yesterday and today visible', () => {
    expect(shouldCollapseDay(groupFor(new Date(2026, 5, 19, 10), true), now)).toBe(false);
    expect(shouldCollapseDay(groupFor(new Date(2026, 5, 20, 10), true), now)).toBe(false);
  });

  it('keeps incomplete older days visible', () => {
    expect(shouldCollapseDay(groupFor(new Date(2026, 5, 18, 10), false), now)).toBe(false);
  });
});
