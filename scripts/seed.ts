/**
 * One-time script to seed Firestore with WC2026 group-stage fixtures.
 *
 * Usage (after setting up .env):
 *   npx tsx scripts/seed.ts
 *
 * Requires: npm install -D tsx
 * Requires: .env file with VITE_FIREBASE_* variables
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import fixtures from '../src/data/wc2026-fixtures.json' assert { type: 'json' };

// Load env — run with: node --env-file=.env scripts/seed.ts
// Or set env vars manually before running.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log(`Seeding ${fixtures.length} matches...`);
  for (const f of fixtures) {
    await setDoc(doc(db, 'matches', f.id), {
      team1: f.team1,
      team2: f.team2,
      group: f.group,
      date: Timestamp.fromDate(new Date(f.date)),
      venue: f.venue,
    });
    console.log(`  ✓ ${f.id}: ${f.team1} vs ${f.team2}`);
  }
  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
