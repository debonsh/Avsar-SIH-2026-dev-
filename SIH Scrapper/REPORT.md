# SIH 2026 — Software Problem Statements: Review, Pick & Build Plan

Date: 2026-09-13 · Team: 1 human + AI · Idea-submission deadline: **30 Sept 2026 (~17 days)**

## 1. What was collected (all in `data/`)

| File | Content |
|---|---|
| `live_sih2026PS.html` | Raw live page, scraped 2026-09-13 (2.79 MB) |
| `ps_live.json` | **240 PS, fully parsed**: number, title, description, org, dept, category, theme, ideas count, deadline, dataset links |
| `mirror_20260822.{json,csv}` | GitHub mirror snapshot (2026-08-22, 226 PS) — used as cross-check |
| `software_ranked.csv` | All **182 Software PS** scored & ranked (see §2) |
| `finalists.txt`, `round2.txt` | Full texts of the 22 manually deep-read candidates |

Key finding: the catalogue **grew from 226 → 240** since Aug 22 (182 Software / 58 Hardware as of today).
Median competition is 6 submitted ideas; max is 66. Deadline is uniform: 30 Sept 2026.

## 2. How every Software PS was reviewed

Honest method note: 182 full descriptions cannot be deep-read by a human in one session.
Coverage was two-layered:

1. **Scripted scan of all 182** — every description scored on 5 axes (weights):
   competition density 30% (fewer ideas = better), solo-buildability 30%
   (penalizes hardware/sensor/drone/proprietary-data dependence),
   data availability 15%, spec clarity 15%, AI-leverage 10%.
   Full ranking in `data/software_ranked.csv`.
2. **Manual deep-read of 22 candidates** — all heuristic top-14 plus targeted picks
   (RAG assistants, marketplaces, recommenders, dashboards). Each judged on:
   can 2 people build a credible demo, can we get the data, is the demo judge-legible in 5 minutes.

## 3. Shortlist (ranked, with verdicts)

| # | PS | Ideas | Verdict |
|---|---|---|---|
| **WINNER** | **SIH26229 Kabadiwala Connect** (Mines, Clean & Green Tech) | 7 | Best-specified PS in the catalogue; social + environmental impact; fully demoable offline-first PWA |
| BACKUP | SIH26236 Food Packaging Recommender (MoFPI) | 5 | Pure software, zero field dependency; weaker demo sizzle |
| 3 | SIH26238 Scholarship Mobile App for Tribal Students | 4 | Strong, but govt-API integration claims can't be real — judges will probe |
| 4 | SIH26239 Scholarship Mgmt System (Tribal Affairs) | 0 | Zero competition; same integration-honesty problem as above |
| 5 | SIH26108 BIS Standards Recommendation Engine | 1 | Great RAG fit, but BIS corpus is paywalled — demo would rest on sample data |
| 6 | SIH26099 Material Code Harmonization (Petroleum) | 4 | Solid NLP entity-resolution; dry demo, enterprise-y judging |
| 7 | SIH26234 Food Waste Redistribution | 3 | Sprawling two-sided scope + IoT; too much for 2 people |
| 8 | SIH26045 IP-SAKTI Ayurveda RAG assistant | 8 | Nice RAG task, crowded, needs legal-domain corpus work |
| 9 | SIH26105 Cyber Risk Quantification | 7 | Dashboards over synthetic telemetry — hard to differentiate |

Rejected with cause (representative): oil/coal/mine PS (SIH26121, 26120, 26024 — proprietary domain data, no demo credibility);
weather nowcasting (SIH26077/78/86 — needs NWP pipelines + GNN expertise, 0 ideas = trap, not gift);
forensics/VPN/NTRO security tools (SIH26150, 26160 — need hardware, pcaps, testbeds);
mental-health-for-atrocity-victims (SIH26093/94 — sensitive population, can't validate, ethics minefield);
Land Stack (SIH26014 — government already piloted it in Chandigarh/TN);
freight forecasting (SIH26006 — freight data is proprietary); train ETA (SIH26028 — needs railway realtime feeds).

## 4. WINNER — SIH26229 Kabadiwala Connect deep-dive

**Problem (one line):** India's e-waste is collected by informal kabadiwalas who can't access the formal
EPR recycling chain — no fair-price info, no authorized-recycler discovery, no transaction records —
so valuable material is lost to unsafe backyard processing.

**Why this one wins for us:**
- The PS hands us the entire blueprint: datasets to build, features, even the field-research and
  unit-economics deliverables. Zero ambiguity about what judges expect.
- Every bullet is implementable in software: photo → classify → value → match recycler → handover record → ledger.
- Only 7 competing ideas. Theme (Clean & Green Tech) has just 5 software PS — thin field.
- Story judges remember: informal worker earns more, toxic burning stops, traceability proven live on stage.

### Solution architecture

```
PWA (offline-first, Hindi/Marathi/English, <5 MB, entry-level Android)
 ├─ Collector app: photo lot → on-device/assisted classification → instant value estimate
 │                 → recycler match ranking → QR handover record → earnings ledger
 │                 → audio/pictorial safety guidance
 ├─ Recycler web console: offered rates, pickup scheduling, handover confirmation
 └─ Admin/analytics: price trends, traceability chain, ESG metrics
Backend: Python API + Postgres (lots, prices, recyclers, transactions, traceability tables
         exactly per the PS dataset spec) · sync queue for offline-first operation
AI (honest scope): image classifier over ~8 material categories (PCB, CRT, LCD, cables,
         batteries, motors/magnets, mixed plastics, metals) trained on public e-waste
         image data + our own photos; price-anomaly flags; recycler ranking (rules + learning)
```

Feature → PS-bullet map: photo lots ✓, price board + spoken prices ✓, recycler dataset + ranking ✓,
verifiable handover (photo/weight/timestamp/GPS/unique ref) ✓, earnings ledger ✓,
safety guidance ✓, Hindi/Marathi ✓, offline-first with sync ✓, small app size ✓,
cash-first payments ✓, unit-economics assessment ✓, field research with 2 collectors ✓ (your job).

### Tech stack (proposed, not yet scaffolded)

PWA (React + Vite + Workbox for offline), Python FastAPI backend, Postgres, image classifier
fine-tuned from a mobile vision backbone, hosted demo with seeded Maharashtra recycler/price data.

## 5. Real criticism (read before committing)

1. **Two-sided marketplace problem.** The demo needs believable recyclers *and* collectors. Mitigation:
   seed 15–20 real authorized recyclers (CPCB public lists) + 2 real kabadiwala interviews; judges accept seeded supply-side.
2. **The classifier will be shallow.** ~8 categories, small training set — a judge may test it with a tricky photo.
   Mitigation: confidence-threshold + "ask weight/category confirm" fallback framed as human-in-the-loop design, not failure.
3. **Field research is on you (human).** The PS explicitly demands ≥2 working collectors and a live usability demo.
   No code substitutes for this. Budget 2–3 days in Mumbai/Pune scrap markets before Sept 30.
4. **Offline-first is genuinely hard.** Sync conflicts, small APK/PWA size — don't promise native app; PWA + Workbox is the honest answer.
5. **7 ideas, not 0.** At least a few teams are already here. Our edge must be the working demo + unit economics, not the deck.
6. **Scope creep magnet.** The PS lists ~8 datasets and 12+ features. Cut line for the idea round:
   lots, price board, matching, handover, ledger. Everything else is "roadmap."

## 6. Solid plan (dates are real — deadline Sept 30)

**Phase 0 — Idea round (now → Sept 30, the actual deliverable is the PPT + demo video):**
- Sept 13–15: field visits (2+ kabadiwalas), CPCB authorized-recycler list pull, price data capture → `data/field/`
- Sept 13–20 (AI-led): PWA skeleton + backend + seeded datasets + baseline classifier; happy-path demo working
- Sept 20–25: demo video, unit-economics one-pager, failure-case hardening (offline mode, low-confidence path)
- Sept 25–30: SIH idea PPT (official format), submit; buffer for portal issues

**Phase 1 — If shortlisted for finale:** harden classifier with collected photos, real recycler onboarding pilot,
payments ledger, Marathi/Hindi TTS polish, load/field testing.

**Immediate next steps (say the word):** scaffold PWA + FastAPI + Postgres schema per the PS dataset spec,
and draft the field-research questionnaire for the kabadiwala visits.

## 7. Backup — SIH26236 Food Packaging Recommender

Knowledge-based recommender (rules + ML): food properties in → packaging material + OTR/WVTR specs +
shelf-life + eco-alternatives out. Zero fieldwork, compilable literature data, 5 competing ideas.
Pick this if field access falls through. Weaker because the "AI" is a decision engine (say so honestly)
and a form-fill demo is less memorable than Kabadiwala's photo-to-money loop.
