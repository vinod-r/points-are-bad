import type { Match } from '../lib/matches';
import type { Prediction } from '../lib/predictions';

interface Props {
  match: Match;
  myPrediction: Prediction | undefined;
  onClick: () => void;
}

type CardState = 'open' | 'submitted' | 'closed' | 'soon';

function getState(match: Match, pred: Prediction | undefined): CardState {
  const now = new Date();
  const kickoff = match.date;
  const msUntil = kickoff.getTime() - now.getTime();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  if (pred) return 'submitted';
  if (now >= kickoff) return 'closed';
  if (msUntil <= threeDays) return 'open';
  return 'soon';
}

const stateLabel: Record<CardState, string> = {
  open: 'Predict',
  submitted: 'Submitted',
  closed: 'Missed',
  soon: 'Coming soon',
};

const stateDot: Record<CardState, string> = {
  open: 'bg-emerald-400',
  submitted: 'bg-blue-400',
  closed: 'bg-red-400',
  soon: 'bg-slate-400',
};

function formatKickoff(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MatchCard({ match, myPrediction, onClick }: Props) {
  const state = getState(match, myPrediction);
  const clickable = state === 'open' || state === 'submitted';

  return (
    <button
      onClick={clickable ? onClick : undefined}
      className={`w-full text-left rounded-2xl border p-4 transition-all
        ${clickable
          ? 'border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-750 cursor-pointer'
          : 'border-slate-800 bg-slate-900 cursor-default opacity-60'
        }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Group {match.group}
        </span>
        <span className={`flex items-center gap-1.5 text-xs font-medium`}>
          <span className={`w-2 h-2 rounded-full ${stateDot[state]}`} />
          <span className={state === 'open' ? 'text-emerald-400' : state === 'submitted' ? 'text-blue-400' : 'text-slate-400'}>
            {stateLabel[state]}
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-lg font-bold text-white flex-1 text-left leading-tight">
          {match.team1}
        </span>
        {state === 'submitted' && myPrediction ? (
          <span className="text-2xl font-black text-white tabular-nums px-2">
            {myPrediction.score1} – {myPrediction.score2}
          </span>
        ) : (
          <span className="text-sm font-semibold text-slate-500 px-2">vs</span>
        )}
        <span className="text-lg font-bold text-white flex-1 text-right leading-tight">
          {match.team2}
        </span>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {formatKickoff(match.date)} · {match.venue}
      </div>
    </button>
  );
}
