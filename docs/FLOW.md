# avsar FLOW — sih26044 edition

> what avsar is, how every role moves through it, and the exact words on every
> screen. voice locked below. no em dashes anywhere.

## 0. what ayushsetu is

sih26044 (ministry of ayush): a portal for academia-industry collaboration
covering skill mapping, internships, and placement.

one breath: ayushsetu is the place where a BAMS student finds out exactly which
skills they lack for the role they want, closes each gap with free material plus a
proof-linked project, and applies to ayush-sector roles through one tracked
pipeline. industry posts roles with skill bars. faculty finds fdps,
fellowships, consultancy, and workshops. institutes watch cohorts move.

live now: student loop end to end, industry posting, faculty board, institute
dashboard, portfolio, resume-aware coach with Hindi tone. ayush portal is the
front door (`/`), tech portal lives at `/tech`. v2: clan seasons, real-time chat
between students, recruiter shortlisting console.

## 0b. routing

- `/` → ayushsetu home (bams student first, ministry banner, live news strip)
- `/tech` → tech portal landing (the original avsar home for non-ayush tracks)
- `/ayush` → full ayush portal (masthead, ticker, quick links, tables, ananya strip)
- `/ayush/roles` → ayush job + internship finder
- `/ayush/colleges` → permitted bams colleges
- `/ayush/assess` → ai assessment for ayush roles
- `/ayush/admin` → admin panel (google sign-in gate, portal health, feed controls)
- `/ayush/news` → live news from ccras + ncism + ministry + google news rss
- ayush-gate: `/` redirects to `/ayush` when role=ayush (app/shell.jsx)

## 1. voice lock

- all lowercase, mono first. headlines may use bricolage bold on section
  headers only. hero headline is always dm mono + `>` + block cursor.
- actions wear brackets: `[score your resume]`. system lines wear `//` and `>`.
- numbers are specific: `ats 0-95`, `2/3 done`, `bar 45`. never
  "streamline", "optimize", "unlock your potential".
- no em dashes. periods and commas do the work.
- statuses: `[live in feed]`, `[SIMULATED]`, `offline_ok`, `ats 72/95`.

## 2. audiences and entries

| who | entry | first screen | north star |
|---|---|---|---|
| student | `/` hero | `[score your resume]` | one honest score, then one quest |
| industry | more → industry | `/industry` | a posted role live in the feed in 30 seconds |
| faculty | more → faculty | `/faculty` | one interesting fdp or consultancy per visit |
| institute | more → institute | `/institute` | cohort bands moving week over week |

identity: no login. every visitor gets `c2c-xxxxxx` (`lib/identity.js`).
localstorage is the source of truth, supabase mirrors when keyed.

## 3. student journey, screen by screen

### 3.1 `/` landing
order: hero (fractal map + `# avsar` + proof line `ats 0-95 · 5 dimensions`)
→ problem strip (`// the gap`, three pains, one shared-language promise)
→ principles trio → proof rows fig 01-04 → season board v2 preview
→ boot cta (`step 1: score → step 2: quest → step 3: track`).
copy bank:
- pill: `free for students · no account needed`
- h1: `> your degree, translated into an offer letter.`
- primary: `[score your resume]`. secondary (text link): `or browse open roles →`
- next step line: `> step 1: score your resume →` (adapts to progress)

### 3.2 `/resume` score
paste or upload resume → ats `x/95` + 5-dimension breakdown + found/missing
chips. empty state: `scores unlock matches`. every point links to a fix:
`add numbers to 2 project bullets`, `name the missing skill`, `move github up`.
exit: `[make it a quest]` → quests, or best-fit track switch via rankroles.

### 3.3 `/quests` close the gap
each missing skill is a course plus a mini project. project ticks need a
proof url or they stay claimed. mastery pips lv0-3 (course + evidence + quiz).
empty without resume routes back to `/resume`. exit: `→ /jobs`.

### 3.4 `/quiz` + `/interview` prove it
quiz: 10 role questions, best score feeds mastery and main. interview: 5 star
questions, local rubric grading, best saved as `c2c-interview-best`.
copy: `warm up: 5 questions, star-graded, no account.`

### 3.5 `/jobs` find and track
one feed: seeds + live boards + industry posts + pasted roles. match chip
`72/100 good match`, eligibility chip `eligible` or `needs 45+`. actions:
save → applied → interview → offer, rejected, dismiss. paste box at the
bottom parses any posting into the feed after confirm.

### 3.6 `/portfolio` show it
verified ticks (github-linked or evidence-backed), journey timeline,
proof-backed projects, kudos, share link `?c2c=your-id`.

### 3.7 coach, everywhere (`?chat=1`)
floating button, all routes. offline answers instantly, ai upgrade when keyed.
hindi tone: toggle `हिंदी`/`EN` in the coach header — preface answers in hindi
for ayush tracks (bams deepen, clinical tips). quick actions: gaps, bullets,
interview tip, career fit, mentor, bams deepen, plus review/match/cover
artifacts and paste-to-add jobs. log persists across reloads. mentorship track:
one workshop, one guest-lecture question, one 2-weekend live brief per gap.

#### bams deepen (ayush-only quick action)

walks the vaidya path: shishiksha orientation (6 days, ncism mandatory) →
rotatory internship (1-6 college hospital, 7-12 phc/rural) → pick a lane
(clinical, ccras research, gmp industry) → close top gap with quest + proof.
hindi version speaks in devanagari. locked for non-ayush tracks.

## 4. industry journey

`/industry`: title + company (minimum), track, type, location, bar
(`minimum resume score`), skills (comma, literal match), apply link, one-line
brief → `[post role]` → live in `/jobs` instantly with eligibility computed
against every student score. `// posted by you` lists everything shipped.
shortlist expander per role ranks applicants by score. framing rule: bars are
public. a student always sees why a role is locked.

## 4b. ayush door (`/`, primary front door)

same engine, ayush track preselected. `/` now serves the ayushsetu home (bams
student first). `/tech` falls back to the original avsar landing. full portal
under `/ayush`.

portal routes (all in `app/src/ayush/`, tech portal untouched):
- `/ayush` home: govt masthead (tricolor, bilingual title), notice ticker + live
  news strip, quick links, stats, rotatory tracker, shishiksha checklist,
  research programs, official-links footer, ananya strip.
- `/ayush/roles`: job + internship finder. search, kind filter, eligible
  toggle, fit-ranked cards with stipend + deadline, apply + track.
  12 live postings: ministry internship, ccras jrf/spark, ptc course,
  hospital + wellness + gmp roles.
- `/ayush/colleges`: 12 permitted bams colleges (ncism 25-26) with seats.
- `/ayush/assess`: ai assessment. paste background → custom quiz +
  interview + evidence questions about your lines (bank fallback offline) →
  graded readout + gaps. sample resumes built in (ananya, rohit, kavya,
  deshmukh).
- `/ayush/admin`: portal health dashboard, google sign-in gate (allowlist via
  VITE_ADMIN_EMAILS), feed refresh controls, applications per posting, feedback.

entry links: hero cta, more → ayush, footer. rollback: delete `app/src/ayush/`
+ `[ayush-door]` lines + remove `ayush:feed` + `ayush:news` scripts.

## 5. faculty journey

`/faculty`: filter all/fdp/faculty-internship/consultancy/workshop. cards show
org, location, deadline, official link, `[mark interested]`. interests persist
locally and mirror to supabase. rule: every card links out. avsar never hosts
the application, it routes intent.

## 6. institute journey

`/institute`: cohort bands (`0-44 / 45-64 / 65+`), per-role counts, average
rating, latest feedback, csv export. numbers move when students act because
assessments and events mirror to the same tables. rule: placement cells read,
never edit, student data here.

## 7. sih26044 coverage map

| ps clause | where it lives |
|---|---|
| skill assessment (questionnaire, tech + soft) | quiz + interview evidence bank + resume ats |
| skill profile + gaps vs industry needs | resume found/missing + rankroles best fit |
| recommends industries, roles, programs | matchjobs + roadmaps + free courses per gap |
| industry posts roles with required skills | `/industry` → feed, eligibility live |
| search, apply, track in one portal | `/jobs` filters + pipeline + events |
| industry learning programs | per-gap courses framed as industry programs |
| faculty internships, fdps, consultancy, research | `/faculty` seeds + interests |
| mentorship, workshops, guest lectures, challenges | coach `[mentorship]` + faculty workshops |
| institution dashboards + analytics | `/institute` bands + csv |
| digital portfolio, verified skills | `/portfolio` ticks + kudos + share link |
| role-based access, 4 roles | login-free c2c id + role tracks (auth post-sih) |

## 8. ppt spine (dean cut: idea + ui prototype)

1. title: sih26044 + one-line promise + team.
2. problem: the three pains from the problem strip, quoted from the ps.
3. solution: the loop (score → quest → prove → match → showcase) + 4 roles.
4. tech: vite + react + tailwind, local-first offline, supabase mirror, groq/gemini coach. architecture sketch.
5. prototype: landing, score with traced fixes, industry post → feed, pipeline, institute bands. screenshots, no mockups.
6. impact + roadmap: placement-cell value, v2 (clans, chat, recruiter console), `nothing on the ps page is a mockup` as the close.

## 9. out of the box, on purpose

- living fractal map hero with `[mono] [harbor] [rainbow]` switch.
- login-free identity. zero friction for judges and students alike.
- scores that show homework: every number traces to a line or a proof link.
- industry posts go live in the same feed students browse. no review queue.
- coach persists its log and opens from any landing link via `?chat=1`.

## 10. trust + win layer (strategy §8 answers)

- google sign-in on `/profile` (`lib/auth.js`). supabase off → guest mode,
  nothing gates. device id `c2c-xxxxxx` stays the primary identity.
- skill passport qr on `/portfolio`: signed credential
  (`lib/verify.js`, offline hash signature), qr image + link to public
  `/verify/:code`, which recomputes the signature in-browser. tampered codes
  fail loudly. readiness header shows `readiness x/100` + assessed vs
  verified split.
- recruiter shortlist on `/industry`: per posted role, applicants ranked by
  score (local device rows + supabase rows when keyed). honest empty state.
- demand heatmap on `/jobs`: top required skills across the live feed with
  have/gap marks. fit explainer card publishes the bands
  (80+ strong, 65+ good, 50+ partial, 35+ weak). no black box, per strategy.

## 11. ananya story (ayush demo script)

> ananya, bams final year, wants clinical research associate (ayush).
> she scores her resume: 44. missing: gcp documentation, pharmacovigilance.
> strong: dravyaguna. quest: shishiksha orientation checklist + hims logbook.
> she applies to the herbal pharma cra internship, fit 87%.
> industry sees her fit breakdown, shortlists. she completes the posting,
> mentor signs off, pharmacovigilance flips to proof. institute bands move.
> dr. rao (faculty) finds the rav cme on the same board.
> one seed story, four roles, zero dead clicks.

run it: `/` (ayushsetu home) → `/resume` (paste bams resume) → `/quests`
(shishiksha branch) → `/jobs` (ayush filter) → apply → `/industry`
(post a gmp role, watch it land) → `/institute` (bands) → `/faculty`
(rav cme interest). coach `?chat=1` for realtime tips, toggle `हिंदी` for
hindi tone.

## 12. ayush rollback (3 steps)

the module is one file plus guarded spreads. to remove it fully:
1. delete `app/src/ayush/` (seed, portal, feed, news, admin, masthead).
2. delete every block marked `[ayush]` in: `lib/score.js`, `data/quests.js`,
   `data/courses.js`, `data/quiz.js`, `data/interview.js`,
   `data/questionnaire.js`, `data/fdps.js`, `pages/Jobs.jsx`.
   delete every `[ayush-door]` line in: `app/shell.jsx` (import, route, nav,
   footer, gate), `components/landing/LandingHero.jsx` (tertiary link).
3. run `node --test "tests/*.test.js"` + `npm run build` in `app/`.
kill switch without deleting: set `AYUSH_ENABLED = false` in ayushSeed.js
(or `VITE_AYUSH=off` in `app/.env`).

## 13. live feed pipeline

`npm run ayush:feed` (`app/scripts/ayush.mjs`): scrapes ccras vacancies +
strict-gated arbeitnow → writes `app/src/ayush/feed.js` (jobs + notices +
date). sources best-effort; total failure keeps the previous file. finder,
ticker, and home stats merge feed automatically. student-relevance gate drops
admin/deputation posts.

`npm run ayush:news` (`scripts/ayush-news.mjs`): scrapes ccras + ncism +
ministry rss + google news → writes `app/src/ayush/news.js`. merged into the
ticker and the live news strip on the ayushsetu home. same best-effort rule.
tests: `node scripts/ayush-news.test.mjs`.
