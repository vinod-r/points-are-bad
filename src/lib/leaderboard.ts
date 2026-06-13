import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  totalPoints: number;
  matchesScored: number;
}

export function subscribeLeaderboard(cb: (entries: LeaderboardEntry[]) => void) {
  const q = query(collection(db, 'leaderboard'), orderBy('totalPoints', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ userId: d.id, ...d.data() } as LeaderboardEntry)));
  });
}
