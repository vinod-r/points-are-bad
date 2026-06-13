import { useEffect, useState } from 'react';
import { subscribeLeaderboard } from '../lib/leaderboard';
import type { LeaderboardEntry } from '../lib/leaderboard';
import { useAuth } from '../lib/useAuth';

export function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeLeaderboard((entries) => {
      setRows(entries);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">⏳</p>
        <p className="font-bold text-lg mb-1 text-gray-900">No results yet</p>
        <p className="text-sm text-gray-500">
          Leaderboard updates once matches have final scores.
        </p>
      </div>
    );
  }

  return (
    <div className="px-1 pt-4 pb-2 flex flex-col gap-0.5">
      {rows.map((row, i) => {
        const isMe = row.userId === user?.uid;
        const ptsPerGame = row.matchesScored > 0
          ? (row.totalPoints / row.matchesScored).toFixed(1)
          : '–';

        return (
          <div
            key={row.userId}
            className={`flex items-center rounded-full px-3 ${isMe ? 'bg-yellow-300' : ''}`}
            style={{ minHeight: '44px' }}
          >
            {/* Rank */}
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              <span
                className="font-['Lexend'] font-black text-sm tracking-tight"
                style={{ color: isMe ? '#0A0A0A' : '#CCCCCC' }}
              >
                {i + 1}
              </span>
            </div>

            {/* Name */}
            <span
              className="flex-1 font-['Lexend'] font-bold text-[15px] leading-5 truncate"
              style={{ color: '#0A0A0A' }}
            >
              {row.displayName}
            </span>

            {/* Pts/game badge */}
            <div
              className="w-[72px] flex-shrink-0 flex items-center justify-center rounded px-1 py-0.5"
              style={{ backgroundColor: isMe ? '#D7AF3A' : '#F6F6F6' }}
            >
              <span
                className="font-['Lexend'] font-medium text-xs tracking-tight"
                style={{ color: isMe ? '#0A0A0A' : '#888888' }}
              >
                {ptsPerGame}/game
              </span>
            </div>

            {/* Total pts */}
            <div className="w-[60px] flex-shrink-0 flex items-center justify-end gap-1 pl-2">
              <span
                className="font-['Lexend'] font-normal text-base tracking-tight leading-8"
                style={{ color: '#0A0A0A' }}
              >
                {row.totalPoints}
              </span>
              <span
                className="font-['Lexend'] font-normal text-xs tracking-tight leading-8"
                style={{ color: isMe ? '#7A6201' : '#CCCCCC' }}
              >
                pts
              </span>
            </div>
          </div>
        );
      })}

    </div>
  );
}
