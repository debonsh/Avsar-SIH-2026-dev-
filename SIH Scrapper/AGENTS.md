# AGENTS.md

- No build/test/lint commands verified yet. Do not invent any.
- `data/`: SIH 2026 corpus — `ps_live.json` (240 PS, canonical), `software_ranked.csv` (182 ranked). Winner: SIH26229, backup SIH26236. See `REPORT.md`.
- Stack: vanilla PWA (`frontend/`, no build step) + FastAPI (`backend/app.py`, single file) + SQLAlchemy (SQLite local, Postgres via `DATABASE_URL`). Run: `py -3.14 -m uvicorn app:app --app-dir backend` (port 8000); seed: `py -3.14 backend\seed.py`. NOTE: plain `python` = hermes venv without deps — always use `py -3.14`.
- `backend\kabadi.db` is a local dev artifact (gitignored-worthy); schema auto-creates on import.
- Classifier: zero-shot CLIP (`backend/classify.py`, `POST /classify`); torch must be CPU build (see requirements.txt). First boot downloads ~350MB weights.
