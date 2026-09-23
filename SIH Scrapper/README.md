# Kabadiwala Connect (SIH26229)

Offline-first PWA + FastAPI backend. See `REPORT.md` for the full plan.

## Run (Windows PowerShell)

```powershell
py -3.14 -m pip install -r backend\requirements.txt
py -3.14 backend\seed.py            # seed demo data (SQLite, zero setup)
py -3.14 -m uvicorn app:app --reload --app-dir backend   # API on http://localhost:8000
```

Serve the PWA (any static server; backend URL defaults to localhost:8000):

```powershell
npx serve frontend
# or: python -m http.server 8080 --directory frontend
```

Postgres: set `DATABASE_URL=postgresql://...` before starting uvicorn; same schema applies.
