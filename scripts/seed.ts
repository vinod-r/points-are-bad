/**
 * Fetches WC 2026 group-stage fixtures from football-data.org and seeds Firestore.
 * Safe to re-run — uses the API match ID as the document ID so it's idempotent.
 *
 * Setup:
 *   1. service-account.json in project root (Firebase Admin key)
 *   2. FOOTBALL_DATA_API_KEY in .env
 *   3. npx tsx --env-file=.env scripts/seed.ts
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const keyPath = resolve(process.cwd(), 'service-account.json');
if (!existsSync(keyPath)) {
  console.error('Missing service-account.json — download from Firebase console → Project settings → Service accounts');
  process.exit(1);
}

const apiKey = process.env.FOOTBALL_DATA_API_KEY;
if (!apiKey) {
  console.error('Missing FOOTBALL_DATA_API_KEY — add it to .env and run with --env-file=.env');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf-8'))) });
const db = getFirestore();

interface ApiMatch {
  id: number;
  utcDate: string;
  stage: string;
  group: string | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  venue: string | null;
}

async function fetchGroupStageMatches(): Promise<ApiMatch[]> {
  const res = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?stage=GROUP_STAGE',
    { headers: { 'X-Auth-Token': apiKey! } }
  );
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { matches: ApiMatch[] };
  return data.matches;
}

function groupLetter(raw: string | null): string {
  // "GROUP_A" → "A"
  return raw ? raw.replace('GROUP_', '') : '?';
}

async function seed() {
  console.log('Fetching WC 2026 group-stage fixtures from football-data.org...');
  const matches = await fetchGroupStageMatches();
  console.log(`Got ${matches.length} matches — writing to Firestore...`);

  const batch = db.batch();
  for (const m of matches) {
    const ref = db.collection('matches').doc(String(m.id));
    batch.set(ref, {
      team1: m.homeTeam.name,
      team2: m.awayTeam.name,
      group: groupLetter(m.group),
      date: Timestamp.fromDate(new Date(m.utcDate)),
      venue: m.venue ?? '',
    });
  }
  await batch.commit();
  console.log(`Done — ${matches.length} matches written.`);
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
