import { collection, onSnapshot } from 'firebase/firestore';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from './firebase';

export interface Match {
  id: string;
  team1: string;
  team2: string;
  group: string;
  date: Date;
  venue: string;
  actualScore1?: number;
  actualScore2?: number;
}

function fromSnap(snap: QuerySnapshot<DocumentData>): Match[] {
  return snap.docs
    .map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Match, 'id' | 'date'>),
      date: (d.data().date as { toDate: () => Date }).toDate(),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function subscribeMatches(cb: (matches: Match[]) => void) {
  return onSnapshot(collection(db, 'matches'), (snap) => cb(fromSnap(snap)));
}
