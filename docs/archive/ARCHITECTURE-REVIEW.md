# Architecture Review — Campus2Corporate (app/)

> Source: `/improve-codebase-architecture` run on 2026-09-04.
> Vocabulary: module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality (from `/codebase-design` skill).

## Context

Single Vite + React + Tailwind v4 build in `app/`. PRD §5 already documents the
intentional shallow structure (one `App.jsx`, thin `lib/` wrappers, no backend).
No `CONTEXT.md`, no ADRs, no tests yet (PRD §6 plans `node --test` post-rebuild).

The review surfaced **5 deepening candidates** ordered by strength. The goal of
this PRD is to make each one explicit and testable.

## Candidate 1 — Extract the college-battle merge into a data adapter

**Strength:** Strong
**Category:** ports & adapters
**Files:** `app/src/data/colleges.js`, `app/src/App.jsx:45-48`

### Problem

The leaderboard's running-average math lives as an inline expression inside
`App.jsx`'s `useMemo` (line 47):

```js
return COLLEGES.map((c) => (c.you
  ? { ...c, avg: Math.round((c.avg * c.members + myScore) / (c.members + 1)), members: c.members + 1 }
  : c)).sort((a, b) => b.avg - a.avg);
```

- `node --test` cannot reach it.
- The `you` flag is a static field on `COLLEGES[2]` (`data/colleges.js:5`), so
  the seed couples to the merge — when Supabase arrives (PRD §5), "which college
  is the user's" becomes a runtime decision.
- The merge shape is invisible at the data module's interface.

### Solution

Move `COLLEGES` and the merge into `data/colleges.js` as an adapter exposing:

- `loadColleges()` → returns seeded list (sync today, `await`-ready for Part 3)
- `recomputeCollegeAvg(rows, userScore, collegeName)` → returns new list with
  the running average merged into the matching row
- Pure functions, no React coupling

### Wins

- **Locality:** merge math lives next to the seed
- **Testable:** `node --test` friendly
- **Seam-ready:** Part 3 swaps seed → Supabase, callers untouched
- **Deletion test:** removing the inline merge concentrates complexity in
  `data/colleges.js`; it doesn't vanish

## Candidate 2 — Sharpen the Gemini seam

**Strength:** Strong
**Category:** ports & adapters
**Files:** `app/src/lib/gemini.js`, `app/src/App.jsx:76-92`

### Problem

Both functions in `lib/gemini.js` repeat the same 8-line shape
(`key → null if missing → try call → null on error`). The module reads
`import.meta.env.VITE_GEMINI_KEY` directly, coupling it to Vite. Each caller
duplicates a fallback string. The model id `"gemini-1.5-flash"` is hard-coded
twice.

### Solution

Collapse to one function:

```js
ask(prompt, ctx) → Promise<string | null>
```

where `ctx` carries the key. Add a `localAdapter` (returns canned text) so tests
run without a key — that's the **second adapter that justifies the seam**.

### Wins

- **Leverage:** one place to change model, retry, timeout
- **Testable:** `localAdapter` lets tests skip the network
- **Decoupled:** key flows in, no `import.meta.env` reach-around
- **Deletion test:** removing the adapter re-spreads 16 lines to callers

## Candidate 3 — Move `INTERVIEW_QS` and `SAMPLE` out of App.jsx

**Strength:** Worth exploring
**Category:** in-process
**Files:** `app/src/App.jsx:8-20`, new `app/src/data/interview.js`,
`app/src/data/fixtures.js`

### Problem

`INTERVIEW_QS` and `SAMPLE` are role-keyed fixtures hidden inside a view module.
PRD §5 line 49 says "Adding a role = one entry per file" — but adding an
interview question for a new role today means editing JSX.

### Solution

Move both to `data/interview.js` and `data/fixtures.js`. Keep `NAV` inline
(view config, not data).

### Wins

- **PRD-aligned:** "one entry per file" rule honoured
- **Testable:** `SAMPLE` reachable from `node --test`
- **Locality:** role data co-located with other role data
- **`App.jsx` shrinks:** ~15 lines of constants removed

## Candidate 4 — `matchJobs` accepts `jobs` as a parameter

**Strength:** Worth exploring
**Category:** in-process
**Files:** `app/src/data/jobs.js:17-25`

### Problem

`matchJobs` closes over `JOBS` at module load. To test with a 2-job fixture
you'd have to monkey-patch the import or fork the module.

### Solution

Add `jobs = JOBS` as a final optional parameter. Tests pass a fixture;
production stays one-line.

### Wins

- **Interface shrinks:** same shape, one new default param
- **Testable:** matches the PRD's planned `node --test` setup
- **Deleting the JOBS import:** complexity concentrates — module becomes a
  pure function over a list

## Candidate 5 — Extract a `parseResumeFile` adapter (speculative)

**Strength:** Speculative
**Category:** ports & adapters
**Files:** `app/src/App.jsx:50-74`

### Problem

The privacy-critical PDF parse is entangled with a React handler that calls
`setText` and mutates `e.target.value`. Tests can't reach it.

### Solution

Extract `parseResumeFile(file)` returning text. Two adapters behind one
interface: `pdfAdapter`, `txtAdapter`. Privacy claim lives in one place.

### Wins

- **Speculative:** only one real adapter today, no second driver
- **But:** PRD anticipates more input types in Part 2/3
- **Privacy:** the "never upload" assertion gets a single home

## Implementation Order

1. **Candidate 4** (1-line default param) — smallest change, unblocks tests
2. **Candidate 3** (move data) — pure relocation
3. **Candidate 1** (colleges adapter) — biggest payoff
4. **Candidate 2** (Gemini seam) — adapter pattern now established
5. **Candidate 5** (PDF adapter) — optional, defer if scope-creep risk

## Verification

After each candidate:

- `npm run build` in `app/` must pass
- No behavior change visible to user
- No new external dependency

End state: `App.jsx` ~50 lines shorter, `data/colleges.js` exposes pure
functions, `lib/gemini.js` collapses to one entry point with two adapters,
fixtures live in `data/`, `matchJobs` accepts a jobs table.
