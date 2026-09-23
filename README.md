# Campus2Corporate (C2C)

Career readiness for students, colleges, and faculty. Score a resume with a
transparent ATS engine, close each gap with a quest (course plus mini project
with proof), and track applications through a real pipeline. Works offline,
syncs to Supabase when configured.

## Run it

```powershell
cd app
npm install
npm run dev      # Vite, http://localhost:5173
```

Optional online features need keys (the app works fully offline without them).
Copy `app/.env.example` to `app/.env` and set what you use:

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`: cloud mirror of scores,
  pipeline events, artifacts, feedback. Schema: root `supabase.sql`.
- `VITE_GROQ_KEY`: upgrades Coach replies via the online model.
- `VITE_GEMINI_KEY`: AI question sets and resume rewrite.

Verify a change with all three, inside `app/`:

```powershell
node --test "tests/*.test.js"
npm run build
npm run lint
```

## Where things live

- `app/src/pages/`: one route per screen (`/resume`, `/jobs`, `/quests`,
  `/coach`, `/quiz`, `/interview`, `/portfolio`, `/institute`, `/faculty`,
  `/profile`). Home is `/`.
- `app/src/app/`: router shell plus one context (`store.jsx`) holding
  cross-page state. Everything else reads the pure lib functions directly.
- `app/src/lib/`: pure logic with tests. Scoring (`ats.js`, `score.js`),
  jobs (`store.js`), coach (`coach.js`), dashboard math (`dashboard.js`),
  Supabase mirror (`backend.js`), quests, interview, questionnaire.
- `app/src/data/`: curated seeds plus scraper-generated seeds
  (`naukriSeed.js`, `boardsSeed.js`). Regenerate, never hand-edit.
- `app/src/components/ui.jsx`: the only shared UI primitives.
- `app/scripts/`: terminal scrapers. `npm run scrape` (live boards),
  `npm run jobs:import -- --in=<file>` (naukri JSON),
  `npm run boards -- --gh=stripe --lever=lever --ashby=linear` (ATS boards).
- `app/tests/`: `node:test` suites, one per lib module.

## Project history

The first prototype UI was removed after it served its purpose; it is
preserved on the `prototype-backup` branch. The tested logic layer survived
and the UI was rebuilt from scratch on top of it with React Router.
