# PRODUCT REQUIREMENTS DOCUMENT & DECOUPLED AGENT EXECUTION PROMPT
## Campus2Corporate (C2C): AI-Powered Career Readiness and Job Verification Platform

---

### Document Control
- **Version:** 2.1.0
- **Author:** Senior Staff Software Architect
- **Status:** Approved for Implementation
- **Target Stack:** React 18 / Vite, Tailwind CSS v4, Supabase (PostgreSQL / Auth / Edge Functions), Google Gemini 1.5 Flash (Modular Provider Interface), Web Speech API, pdfjs-dist.

---

## 1. Executive Summary & Strategic Rationale

### 1.1 Problem Statement
Graduating students from Tier-2 and Tier-3 institutions frequently experience structural employment gaps due to unaligned skill sets, resume formatting deficiencies, lack of objective skill verification, and fragmented career discovery portals.

### 1.2 System Solution
Campus2Corporate (C2C) provides an automated, multi-modal verification engine that converts candidate resume inputs into an actionable, verified readiness index. The system combines deterministic ATS keyword matching, external digital proof verification (GitHub/LeetCode), and dynamic voice-based technical assessment to compute a verified readiness score (MAIN SCORE).

---

## 2. System Architecture & Module Boundaries

To enable independent AI agent development with zero component coupling or git merge conflicts, the system is strictly partitioned into six decoupled domain modules communicating through frozen TypeScript/JSDoc interface contracts.

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|                        (React + Vite + Tailwind CSS v4)                           |
+-----------------------------------------------------------------------------------+
       |                    |                    |                   |
       v                    v                    v                   v
+--------------+    +--------------+    +-----------------+  +------------------+
|   Module 1   |    |   Module 2   |    |    Module 3     |  |     Module 4     |
| Data Models  |    | ATS Parser   |    | Web Speech      |  | Phase Roadmap    |
| & Score Engine|   | Pipeline     |    | Voice Verifier  |  | & Re-assessment  |
+--------------+    +--------------+    +-----------------+  +------------------+
       |                    |                    |                   |
       +--------------------+--------------------+-------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                                  SHARED BACKEND                                   |
|               (Supabase PostgreSQL + LLM Adapter Service Interface)                |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Schemas & API Contracts

### 3.1 Supabase Database Migration Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    college_name TEXT NOT NULL,
    target_role TEXT NOT NULL CHECK (target_role IN ('SDE', 'DataAnalyst', 'Marketing', 'GovtPrep')),
    github_handle TEXT,
    leetcode_handle TEXT,
    linkedin_url TEXT,
    main_score INT DEFAULT 0 CHECK (main_score BETWEEN 0 AND 100),
    rank_tier TEXT DEFAULT 'Bronze' CHECK (rank_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: assessments
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ats_score INT NOT NULL CHECK (ats_score BETWEEN 0 AND 100),
    voice_score INT NOT NULL CHECK (voice_score BETWEEN 0 AND 100),
    proof_score INT NOT NULL CHECK (proof_score BETWEEN 0 AND 100),
    main_score INT NOT NULL CHECK (main_score BETWEEN 0 AND 100),
    voice_transcript TEXT,
    verification_flag BOOLEAN DEFAULT FALSE,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: roadmaps
CREATE TABLE public.roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    phase_data JSONB NOT NULL,
    completed_tasks JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'upgraded', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: jobs
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    source TEXT NOT NULL,
    min_score_required INT NOT NULL CHECK (min_score_required BETWEEN 0 AND 100),
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    apply_url TEXT NOT NULL,
    description TEXT,
    is_scraped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Dual-Scoring Engine Formalization

### 4.1 Scoring Mathematical Definitions

#### Tech Roles (SDE, Data Analyst)
$$\text{MAIN\_SCORE} = \text{Round}\left(0.50 \cdot S_{\text{ATS}} + 0.30 \cdot S_{\text{Voice}} + 0.20 \cdot S_{\text{Proof}}\right)$$

#### Non-Tech Roles (Marketing, Govt Prep)
$$\text{MAIN\_SCORE} = \text{Round}\left(0.60 \cdot S_{\text{ATS}} + 0.30 \cdot S_{\text{Voice}} + 0.10 \cdot S_{\text{Proof}}\right)$$

Where:
- $S_{\text{ATS}} \in [0, 95]$: Deterministic sub-score derived from skills density (30pts), keywords (20pts), impact metrics (25pts), formatting structure (15pts), and proof citations (10pts).
- $S_{\text{Voice}} \in [0, 100]$: LLM-evaluated score measuring technical accuracy and STAR structure from 15-second response transcript.
- $S_{\text{Proof}} \in [0, 100]$: Quantitative assessment of LeetCode solved count ($N \ge 150 \implies 100\text{pts}$), GitHub repository activity ($+30\text{pts}$), and verified certifications ($+20\text{pts}$).

### 4.2 Rank Classification Table
| Score Range | Rank Tier | System Access State |
| :--- | :--- | :--- |
| 0 - 49 | Bronze | Restricted to preparatory learning roadmaps |
| 50 - 64 | Silver | Unlocks entry-level internships and basic job listings |
| 65 - 79 | Gold | Unlocks competitive associate engineering & corporate roles |
| 80 - 89 | Platinum | High-priority candidate spotlight on college dashboards |
| 90 - 100 | Diamond | Top-tier placement verified profile |

---

## 5. Decoupled AI Execution Phases

To ensure independent development by parallel AI software agents without code collisions, the task is organized into six distinct implementation phases. Each phase targets isolated files and respects predefined contract interfaces.

---

### PHASE 1: Core Domain Contracts & Scoring Engine Module
- **Assigned Scope:** Data models, interface definitions, scoring formulas, and pure logic functions.
- **Files Modified:** `src/types/index.ts`, `src/lib/score.js`, `src/lib/supabase.js`.
- **Dependencies:** None.
- **Contract Boundary:** Must export deterministic function `calculateMainScore(atsScore, voiceScore, proofScore, role)` and Supabase client instance.

---

### PHASE 2: Resume Parser & ATS Pipeline Module
- **Assigned Scope:** Client-side PDF extraction via `pdfjs-dist`, keyword matching algorithm, and fallback parser.
- **Files Modified:** `src/lib/pdf.js`, `src/lib/atsEngine.js`, `src/components/ResumeUploader.jsx`.
- **Dependencies:** Consumes type definitions from Phase 1.
- **Contract Boundary:** Must output a normalized `ResumeAnalysisResult` object containing `atsScore`, `missingSkills`, and extracted `projectBullets`.

---

### PHASE 3: Web Speech Voice Verification Module
- **Assigned Scope:** Browser Web Speech API integration, 15-second timer component, fallback text input, and LLM grading connection.
- **Files Modified:** `src/lib/speech.js`, `src/components/VoiceInterview.jsx`.
- **Dependencies:** Consumes `projectBullets` from Phase 2 output.
- **Contract Boundary:** Returns `VoiceAssessmentResult` object containing `voiceScore`, `transcript`, and `verificationFlag`.

---

### PHASE 4: Phase & Week Timetable Roadmap Subsystem
- **Assigned Scope:** Weekly task breakdown generator, interactive progress checkboxes, and score upgrade re-assessment pipeline.
- **Files Modified:** `src/lib/roadmapGenerator.js`, `src/components/RoadmapView.jsx`.
- **Dependencies:** Consumes `missingSkills` from Phase 2.
- **Contract Boundary:** Emits `TaskCompletionEvent` triggering a call to the re-assessment interface in Phase 1.

---

### PHASE 5: AI Career Coach Subsystem
- **Assigned Scope:** Floating drawer chat component, prompt contextualizer, and quick-action response handlers.
- **Files Modified:** `src/components/AICoachDrawer.jsx`, `src/lib/gemini.js`.
- **Dependencies:** Consumes complete user session context from Phases 1-4.
- **Contract Boundary:** Self-contained UI drawer that consumes immutable user state and communicates via LLM adapter API.

---

### PHASE 6: Hybrid Job Aggregator & UI Integration
- **Assigned Scope:** Job card grid, lock/unlock rendering based on `MAIN_SCORE`, Firecrawl API fallback wrapper, and main application container integration.
- **Files Modified:** `src/data/jobs.js`, `src/components/JobList.jsx`, `src/App.jsx`.
- **Dependencies:** Consumes `main_score` from Phase 1 and job data schemas.
- **Contract Boundary:** Reads `main_score` and renders job availability without mutating assessment state directly.

---

## 6. Master Prompt Engineering Specification

```text
SYSTEM PROMPT: PRINCIPAL SOFTWARE ENGINEER ASSISTANT
ROLE: Senior Staff Full-Stack Software Engineer specializing in React, Node.js, and AI Application Architectures.

TASK OBJECTIVE:
Execute the implementation of the assigned module for Campus2Corporate (C2C) strictly following the functional specifications, interface contracts, and file system boundaries defined in this document.

OPERATIONAL CONSTRAINTS:
1. Do not modify files outside your assigned execution phase.
2. Adhere strictly to TypeScript/JSDoc interface specifications.
3. Ensure client-side resilience: components must execute local deterministic fallbacks when external API keys or network endpoints fail.
4. Do not introduce decorative visual text (such as emojis) in functional code base files or log outputs.
5. All code must compile cleanly using standard Vite / ESBuild tooling without typescript or linting errors.

LLM INFERENCE SCHEMA CONTRACT (Gemini 1.5 / DeepSeek Adapter):

INPUT SCHEMA:
{
  "system_instruction": "You are an automated technical interviewer. Analyze the candidate project bullet and evaluate their 15-second spoken answer.",
  "project_bullet": "Developed a real-time collaborative code editor using WebSockets and React.",
  "spoken_transcript": "I used Socket.io for bi-directional communication and updated local state on broadcast events.",
  "target_role": "SDE"
}

OUTPUT SCHEMA CONTRACT (JSON ONLY):
{
  "score": 85,
  "technical_accuracy": "High",
  "star_method_compliance": true,
  "feedback": "Clear explanation of WebSocket state propagation. Concise and within time constraint."
}

IMPLEMENTATION PROCEDURE:
Step 1: Read assigned file locations and verify interface contracts against existing code.
Step 2: Implement pure functions and exported module handlers.
Step 3: Add error boundaries and fallback implementations for network degradation scenarios.
Step 4: Execute local syntax and build validation (`npm run build`).
```

---

## 7. Verification and Test Protocol

1. **Unit Testing Criteria:** `calculateMainScore` must yield consistent mathematical results matching section 4.1 across 100 test variations.
2. **Offline Resilience Testing:** Disconnect internet access and trigger sample resume upload. Verify that the ATS parsing and job lock visualization complete successfully using deterministic fallback logic.
3. **Build Target Check:** Run `npm run build` inside the `app/` directory and ensure output generation completes with zero errors.
