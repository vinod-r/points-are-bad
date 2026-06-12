/**
 * One-time script to seed Firestore with WC2026 group-stage fixtures.
 *
 * Setup:
 *   1. Firebase console → Project settings → Service accounts → Generate new private key
 *   2. Save the downloaded JSON as service-account.json in the project root
 *   3. npm install -D firebase-admin tsx
 *   4. npx tsx scripts/seed.ts
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import fixtures from '../src/data/wc2026-fixtures.json' assert { type: 'json' };

const keyPath = resolve(process.cwd(), 'service-account.json');

if (!existsSync(keyPath)) {
  console.error('Missing service-account.json in project root.');
  console.error('Download it from: Firebase console → Project settings → Service accounts → Generate new private key');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  console.log(`Seeding ${fixtures.length} matches...`);
  const batch = db.batch();
  for (const f of fixtures) {
    const ref = db.collection('matches').doc(f.id);
    batch.set(ref, {
      team1: f.team1,
      team2: f.team2,
      group: f.group,
      date: Timestamp.fromDate(new Date(f.date)),
      venue: f.venue,
    });
  }
  await batch.commit();
  console.log(`Done — ${fixtures.length} matches written.`);
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
