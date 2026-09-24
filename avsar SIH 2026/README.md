# Avsar

Two portals, one build: Vaidya (BAMS / ayurveda) and Tech. Pick a side at `/`
and the app takes on its own theme, nav, seeds, scoring rubric, and question
bank. Vite plus React plus React Router plus Tailwind v4, no chart or animation
libraries (charts are dependency-free SVG).

## The five pillars

Each one runs for both portals. The symmetry is a contract, and
`tests/lanes.test.js` fails the build when one side falls behind.

- **Market pulse** (`/market`, `src/lib/market.js`). The bundled and live corpus
  computes a per-skill demand index that reweights the required skills of every
  posting, so the fit score moves with the market instead of a static rubric.
  The published `MATCH_WEIGHTS` formula is untouched; the market term is a
  visible, togglable adjustment with the delta shown. Pure modules take an
  injected `now` so every figure is reproducible.
- **Career GPS** (`/gps`, `src/lib/careerGps.js`). Breadth-first search over the
  taxonomy's `related[]` edges from what a student holds to a target role,
  ordered by postings opened per hop. A step only claims an unlock if re-scoring
  the posting with that skill added actually clears its own `minScore`, using the
  same engine the feed uses. Effort is course hours from a named provider, never
  a calendar promise.
- **Proof of skill** (`/challenges`, `/shortlist`, `src/lib/challenges.js`). Small
  challenges with the rubric printed before the candidate starts, graded by stated
  rules rather than a model, signed per submission (`src/lib/sign.js`), and
  screened blind. A reveal is refused until a decision is on the audit record.
- **District thermometer** (`/institute`, `src/lib/district.js`). Unmet local
  demand and a batch plan, exported only as k-anonymous counts. Suppression is
  visible and its size is published, so a withheld bucket cannot read as a zero.
  Figures never mix lanes.
- **`/labs`** is the public pitch: the comparison, a ninety second path, and four
  working widgets that run the real modules on real bundled data.

Every figure in those pillars prints the sample it came from. Postings that
declare no skills are excluded from the demand share and counted separately,
because a posting cannot answer a question it never addresses.

## Commands (run inside `app/`)

- `npm run dev`: local server.
- `node --test "tests/*.test.js"`: unit suites for `src/lib` and `src/data`.
- `npm run build`: production build, must stay clean.
- `npm run lint`: oxlint, must stay clean.
- `npm run verify:routes`: builds, serves, and renders every student route in both
  lanes and all three desks in a real browser. Fails on a blank render, a
  same-origin console error, or a headline number that disagrees with its own prose.
- `npm run scrape`: live job boards to the terminal.
- `npm run jobs:import -- --in=<file>`: naukri scraper JSON into `src/data/naukriSeed.js`.
- `npm run boards -- --gh=stripe --ashby=linear`: ATS boards into `src/data/boardsSeed.js`.

## Conventions

- Pages stay thin: cross-page state lives in `src/app/store.jsx`, logic lives
  in tested `src/lib` functions, shared visuals live in
  `src/components/ui.jsx`. No page-local copies of scoring or matching math.
- LocalStorage is the source of truth, Supabase (`src/lib/backend.js`) is a
  best-effort mirror. Every screen works with no keys configured.
- Charts are dependency-free SVG: geometry in the tested `src/lib/charts.js`,
  rendering in `src/components/charts.jsx`.
- Where a claim has a limit, say it in the UI: the signing mode is printed on
  every receipt, a blind handle is called a pseudonym rather than anonymity, and
  an evidence link is flagged as potentially identifying its author.
- UI copy has no em dashes and no emoji. Every button does something real.
# avsar-deploy
# avsar-deploy
