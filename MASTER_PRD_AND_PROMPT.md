# PRODUCT REQUIREMENTS DOCUMENT & DECOUPLED AGENT EXECUTION PROMPT
## Campus2Corporate (C2C): AI-Powered Career Readiness and Job Verification Platform

---

### Document Control
- **Version:** 2.2.0
- **Author:** Senior Staff Software Architect
- **Status:** Approved for Implementation
- **Target Stack:** React 18 / Vite, Tailwind CSS v4, Supabase (PostgreSQL / Auth / Edge Functions), Google Gemini 1.5 Flash (Modular Provider Interface), Web Speech API, pdfjs-dist, Tesseract.js / PDF.js.

---

## 1. Executive Summary & Strategic Rationale

### 1.1 Problem Statement
Graduating students from Tier-2 and Tier-3 institutions frequently experience structural employment gaps due to unaligned skill sets, resume formatting deficiencies, lack of objective skill verification, and fragmented career discovery portals.

### 1.2 System Solution
Campus2Corporate (C2C) provides an automated, multi-modal verification engine that converts candidate resume inputs into an actionable, verified readiness index. The system combines deterministic ATS keyword matching, external digital proof verification (GitHub/LeetCode/Certifications), dynamic voice-based technical assessment, and a multi-source job scraping aggregator to compute a verified readiness score (MAIN SCORE).

---

## 2. System Architecture & Module Boundaries

To enable independent AI agent development with zero component coupling or git merge conflicts, the system is strictly partitioned into domain modules communicating through frozen TypeScript/JSDoc interface contracts.

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
|                            SPECIALIZED SUBSYSTEMS                                 |
|  +------------------------+  +--------------------------+  +-------------------+  |
|  | Hybrid Scraper Pipeline|  | Certificate Verification |  | Gamification      |  |
|  | (Firecrawl + RSS + DB) |  | (OCR + URL Validation)   |  | (Clans + Contests)|  |
|  +------------------------+  +--------------------------+  +-------------------+  |
+-----------------------------------------------------------------------------------+
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
    clan_id UUID,
    main_score INT DEFAULT 0 CHECK (main_score BETWEEN 0 AND 100),
    rank_tier TEXT DEFAULT 'Bronze' CHECK (rank_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')),
    xp_points INT DEFAULT 0,
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

-- Table: certifications
CREATE TABLE public.certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    issuer TEXT NOT NULL, -- 'Coursera', 'NPTEL', 'Udemy', 'AWS', 'Google'
    title TEXT NOT NULL,
    credential_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    skills_extracted JSONB DEFAULT '[]'::jsonb,
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
    job_hash TEXT UNIQUE NOT NULL,
    is_scraped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: clans
CREATE TABLE public.clans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    college_name TEXT NOT NULL,
    total_xp INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: contests
CREATE TABLE public.contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    role_category TEXT NOT NULL,
    is_rated BOOLEAN DEFAULT TRUE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    questions JSONB NOT NULL
);
```

---

## 4. Deep-Dive Architecture: Scraper, Verification & Gamification

### 4.1 Multi-Source Hybrid Job Scraping Engine

To overcome anti-scraping blocks (captchas, rate limits, dynamic JS rendering) on portals like Naukri, LinkedIn, and corporate career pages (TCS, Accenture, Cognizant), C2C employs a **3-Tier Fallback Scraping Pipeline**:

```
                  +-----------------------------------+
                  |      Job Search Query Trigger     |
                  +-----------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
        +-----------------------+       +-----------------------+
        |  Tier 1: Pre-Scraped  |       | Tier 2: Firecrawl API |
        |  PostgreSQL Cache     |       | (Live Web Scraping)   |
        +-----------------------+       +-----------------------+
                    |                               |
                    +---------------+---------------+
                                    | (If empty / failed)
                                    v
                        +-----------------------+
                        | Tier 3: Open Job APIs |
                        | (JSearch / Jooble)    |
                        +-----------------------+
```

1. **Tier 1 (Cached DB Query)**: Queries indexed PostgreSQL `jobs` table matching target role. Provides sub-50ms response time for stage demos.
2. **Tier 2 (Firecrawl API Service)**: Asynchronous Supabase Edge Function that issues Firecrawl web scraping requests for live portal endpoints (Internshala, WeWorkRemotely, Naukri). Extracts DOM markdown, parses JSON fields via LLM, and calculates `job_hash = SHA256(company + title + location)` to prevent duplicate entries.
3. **Tier 3 (Fallback Job Search APIs)**: Fallback query to public job search aggregators (JSearch / Jooble API) ensuring candidate always receives active listings even during portal maintenance.

### 4.2 Automated Certification Verification Engine

To ensure students cannot upload fake certificates to pad their score, C2C uses a **3-Layer Credential Verification Engine**:

1. **Client-Side Document Parsing & OCR**:
   - Uses `pdfjs-dist` and `Tesseract.js` to extract text from uploaded PDF/image certificates.
   - Extracts candidate name, issuing authority (NPTEL, Coursera, Udemy, AWS, Google), completion date, and course title.

2. **Domain URL & Issuer Verification**:
   - Validates credential URL structure against known issuer regex rules:
     - Coursera: `^https?://(www\.)?coursera\.org/verify/[A-Za-z0-9]+$`
     - NPTEL: `^https?://(www\.)?nptel\.ac\.in/noc/Ecertificate/\?id=[A-Za-z0-9]+$`
     - AWS: `^https?://(www\.)?aws\.amazon\.com/verification/[A-Za-z0-9-]+$`
   - Issues a lightweight HEAD request to verify URL HTTP 200 status.

3. **Skill Gap Remediation & Score Boost**:
   - Extracted certificate skills are cross-referenced with candidate's missing ATS skills.
   - Automatically checks off corresponding roadmap tasks and applies a $+10\text{pt}$ to $+20\text{pt}$ boost to $S_{\text{Proof}}$.

### 4.3 Think-Tank Gamification Engine

Gamification is structured to drive continuous skill improvement without demotivating struggling candidates:

1. **Rank Classification Matrix**:
   - **Bronze (0–49 Pts)**: Novice level.
   - **Silver (50–64 Pts)**: Apprentice level.
   - **Gold (65–79 Pts)**: Job Ready.
   - **Platinum (80–89 Pts)**: Top Talent.
   - **Diamond (90–100 Pts)**: Elite Master.

2. **College Battleboard Aggregation**:
   - Real-time aggregate query computing average `MAIN_SCORE` by college:
     ```sql
     SELECT college_name, AVG(main_score) as avg_score, COUNT(id) as student_count
     FROM public.profiles
     GROUP BY college_name
     ORDER BY avg_score DESC;
     ```
   - Drives healthy institutional rivalry without exposing individual student PII.

3. **Think-Tank Contests & Clans (Squads)**:
   - **Rated Contests**: Weekly 15-minute micro-assessments (5 domain questions) impacting candidate XP and profile rank.
   - **Unrated Contests**: Open practice assessments without score penalties.
   - **Clans / Squads**: Student-formed study groups sharing a combined XP pool to unlock group achievement badges.

---

## 5. Dual-Scoring Engine Formalization

### 5.1 Scoring Mathematical Definitions

#### Tech Roles (SDE, Data Analyst)
$$\text{MAIN\_SCORE} = \text{Round}\left(0.50 \cdot S_{\text{ATS}} + 0.30 \cdot S_{\text{Voice}} + 0.20 \cdot S_{\text{Proof}}\right)$$

#### Non-Tech Roles (Marketing, Govt Prep)
$$\text{MAIN\_SCORE} = \text{Round}\left(0.60 \cdot S_{\text{ATS}} + 0.30 \cdot S_{\text{Voice}} + 0.10 \cdot S_{\text{Proof}}\right)$$

Where:
- $S_{\text{ATS}} \in [0, 95]$: Deterministic sub-score derived from skills density (30pts), keywords (20pts), impact metrics (25pts), formatting structure (15pts), and proof citations (10pts).
- $S_{\text{Voice}} \in [0, 100]$: LLM-evaluated score measuring technical accuracy and STAR structure from 15-second response transcript.
- $S_{\text{Proof}} \in [0, 100]$: Quantitative assessment of LeetCode solved count ($N \ge 150 \implies 100\text{pts}$), GitHub repository activity ($+30\text{pts}$), and verified certifications ($+20\text{pts}$).

---

## 6. Decoupled AI Execution Phases

To ensure independent development by parallel AI software agents without code collisions, the task is organized into eight distinct implementation phases. Each phase targets isolated files and respects predefined contract interfaces.

---

### PHASE 1: Core Domain Contracts & Scoring Engine Module
- **Files Modified:** `src/types/index.ts`, `src/lib/score.js`, `src/lib/supabase.js`.
- **Contract Boundary:** Export `calculateMainScore(atsScore, voiceScore, proofScore, role)` and Supabase client instance.

---

### PHASE 2: Resume Parser & ATS Pipeline Module
- **Files Modified:** `src/lib/pdf.js`, `src/lib/atsEngine.js`, `src/components/ResumeUploader.jsx`.
- **Contract Boundary:** Output normalized `ResumeAnalysisResult` object.

---

### PHASE 3: Web Speech Voice Verification Module
- **Files Modified:** `src/lib/speech.js`, `src/components/VoiceInterview.jsx`.
- **Contract Boundary:** Return `VoiceAssessmentResult` object.

---

### PHASE 4: Certificate Verification Subsystem
- **Files Modified:** `src/lib/certVerifier.js`, `src/components/CertUploader.jsx`.
- **Contract Boundary:** Return `CertificationVerificationResult` object containing `verified`, `issuer`, and `skillsExtracted`.

---

### PHASE 5: Hybrid Scraper Pipeline Module
- **Files Modified:** `src/lib/scraper.js`, `src/data/jobs.js`, `supabase/functions/firecrawl-scraper/index.ts`.
- **Contract Boundary:** Export `searchJobs(role, query)` returning array of normalized `Job` objects with deduplication hashes.

---

### PHASE 6: Phase & Week Timetable Roadmap Subsystem
- **Files Modified:** `src/lib/roadmapGenerator.js`, `src/components/RoadmapView.jsx`.
- **Contract Boundary:** Emit `TaskCompletionEvent` triggering score re-assessment.

---

### PHASE 7: AI Career Coach & Chatbot Drawer
- **Files Modified:** `src/components/AICoachDrawer.jsx`, `src/lib/gemini.js`.
- **Contract Boundary:** Self-contained UI drawer executing LLM adapter interface.

---

### PHASE 8: Gamification, Clans & College Battleboard
- **Files Modified:** `src/components/CollegeBattle.jsx`, `src/components/ThinkTank.jsx`.
- **Contract Boundary:** Render college rankings and contest modules without mutating profile assessment state directly.

---

## 7. Master Prompt Engineering Specification

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

## 8. Verification and Test Protocol

1. **Unit Testing Criteria:** `calculateMainScore` must yield consistent mathematical results matching section 5.1 across 100 test variations.
2. **Certificate Verification Testing:** Validate that valid Coursera/NPTEL URLs pass regex validation while invalid format URLs trigger verification warnings.
3. **Offline Resilience Testing:** Disconnect internet access and trigger sample resume upload. Verify that the ATS parsing and job lock visualization complete successfully using deterministic fallback logic.
4. **Build Target Check:** Run `npm run build` inside the `app/` directory and ensure output generation completes with zero errors.
