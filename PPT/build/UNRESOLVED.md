# Avsar SIH 2026 deck — what's done, and what's left

**File:** `PPT/AVSAR_SIH2026_Zencoderss_6slide.pptx` (4.9 MB)
**Also at:** `PPT/build/AVSAR_SIH2026_Zencoderss_6slide.pptx` (the build output)

Six slides, official section order, template chrome matched to your own deck:

1. `SMART INDIA HACKATHON 2026` — portal fields in your `Label:- Value` format
2. `IDEA TITLE` — one-liner, features, uniqueness, architecture diagram, match weights
3. `TECHNICAL APPROACH` — stack, 8-step pipeline, six live screenshots
4. `FEASIBILITY AND VIABILITY` — business model, three feasibility pillars, risks
5. `IMPACT AND BENEFITS` — metrics, beneficiaries, institute and portfolio evidence
6. `RESEARCH AND REFERENCES` — existing-systems comparison, references, demo link

---

## Two fields still to fill

### 1. Team ID — `scripts/deck/content.mjs` → `META.teamId`

Currently `{{TEAM_ID}}`, and slide 1 shows *"to be filled from the portal"* in its place.

Copy it from the SIH portal **character by character**. Slide 1 is read before a single
sentence of your idea, and it is checked against the portal record.

### 2. Live demo URL — `scripts/deck/content.mjs` → `META.demoUrl`

Currently `{{DEMO_URL}}`, and slide 6 shows *"to be added before submission"*.

Two rules: it must be deployed (not `localhost`), and it must not be a free host that
sleeps. A cold dyno showing a blank page to the first evaluator costs you the round.

### Then rebuild and re-check

```powershell
cd "avsar SIH 2026"
npm run deck:build              # warns about anything still unresolved
npm run deck:build -- --strict  # refuses to build while a placeholder remains
npm run deck:verify             # re-runs the format checks against the .pptx
```

`deck:verify` checks the file that will actually be submitted, not the source that
produced it. It currently reports every check passing except the two above.

---

## Getting it into Canva

The Canva MCP server is registered and authenticated (`cmdc mcp list` shows
`canva http local ✔ enabled`), but **its tools were not loaded into the session that built
this deck** — MCP servers are loaded at session start, and the server was added after this
session began. So the import is the one step still open.

Two ways to close it:

**A. Let me finish it.** Restart Command Code (or open a new session) so the Canva tools
load, then ask me to import. I already have the public URL:

```
https://files.catbox.moe/mjq0uq.pptx
```

Give it to `import-design-from-url`, confirm `get-design-pages` returns **6**, then
`export-design` to PDF — that PDF is the submission file.

**B. Do it yourself, ~30 seconds.** In Canva: *Create a design → Import file → From URL*,
paste the URL above. Or download the .pptx from `PPT/` and drag it in. Either way, check
the design has exactly 6 pages before exporting the PDF.

The PDF is mandatory — SIH requires the idea submission as a PDF.

---

## Before you upload

- Open `PPT/AVSAR_SIH2026_Zencoderss_6slide.pptx` and read all six slides once with fresh eyes.
- Re-check slide 1 against the portal: ID, title, theme, category, Team ID, team name.
- Confirm the exported PDF has **exactly six pages**.
- The two things that get decks rejected here are a wrong theme string and a Team ID typed
  from memory. Both are copy-paste jobs.

## Also worth knowing

- **The year bug is fixed.** Your draft title slide read `SMART INDIA HACKATHON 2025` next
  to a 2026 logo. It now reads 2026.
- **Your original 12-slide deck is at** `PPT/archive/AVSAR_SIH2026_Zencoderss_12slide.pptx`.
  Nothing was deleted.
- **The Avsar logo is new** (`PPT/build/assets/avsar-logo.png`) — green, as you asked, since
  your original was blue. Swap in a designed version any time; it is one file.
- **A live Groq API key is committed** in `avsar SIH 2026/.env`. Rotate it before the repo
  goes anywhere public.
