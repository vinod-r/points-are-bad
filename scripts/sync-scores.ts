/**
 * Syncs actual scores for finished WC 2026 group-stage matches into Firestore.
 * Safe to run repeatedly — only updates documents where the match is FINISHED
 * and the score has changed or wasn't set yet.
 *
 * Run manually:  npx tsx --env-file=.env scripts/sync-scores.ts
 * In CI:         uses FIREBASE_SERVICE_ACCOUNT secret (base64-encoded JSON)
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

async function syncScores() {
  console.log('Fetching finished group-stage matches...');
  const finished = await fetchFinishedMatches();
  console.log(`Found ${finished.length} finished matches.`);

  if (finished.length === 0) {
    console.log('Nothing to update.');
    process.exit(0);
  }

  const batch = db.batch();
  let updated = 0;

  for (const m of finished) {
    const { home, away } = m.score.fullTime;
    if (home === null || away === null) continue;

    const ref = db.collection('matches').doc(String(m.id));
    batch.update(ref, { actualScore1: home, actualScore2: away });
    updated++;
  }

  if (updated > 0) {
    await batch.commit();
    console.log(`Updated scores for ${updated} matches.`);
  } else {
    console.log('No score changes to write.');
  }
  process.exit(0);
}

syncScores().catch((err) => { console.error(err); process.exit(1); });
