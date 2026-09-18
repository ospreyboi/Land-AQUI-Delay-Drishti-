# Land Acquisition Delay Risk Dashboard 

**Predictive Analytics System for Early Detection of Land Acquisition Delays**
Ministry of Rural Development · Dept. of Land Resources (DoLR)

## my focus

An AI-powered dashboard that predicts which land acquisition projects are at risk
of delay — and why — before the delay happens, across four causes: acquisition
process health, legal disputes, rehabilitation readiness, and administrative
efficiency.

## Status
still a beta version, more technology changes and architectural changes underway.


## Tech stack

| Layer | Technology |
|---|---|
| Database | SQLite (for future pinecone with postgreSQL|
| Backend API | FastAPI (Python) |
| ML model | scikit-learn, persisted with joblib |
| Frontend | Plain HTML + CSS (Tailwind via CDN) + vanilla JavaScript |
| Frontend → Backend | `fetch()` calls to FastAPI endpoints |
| Charts | Chart.js (via CDN) or plain CSS bars |


## Repo structure

```
/data
  generate_dataset.py       # synthetic dataset generator (already built)
  land_acquisition.db       # SQLite database (generated from CSV)
/backend
  main.py                   # FastAPI app, all endpoints
  model_train.py            # trains and saves model.pkl
  model.pkl                 # trained model (generated)
  requirements.txt
/frontend
  index.html                # Tab 1: Overview
  projects.html              # Tab 2: Project List
  project-detail.html        # Tab 3: Project Detail
  analytics.html              # Tab 4: District/State Analytics
  /css
    style.css
  /js
    api.js                   # shared fetch() helper functions
    overview.js
    projects.js
    detail.js
    analytics.js
/docs
  prd.md
  architecture.md
  rules.md
  memory.md
  readme.md (this file)
```

## Running the backend

```bash
cd backend
pip install fastapi uvicorn scikit-learn pandas joblib
uvicorn main:app --reload
```

API docs auto-available at `http://localhost:8000/docs` once running — this is
useful to demo directly to judges as proof the API works.

## Running the frontend

No build step needed. Open `frontend/index.html` directly in a browser, or serve
the folder with any simple static server for local testing.

## Who's building what

See `docs/memory.md` for full team roles and role-to-file mapping.
