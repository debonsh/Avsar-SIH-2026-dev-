# Master PRD & AI Implementation Prompt — Campus2Corporate (C2C)

> **Version:** 2.0 (Hackathon Production Spec & Master Prompt)
> **Target Event:** Hackathons & Innovation Challenges (e.g., MP Online Govt Hackathon / National Career Tech)
> **Stack Locked:** React + Vite + Tailwind CSS v4 + Supabase + Gemini 1.5 Flash (Modular for Grok/DeepSeek) + Web Speech API + Firecrawl Hybrid Scraper

---

# PART 1: Executive Summary & Hackathon Strategy

## 1.1 Problem Statement
Thousands of Tier-2/3 college students graduate every year with severe employment readiness gaps. They lack industry mentorship, struggle with unoptimized resumes, have no transparent way to verify their actual skill levels, and waste hours navigating fragmented job portals (Naukri, Internshala, LinkedIn, Corporate Career pages).

## 1.2 Core Solution & Pitch
**Campus2Corporate (C2C)** is an AI-powered Career Readiness & Job Verification Engine that converts an unoptimized student resume into an **unlocked, verified job application**.

Unlike simple ATS checkers, C2C features a **Dual-Scoring Engine**:
1. **Resume ATS Match (50%)**: Keyword, structure, skill density, impact metrics, and certification evaluation.
2. **Skill Proof & Digital Footprint (20%)**: GitHub repository activity, LeetCode solved counts, LinkedIn profile, or uploaded certifications (adaptable for Tech and Non-Tech roles).
3. **15-Second Voice Mini-Interview (30%)**: Dynamic AI-generated verification question based strictly on the user's uploaded resume to prevent resume fluffing.

## 1.3 The "WOW" Factor (The 3-Minute Hackathon Demo Loop)
1. **0:00 - 0:45 | Resume + Profile Upload**: Student selects target role (SDE, Data, Marketing, Govt), uploads PDF, and links GitHub/LeetCode/LinkedIn.
2. **0:45 - 1:15 | ATS & Skill Gap Discovery**: System outputs transparent sub-scores (Skills 30 / Impact 10 / Format 15 / Keywords 20 / Proof 25) and flags missing critical requirements.
3. **1:15 - 1:45 | 15-Sec Live Voice Verification**: AI asks 1 dynamic follow-up question based on listed projects. Student speaks into microphone; live Speech-to-Text captures response and evaluates technical clarity.
4. **1:45 - 2:30 | MAIN SCORE & Rank Promotion**: Displays MAIN SCORE (e.g., 58/100, Bronze Rank). Generates a **Week-by-Week / Phase-by-Phase Timetable Roadmap** with free course links & project ideas.
5. **2:30 - 3:00 | Job Unlocking & Progress Re-Assessment**: Student checks off completed roadmap tasks, re-assesses, and watches their score upgrade (Bronze → Gold Rank), switching target jobs on Naukri/Internshala from `LOCKED 🔒` to `ELIGIBLE TO APPLY 🚀`.

---

# PART 2: Core Architecture & Data Specifications

```
                     ┌──────────────────────────────────────────┐
                     │            User Front-End                │
                     │  Vite + React + Tailwind v4 + Speech API │
                     └────────────────────┬─────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
   ┌─────────────────────────────┐                 ┌─────────────────────────────┐
   │    Local Browser Processing │                 │     Supabase / AI Services   │
   │                             │                 │                             │
   │ - pdfjs-dist In-Browser Parse│                 │ - Auth & User Profiles      │
   │ - Web Speech API (Voice-Text)│                 │ - Gemini 1.5 / DeepSeek API │
   │ - Deterministic Keyword Algo│                 │ - Hybrid Firecrawl Scraper  │
   └─────────────────────────────┘                 └─────────────────────────────┘
```

## 2.1 Database Schema (Supabase PostgreSQL)

### `profiles`
- `id`: uuid (PK, references auth.users)
- `full_name`: text
- `email`: text
- `college_name`: text
- `target_role`: text (SDE / Data / Marketing / Govt)
- `github_handle`: text
- `leetcode_handle`: text
- `linkedin_url`: text
- `main_score`: integer (0 - 100)
- `rank_tier`: text ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')
- `created_at`: timestamp

### `assessments`
- `id`: uuid (PK)
- `user_id`: uuid (FK)
- `ats_score`: integer
- `voice_score`: integer
- `proof_score`: integer
- `main_score`: integer
- `voice_transcript`: text
- `verification_flag`: boolean (false if voice used, true if fallback text used)
- `missing_skills`: jsonb
- `created_at`: timestamp

### `roadmaps`
- `id`: uuid (PK)
- `user_id`: uuid (FK)
- `phase_data`: jsonb (Phases 1-3, Week 1-4 tasks, free course links, project specs)
- `completed_tasks`: jsonb (array of task IDs checked off)
- `status`: text ('active', 'upgraded')

### `jobs`
- `id`: uuid (PK)
- `title`: text
- `company`: text
- `location`: text
- `source`: text ('Naukri', 'Internshala', 'WeWorkRemotely', 'Accenture', 'Cognizant', 'TCS')
- `min_score_required`: integer
- `required_skills`: jsonb
- `apply_url`: text
- `description`: text
- `is_scraped`: boolean

---

# PART 3: Dual-Scoring Engine & Rank Progression

## 3.1 Scoring Formula

### Tech Roles (SDE / Data Analyst)
$$\text{MAIN SCORE} = (0.50 \times \text{ATS Score}) + (0.30 \times \text{Voice Score}) + (0.20 \times \text{Coding Proof Score})$$

- **ATS Score (0–100)**: Calculated via transparent keyword density, impact metrics (numbers/percentages), format quality, and skill count.
- **Voice Score (0–100)**: Graded by Gemini Flash based on technical accuracy, relevance to resume, and clarity of the 15-second speech answer.
- **Coding Proof Score (0–100)**:
  - LeetCode Solved Count: >150 = 100 pts, 75–150 = 75 pts, 25–74 = 50 pts, <25 = 20 pts.
  - GitHub Repositories & Star Activity: Active repos = +30 pts.
  - Certifications Uploaded: +20 pts.

### Non-Tech Roles (Marketing / Govt / Finance)
$$\text{MAIN SCORE} = (0.60 \times \text{ATS Score}) + (0.30 \times \text{Voice Score}) + (0.10 \times \text{Portfolio/LinkedIn Proof})$$

## 3.2 Rank Tier Progression System
- **Bronze (0 – 49 Pts)**: High skill gap. Access to basic internships only.
- **Silver (50 – 64 Pts)**: Baseline readiness. Unlocks entry-level roles.
- **Gold (65 – 79 Pts)**: Strong profile. Unlocks competitive MNC / startup roles.
- **Platinum (80 – 89 Pts)**: Highly verified SDE / Data Lead candidate.
- **Diamond (90 – 100 Pts)**: Top tier. Priority highlight on college battleboards.

---

# PART 4: Feature Deep-Dive Specifications

## 4.1 Voice Mini-Interview Verification
1. **Dynamic Question Trigger**: Upon uploading resume, Gemini analyzes project bullets and generates **1 tailored 15-second verification question**.
   *Example:* *"You listed building a React e-commerce app. In 15 seconds, explain how you managed cart state across components."*
2. **Speech Recognition**: Browser Web Speech API (`webkitSpeechRecognition`) records live audio. Speech-to-text transcript is rendered real-time.
3. **Text Fallback**: If mic access is denied or fails, user can type the answer. The system sets `verification_flag = true` with a small score penalty (-5 pts) to prevent copy-pasting answers.
4. **Instant AI Evaluation**: Gemini evaluates transcript for STAR method structure, technical term accuracy, and conciseness, returning a score (0–100) and 1 feedback bullet.

## 4.2 Phase & Week-by-Week Action Roadmap
1. **Structure**: 3 Phases spanning 4 Weeks.
   - **Phase 1 (Weeks 1–2): Skill Gap Bridge** → Free NPTEL / SWAYAM / YouTube curated links + micro-tests.
   - **Phase 2 (Week 3): Portfolio Building** → 1 targeted role-specific project with starter code & GitHub push instructions.
   - **Phase 3 (Week 4): Resume Upgrade & Job Lock Release** → ATS re-assessment, voice re-interview, job application unlock.
2. **Score Upgrade Re-Assessment**:
   - As users check off completed tasks in their roadmap, their **Original Score (e.g. 52/Bronze)** remains visible as baseline proof.
   - Completing tasks enables a **Re-Assessment Mini-Interview** focusing on newly acquired skills, elevating their **Upgraded Score (e.g. 74/Gold)**.

## 4.3 24/7 Context-Aware AI Career Coach
- **Embedded Floating Drawer / Sidebar Chatbot**.
- **Context Priming**: System automatically feeds user resume text, ATS breakdown, missing skills, active roadmap, and targeted role into the prompt.
- **Quick-Action Buttons**:
  - `💡 Explain Week 1 SQL Task`
  - `⚡ Condense my Roadmap to 2 Weeks`
  - `📝 Rewrite my Project Bullets for ATS`
  - `🎯 How do I answer questions about [Missing Skill]?`

## 4.4 Hybrid Job Search & Aggregator Engine
- **Hybrid Source**:
  1. **Curated Pre-Scraped DB**: Instant offline fallback for high-traffic stage demos (Accenture, Cognizant, TCS, Internshala, WeWorkRemotely).
  2. **Live Firecrawl Integration**: Queries Firecrawl API for live postings matching target role.
- **Job Card UX**:
  - Compact summary card showing: Job Title, Company Logo, Location, Required Skills Badge Count, Source Badge.
  - **Match Status**: `UNLOCKED (Score 72 >= Min 65)` (Green Apply Button) vs `LOCKED (Need +12 Points)` (Red Lock Icon).
- **Expanded Detail Modal**:
  - Clicking any card opens a detailed view showing complete job description, exact missing skills compared to student's resume, and step-by-step instructions to unlock.

## 4.5 Think-Tank Gamification (Optional / Phase 3)
- **College Battle Leaderboard**: Average student score aggregated by college name (seeded with top Tier-2/3 institutions).
- **Rated / Un-Rated Skill Tests**: Weekly timed coding / domain quizzes.
- **Clans Blueprint**: Student groups / squads competing in weekly challenges.

---

# PART 5: Master AI Implementation Prompt

> **Instructions for Developer / AI Agent:** Copy and paste the prompt block below into your AI Coding Agent (Devin, Jules, Cursor, Claude Code) to build or expand the Campus2Corporate repository.

```text
You are an expert Principal Full-Stack Engineer. Your task is to implement the complete Campus2Corporate (C2C) AI Career Readiness Platform according to the specification below.

### TECH STACK & PREREQUISITES
- Framework: React (Vite) + Tailwind CSS v4
- Database & Auth: Supabase PostgreSQL & Auth
- AI Model Integration: Google Gemini 1.5 Flash (via @google/genai or REST API) with fallback support for DeepSeek / Grok
- Voice Capture: Browser Native Web Speech API (webkitSpeechRecognition)
- PDF Parser: pdfjs-dist (client-side dynamic import)

---

### STEP-BY-STEP IMPLEMENTATION PLAN

#### STEP 1: Database & Supabase Client Setup
1. Create `src/lib/supabase.js` using `@supabase/supabase-js`.
2. Define SQL migration scripts for tables: `profiles`, `assessments`, `roadmaps`, and `jobs`.
3. Set up RLS (Row Level Security) policies allowing users to read/write their own records, and public read access for curated `jobs` and college leaderboard averages.

#### STEP 2: Dual-Scoring Engine Logic (`src/lib/score.js`)
1. Implement `calculateATSScore(resumeText, role)`:
   - Compute breakdown: Skills (30), Keywords (20), Experience & Impact Metrics (25), Format (15), Proof (10).
   - Return ATS Score (capped at 95 max to leave headroom).
2. Implement `calculateCodingProofScore(githubHandle, leetcodeHandle, certifications)`:
   - Fetch LeetCode public GraphQL data (`https://leetcode.com/graphql`) for total solved.
   - Calculate Proof Score (0–100).
3. Implement `calculateMainScore(atsScore, voiceScore, proofScore, roleCategory)`:
   - Apply 50% ATS + 30% Voice + 20% Proof weighting for Tech roles.
   - Apply 60% ATS + 30% Voice + 10% Proof weighting for Non-Tech roles.
   - Map Main Score to Rank Tier ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond').

#### STEP 3: Voice Mini-Interview Component (`src/components/VoiceInterview.jsx`)
1. Generate 1 dynamic question using Gemini based on uploaded resume project bullets.
2. Integrate Web Speech API with live transcript visualization and 15-second countdown timer.
3. Provide fallback text input setting `verification_flag = true` if microphone fails or is refused.
4. Pass transcript to Gemini for STAR method grading (returns 0–100 score + feedback bullet).

#### STEP 4: Phase & Week-by-Week Action Roadmap (`src/components/Roadmap.jsx`)
1. Generate 3-Phase / 4-Week timetable via Gemini based on missing ATS skills.
2. Include direct free course links (NPTEL, SWAYAM, freeCodeCamp, YouTube) and 1 portfolio project idea.
3. Add interactive checkboxes for tasks. When all tasks in a phase are checked, enable "Re-Assess Profile" button to upgrade score from Bronze to Gold.

#### STEP 5: 24/7 AI Career Coach Chatbot (`src/components/AICoachModal.jsx`)
1. Create drawer/modal chatbot interface.
2. Pass complete user state context (resume text, ATS sub-scores, active roadmap, target job) in system prompt.
3. Add Quick-Action Buttons at bottom of chat ("Explain Week 1 SQL Task", "Rewrite my Project Bullets for ATS").

#### STEP 6: Hybrid Job Search & Aggregator (`src/components/JobList.jsx` & `src/data/jobs.js`)
1. Build job card grid with filters (Role, Source, Unlocked vs Locked).
2. Render mini summary card with company logo, location, skill badges, and `UNLOCKED` or `LOCKED (+X pts needed)` status.
3. Build Detailed Job Modal showing full JD, missing skill gaps, and direct Apply link.
4. Optionally fetch live jobs via Firecrawl API endpoint fallback.

#### STEP 7: Gamification & College Battle (`src/components/CollegeBattle.jsx`)
1. Render College Leaderboard calculating average Main Score per college.
2. Highlight user's contribution and rank badge (Bronze → Gold).

---

### VERIFICATION & QUALITY CHECKS
1. Verify `npm run build` executes cleanly with zero syntax or bundling errors.
2. Test sample resume upload flow offline without API key (verify local deterministic rubric fallback).
3. Test Voice Interview transcript generation and fallbacks.
4. Confirm job lock/unlock logic updates dynamically when score changes.
```

---

# PART 6: Hackathon Pitch & Q&A Defense Script

## 6.1 Judge Questions & Winning Answers

**Q1: How do you prevent students from faking their resume or AI answers?**
*A: We built a 3-layer verification system. First, ATS checks for metric proof. Second, GitHub/LeetCode APIs check real code activity. Third, our 15-second Live Voice Verification asks a dynamic follow-up question based specifically on their resume projects. If they use text fallback, a verification flag is raised.*

**Q2: What if stage Wi-Fi fails during the demo?**
*A: C2C is built local-first. Resume PDF parsing, keyword ATS scoring, starter job databases, and sample resume workflows run 100% in-browser using Web APIs without needing external backend network calls.*

**Q3: How does C2C help Tier-2/3 students who can't afford paid courses?**
*A: Every single recommended skill gap in C2C links directly to free, high-quality government and open-source resources (NPTEL, SWAYAM, freeCodeCamp, YouTube playlists).*
