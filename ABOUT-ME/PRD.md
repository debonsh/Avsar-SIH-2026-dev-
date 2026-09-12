# C2C Recall PRD (agent entry point)

Read this file first. It holds every decision from the full design conversation (Sep 2026) so any agent can continue the work without re-asking settled questions.

## 1. Origin

Notebook problem statement (Sep 11): an internship portal with gamification that is not just listings but upskilling plus showcasing. Fourteen bullets, all mapped to code in `C2C-EXAM-PRD.md` §1: profile analysis, skill suggestions, job matching, AI help bot, skill showcase, job search, social, career path, courses, mock interviews, scoring, leaderboard, unique-ID login, cool showcase.

## 2. Vision (founder)

One roof for careers: LinkedIn-like connecting, Naukri-like listings, AI help, freebies plus notifications, resume gap review with ATS repair, XP plus leaderboard plus clans, verified portfolio (certs, GitHub, LeetCode as grind-worthy badges), auto roadmaps with todos, mock interviews and tests, post-certification skill tests awarding showcaseable badges, customizable portfolio, simple Discord-like clan chat (mutual clans and badges visible, no follower counts), company squad-hire. Many apps under one roof, made easy.

## 3. Interpretation (settled)

The roof is phase three. The hackathon wedge is one closed loop for one user with zero other users: diagnose, fix free, prove, unlock, showcase. Trust currency is MAIN plus badges plus evidence links. Social (clans, chat, seasons) and marketplace (squad-hire) hang off verified proof, so proof ships first.

## 4. Settled decisions (do not re-ask)

- Single-player first; social waits for density.
- Clan-vs-clan seasons; global solo ladder never ships.
- XP ledger 60 proof / 25 tests / 15 consistency; verified actions only; caps and cooldowns in code (`BUILD-SPEC.md` numbers).
- No chat in v1; clan channels in v2 behind moderation minimum (blocklist, reporting, rate limits); DMs last if ever.
- Badges auto-graded with pass bars, question banks, retake cooldowns.
- Squad-hire over job-board clone; one simulated squad card for the demo.
- Demo centerpiece: founder problem story ending on interrogation plus rank-up; ranking depth later.
- Anti-cheat ships both checks: GitHub-handle ownership match plus AI project interrogation, plus public revoke flag.
- Friend model follows Discord: badges and mutual clans visible, no follower counts (post-hackathon).
- Simulated season board plus squad card ship, always labeled SIMULATED.
- No tier-2/3 labels anywhere; plain language (students, freshers, recruiters).

## 5. Built reality

Vite plus React 19 plus Tailwind v4, no backend in build 1, localStorage under `c2c-*` keys, Supabase plus Gemini 1.5 Flash as best-effort adapters with local fallbacks. ATS 0 to 95 (`app/src/lib/score.js`), MAIN tech 0.5/0.3/0.2 and non-tech 0.6/0.3/0.1 (`score.js:31-36`), proof is quest pairs times 20 capped at 100 (`scores.js`), ranks Bronze to Diamond gate jobs. Four tracks (sde, data, marketing, govt), four app roles, 35 seed jobs plus live feed, quiz banks (20 per track), quest trees, `roadmapGenerator.js`, voice interviews, shareable portfolio, kudos, private battle. Build passes, 48/48 tests green (`node --test "tests/*.test.js"`), oxlint 2 warnings. `App.jsx` is 978 lines, first extraction candidate.

## 6. Criticisms accepted plus fixes

Scope sprawl: phase gates, honest coming-soon panels. Empty-room social: zero-user test, unlock conditions. Solo ladder toxicity: clan seasons. XP inflation: ledger with caps. Badge value: auto-graded difficulty. Chat liability: deferred with moderation spec. Squad-hire lead: demo card. Freebie rot: curated digest, partnerships. LinkedIn cloning: verified layer only. Roadmap duplication: extend `c2c-progress-v1`, never rebuild.

## 7. Loop assessment (unsweetened)

Loop is good but has three cracks. ATS measures vocabulary, not ability (keyword stuffing inflates; interrogation plus proof compensate; quiz banks must grow via cached AI generation). Unlock needs inventory we do not own (one pilot partner accepting MAIN beats a hundred features). MAIN is play money until an outsider honors it (share links first, pilot second, squads third). Verification versus friction is the permanent tension: interrogation gates badges only, never browsing.

## 8. Competition (researched)

Peerlist and Fueler own proof-of-work profiles. HackerRank, HackerEarth, iMocha own testing and proctoring. Turing sells vetted teams top-down. Internshala owns fresher listings plus paid trainings plus AI mock interviews. Unclaimed: the free closed loop for students, project interrogation as attestation, public revocation, bottom-up hireable squads, one portable skill fingerprint. Viva line: Internshala tells you what is open, HackerRank tests you for employers, Peerlist shows your work; nothing diagnoses, fixes free, proves, and unlocks in one loop.

## 9. Scope

IN: XP ledger (`lib/xp.js`), evidence ownership gate (`progress.js`), interrogation (`coach.js` plus fallback), revoke flag (`identity.js` plus portfolio render), simulated season board, simulated squad card, todos from roadmap, digest shelf from `courses.js`. OUT: DMs and chat UI, global ladder, scraped feeds, extra profile fields, human review, Supabase writes, follower counts. Full numbers, files, demo script, and acceptance criteria live in `../BUILD-SPEC.md`.

## 10. Demo script (3 minutes)

0:00 personal problem, one sentence. 0:20 upload resume, ATS plus gaps. 0:50 roadmap plus todo. 1:20 interrogation live, badge unlocks, rank jumps. 2:00 jobs unlock, squad card. 2:30 simulated season, labeled. 2:50 close: wedge today, clans with moderation next, squads after density. Pre-fill everything, record a backup, name the model plus how it is checked, map one beat per rubric criterion.

## 11. Research fuel

Skills-based hiring: 85 percent of employers use it, 76 percent use skills tests, resumes falling (TestGorilla 2025); entry-level hiring nearly flat at plus 7 percent versus plus 19 percent senior (HackerRank 2025). Gamification: leagues plus 25 percent completion with small even matched pools and weekly resets; streaks moved next-day retention 12 to 55 percent; friend streaks plus 22 percent daily completion; milestones must pay real value plus shareable artifacts. AI assessments: 91-class field study finds generated questions comparable to experts with a generate-judge-refine loop plus distractor QA; cache approved banks, never generate live on stage.

## 12. Open items

Clan data model plus channel moderation spec. Exact XP numbers per action (tune by playtest). Badge tier bands. Freebie partnership sources. Demo wording (founder story). One pilot partner accepting MAIN (highest leverage real-world task).

## 13. File map

`ABOUT-ME/index.html`: founder vision page. `ABOUT-ME/PRD.md`: this file. `../C2C-EXAM-PRD.md`: exam PRD plus code guide. `../BUILD-SPEC.md`: technical build spec. `../teach/lessons/0002-main-score-by-hand.html`: one-page explainer. `../teach/`: mission, resources, notes, briefing lesson, learning records.
