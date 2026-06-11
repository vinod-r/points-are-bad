import {
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  score1: number;
  score2: number;
  submittedAt: Date | null;
  userName: string;
  userPhoto: string;
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }
  return null;
}

export async function submitPrediction(
  userId: string,
  matchId: string,
  score1: number,
  score2: number,
  userName: string,
  userPhoto: string
) {
  await setDoc(doc(db, 'predictions', `${userId}_${matchId}`), {
    userId,
    matchId,
    score1,
    score2,
    userName,
    userPhoto,
    submittedAt: serverTimestamp(),
  });
}

export function subscribeUserPredictions(
  userId: string,
  cb: (preds: Prediction[]) => void
) {
  const q = query(collection(db, 'predictions'), where('userId', '==', userId));
  return onSnapshot(q, (snap) =>
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Prediction, 'id' | 'submittedAt'>),
        submittedAt: toDate(d.data().submittedAt),
      }))
    )
  );
}

export function subscribeMatchPredictions(
  matchId: string,
  cb: (preds: Prediction[]) => void
) {
  const q = query(collection(db, 'predictions'), where('matchId', '==', matchId));
  return onSnapshot(q, (snap) =>
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Prediction, 'id' | 'submittedAt'>),
        submittedAt: toDate(d.data().submittedAt),
      }))
    )
  );
}
