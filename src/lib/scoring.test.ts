import { describe, expect, it } from 'vitest';
import { calcPoints, pointsLabel } from './scoring';

describe('calcPoints', () => {
  it('returns zero for an exact prediction', () => {
    expect(calcPoints({ score1: 2, score2: 1 }, { actualScore1: 2, actualScore2: 1 })).toBe(0);
  });

  it('adds the absolute error for both teams', () => {
    expect(calcPoints({ score1: 3, score2: 0 }, { actualScore1: 1, actualScore2: 2 })).toBe(4);
  });

  it('does not score unfinished matches', () => {
    expect(calcPoints({ score1: 1, score2: 1 }, {})).toBeNull();
  });
});

describe('pointsLabel', () => {
  it.each([
    [null, ''],
    [0, '🎯 Perfect'],
    [1, '+1 pt'],
    [2, '+2 pts'],
  ])('formats %s points', (points, label) => {
    expect(pointsLabel(points)).toBe(label);
  });
});
