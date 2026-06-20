import type { Match } from './matches';
import type { Prediction } from './predictions';

export type MatchState = 'open' | 'submitted' | 'closed' | 'soon' | 'finished';

const PREDICTION_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function getMatchState(
  match: Match,
  prediction: Prediction | undefined,
  now = new Date(),
): MatchState {
  if (match.actualScore1 != null && match.actualScore2 != null) return 'finished';
  if (prediction) return 'submitted';
  if (now >= match.date) return 'closed';
  if (match.date.getTime() - now.getTime() <= PREDICTION_WINDOW_MS) return 'open';
  return 'soon';
}
