import { describe, expect, it } from 'vitest';
import type { Match } from './matches';
import type { Prediction } from './predictions';
import { getMatchState } from './match-state';

const now = new Date('2026-06-20T12:00:00Z');

function match(date: string, scores?: [number, number]): Match {
  return {
    id: 'match-1', team1: 'A', team2: 'B', group: 'A', venue: 'Test',
    date: new Date(date), actualScore1: scores?.[0], actualScore2: scores?.[1],
  };
}

describe('getMatchState', () => {
  it('marks fully scored matches as finished', () => {
    expect(getMatchState(match('2026-06-19T12:00:00Z', [2, 1]), undefined, now)).toBe('finished');
  });

  it('marks a prediction as submitted before kickoff', () => {
    expect(getMatchState(match('2026-06-21T12:00:00Z'), {} as Prediction, now)).toBe('submitted');
  });

  it('closes unpredicted matches at kickoff', () => {
    expect(getMatchState(match('2026-06-20T12:00:00Z'), undefined, now)).toBe('closed');
  });

  it('opens predictions three days before kickoff', () => {
    expect(getMatchState(match('2026-06-23T12:00:00Z'), undefined, now)).toBe('open');
  });

  it('keeps later matches in the coming-soon state', () => {
    expect(getMatchState(match('2026-06-23T12:00:01Z'), undefined, now)).toBe('soon');
  });
});
