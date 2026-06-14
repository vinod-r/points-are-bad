import { useRef } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import type { LeaderboardEntry } from '../lib/leaderboard';

interface Props {
  player: LeaderboardEntry;
  rank: number;
  onClose: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function PlayerProfile({ player, rank, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const ppg = player.matchesScored > 0
    ? (player.totalPoints / player.matchesScored).toFixed(2)
    : '–';
  const winnerPct = player.totalPredicted > 0
    ? Math.round((player.correctWinner / player.totalPredicted) * 100)
    : 0;

  // Radar: each axis is % of total predicted matches
  const total = player.totalPredicted || 1;
  const radarData = [
    { label: '🎯 Perfect', value: Math.round((player.perfect / total) * 100) },
    { label: '+1',          value: Math.round((player.plusOne  / total) * 100) },
    { label: '+2',          value: Math.round((player.plusTwo  / total) * 100) },
    { label: '+3',          value: Math.round((player.plusThree / total) * 100) },
    { label: '4+',          value: Math.round((player.fourPlus / total) * 100) },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              {player.photoURL ? (
                <img src={player.photoURL} alt={player.displayName} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <span className="text-yellow-300 font-black text-lg">
                  {player.displayName[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-gray-900 leading-tight">{player.displayName}</span>
                {rank <= 3 && <span className="text-lg">{MEDALS[rank - 1]}</span>}
              </div>
              <span className="text-xs text-gray-400 font-medium">Rank #{rank}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox label="Total pts" value={String(player.totalPoints)} highlight />
          <StatBox label="Pts / game" value={ppg} />
          <StatBox label="Winner %" value={`${winnerPct}%`} />
        </div>

        {/* Radar chart */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-2 text-center">
            Score distribution
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#EEEEEE" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fontFamily: 'Lexend, sans-serif', fontSize: 12, fontWeight: 600, fill: '#555' }}
              />
              <Radar
                dataKey="value"
                stroke="#F5C842"
                fill="#F5C842"
                fillOpacity={0.35}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Perfect" value={String(player.perfect)} />
          <StatBox label="Predicted" value={`${player.totalPredicted}/${player.matchesScored}`} />
          <StatBox label="Missed" value={String(player.missed)} dim={player.missed > 0} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight, dim }: {
  label: string; value: string; highlight?: boolean; dim?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3 py-3 flex flex-col items-center gap-0.5 ${highlight ? 'bg-yellow-300' : 'bg-gray-50'}`}
    >
      <span
        className="font-black text-2xl leading-tight tracking-tight"
        style={{ color: dim ? '#AAAAAA' : '#0A0A0A' }}
      >
        {value}
      </span>
      <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">{label}</span>
    </div>
  );
}
