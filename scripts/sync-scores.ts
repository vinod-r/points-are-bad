/**
 * Syncs actual scores for finished WC 2026 group-stage matches into Firestore,
 * then recomputes the leaderboard aggregates (totalPoints, matchesScored per user).
 *
 * Run manually:  npx tsx --env-file=.env scripts/sync-scores.ts
 * In CI:         uses FIREBASE_SERVICE_ACCOUNT secret (base64-encoded JSON)
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Support both local (service-account.json) and CI (FIREBASE_SERVICE_ACCOUNT env var)
let serviceAccount: object;
const localKey = resolve(process.cwd(), 'service-account.json');
const envKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (envKey) {
  const decoded = Buffer.from(envKey, 'base64').toString('utf-8');
  const tmpPath = resolve(process.cwd(), '.tmp-service-account.json');
  writeFileSync(tmpPath, decoded);
  serviceAccount = JSON.parse(decoded);
} else if (existsSync(localKey)) {
  serviceAccount = JSON.parse(readFileSync(localKey, 'utf-8'));
} else {
  console.error('No service account found. Set FIREBASE_SERVICE_ACCOUNT env var or place service-account.json in project root.');
  process.exit(1);
}

const apiKey = process.env.FOOTBALL_DATA_API_KEY;
if (!apiKey) {
  console.error('Missing FOOTBALL_DATA_API_KEY');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
const db = getFirestore();

interface ApiMatch {
  id: number;
  status: string;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

async function fetchFinishedMatches(): Promise<ApiMatch[]> {
  const res = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?stage=GROUP_STAGE&status=FINISHED',
    { headers: { 'X-Auth-Token': apiKey! } }
  );
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { matches: ApiMatch[] };
  return data.matches;
}

async function recomputeLeaderboard(finishedMatchIds: Set<string>, scoreMap: Map<string, { home: number; away: number }>) {
  console.log('Recomputing leaderboard...');

  // Fetch all predictions for finished matches
  const predsSnap = await db.collection('predictions').get();

  // Aggregate per user
  const userTotals = new Map<string, {
    displayName: string;
    photoURL: string;
    totalPoints: number;
    matchesScored: number;
  }>();

  for (const doc of predsSnap.docs) {
    const pred = doc.data();
    if (!finishedMatchIds.has(pred.matchId)) continue;

    const score = scoreMap.get(pred.matchId);
    if (!score) continue;

    const pts = Math.abs(pred.score1 - score.home) + Math.abs(pred.score2 - score.away);

    const existing = userTotals.get(pred.userId);
    if (existing) {
      existing.totalPoints += pts;
      existing.matchesScored += 1;
    } else {
      userTotals.set(pred.userId, {
        displayName: pred.userName ?? 'Anonymous',
        photoURL: pred.userPhoto ?? '',
        totalPoints: pts,
        matchesScored: 1,
      });
    }
  }

  // Write leaderboard documents
  const batch = db.batch();
  for (const [userId, data] of userTotals) {
    const ref = db.collection('leaderboard').doc(userId);
    batch.set(ref, { ...data, updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  console.log(`Leaderboard updated for ${userTotals.size} users.`);
}

async function syncScores() {
  console.log('Fetching finished group-stage matches...');
  const finished = await fetchFinishedMatches();
  console.log(`Found ${finished.length} finished matches.`);

  if (finished.length === 0) {
    console.log('Nothing to update.');
    process.exit(0);
  }

  // Build score map keyed by Firestore match ID (string)
  const scoreMap = new Map<string, { home: number; away: number }>();
  const batch = db.batch();
  let updated = 0;

  for (const m of finished) {
    const { home, away } = m.score.fullTime;
    if (home === null || away === null) continue;

    const matchId = String(m.id);
    scoreMap.set(matchId, { home, away });

    const ref = db.collection('matches').doc(matchId);
    batch.update(ref, { actualScore1: home, actualScore2: away });
    updated++;
  }

  if (updated > 0) {
    await batch.commit();
    console.log(`Updated scores for ${updated} matches.`);
  } else {
    console.log('No score changes to write.');
  }

  // Recompute leaderboard using the finished match IDs + scores
  await recomputeLeaderboard(new Set(scoreMap.keys()), scoreMap);

  process.exit(0);
}

syncScores().catch((err) => { console.error(err); process.exit(1); });
