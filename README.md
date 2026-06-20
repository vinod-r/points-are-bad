# Points 'R' Bad

A mobile-first World Cup score-prediction app. Lower scores are better: each prediction earns one point for every goal it differs from the final score.

## Stack

- React 19, TypeScript, Vite, and Tailwind CSS
- Firebase Authentication and Cloud Firestore
- Firebase Admin scripts for fixtures, results, and leaderboard aggregation

## Local development

Copy the environment template and add the Firebase web-app configuration:

```bash
cp .env.example .env
npm run dev
```

Enable Google authentication and add `localhost` as an authorized domain in the Firebase console. Deploy `firestore.rules` before using predictions. Never put a Firebase Admin service account in `.env` or commit it.

To seed live fixtures, add `FOOTBALL_DATA_API_KEY` to `.env`, place a downloaded Admin SDK key at `service-account.json`, then run:

```bash
npx tsx --env-file=.env scripts/seed.ts
```

## Quality checks

```bash
npm run check       # lint, unit tests, and production build
npm run test:watch  # tests while developing
```

## Project layout

```text
src/components/   UI components and interaction flows
src/lib/          Firebase data access and domain logic
src/data/         Local fixture data
scripts/          Firebase Admin data jobs
firestore.rules   Firestore authorization rules
```

Scoring and UI state logic should stay in `src/lib` so it can be unit tested. Components should handle rendering and interaction; Firestore reads and writes belong in the existing data-access modules.
