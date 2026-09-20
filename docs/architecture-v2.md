# Architecture v2 — NLP model on PostgreSQL + pgvector

**Status: PLAN, not built.** Nothing in this document exists in the repo yet.
It supersedes parts of `architecture.md` (which describes the beta: SQLite,
static frontend, hand-weighted risk formula). Read `architecture.md` first for
the column schema — it stays valid.

Decisions taken (2026-09-20): NLP **augments** the risk model rather than
replacing it; SIA text is **regenerated independently**; storage is
**PostgreSQL with the pgvector extension** — one database for rows *and*
embeddings, no external vector service; plan before code.

---

## 1. Why v2 exists — the problem with v1

Two things in the beta block any honest NLP work.

### 1.1 There is no model

`risk_score` is a hand-written weighted sum in `generate_dataset.py`, plus
noise, with `delayed = risk > 0.45`. No scikit-learn, no training, no
`model.pkl`. v2 builds the first real model.

### 1.2 The SIA text is written *from* the sentiment score

```
community_sentiment_score ──► SIA log text   (generate_sia_logs.py picks a
                          │                   template bank by score bucket)
                          └──► risk_score     (weight 0.12)
```

An NLP model reading that text recovers the number that wrote it, from a bank
of ~19 fixed phrasings. Near-perfect accuracy, zero information gained. **Any
NLP result on the current text is meaningless.** Fixing this is Phase 0 and
everything else depends on it.

---

## 2. Target architecture

```
  data/generate_dataset_v2.py ───► structured facts (34 cols) ──┐
                                                                │
  data/generate_sia_logs_v2.py ──► SIA report text ─────────────┤
        (driven by FACTS + text-only detail)                    │
                                                                ▼
  nlp/embed.py ──► sentence-transformers ──► 384-dim vectors ──► PostgreSQL
                                                              ┌──────────────────────────┐
  nlp/extract.py ──► sentiment + themes ──────────────────────►│ projects                 │
                                                               │ sia_reports (+ embedding)│
                                                               │ nlp_features             │
                                                               │ predictions              │
                                                               │ change_log               │
                                                               │   ── pgvector extension ─│
                                                               └────────────┬─────────────┘
                                                                            │
  model/train.py ──► structured + NLP + kNN features ──► model.pkl          │
                                                                            │
                                                     FastAPI (backend/main.py)
                                                                            │
                                                                 frontend (fetch calls)
```

Everything — rows, embeddings, similarity search — lives in one PostgreSQL
instance. No second service, no API key, no network hop to look up a
neighbour.

---

## 3. Phase 0 — regenerate the SIA text (the critical fix)

**Goal:** make the text carry information the 34 columns do not, so NLP has
something real to extract.

### 3.1 Invert the generation order

| v1 (broken) | v2 |
|---|---|
| sentiment score → text | facts → text; sentiment is **derived from** text by the NLP model |

`generate_sia_logs_v2.py` writes each report from the project's actual
circumstances — `compensation_disputed`, `court_case_filed`,
`rehabilitation_site_ready`, `land_type`, `families_to_be_resettled`,
`consent_percentage` — and never reads `community_sentiment_score`.

`community_sentiment_score` is **removed from the dataset as an input column.**
It becomes a model output, produced by `nlp/extract.py`.

### 3.2 Add text-only signal

The point of NLP is to capture what a spreadsheet cell cannot. Each generated
report carries several of these, none of which exist as columns:

| Text-only factor | Why it predicts delay |
|---|---|
| **Which groups objected** — landowners vs tenant cultivators vs labourers | Tenants/labourers have weaker statutory standing → longer grievance cycles |
| **Objection type** — procedural (notice not circulated) vs fundamental (public-purpose challenged) | Procedural is fixable in weeks; fundamental heads to court |
| **Prior broken promises** — "compensation in the neighbouring district is still undisbursed" | Distrust → consent collapses late in the process |
| **Turnout vs affected population** | Low turnout → consultation legitimacy challenged later |
| **Gram Sabha resolution passed / rejected / deferred** | A formal rejection is a hard procedural blocker |
| **Escalation language** — "will approach the High Court" | Direct precursor to litigation |
| **Specific asset loss** — irrigation source, grazing commons, burial ground | Culturally-weighted objections resist monetary settlement |

### 3.3 Make the label depend on them

**This is the part that makes the whole exercise honest.** The hidden
`delayed` label is generated from structured facts **and** these text-only
factors:

```python
delay_pressure = (structured_component            # as in v1, minus sentiment
                  + 0.10 if objection_type == "fundamental"
                  + 0.08 if gram_sabha_rejected
                  + 0.07 if prior_broken_promises
                  + 0.06 if escalation_language
                  + 0.05 if tenant_cultivators_objected
                  + 0.05 if culturally_weighted_asset_loss
                  + noise)
delayed = delay_pressure > threshold
```

Because those terms live **only** in the text, a structured-features-only model
*cannot* reach them. The NLP model can. That difference is measurable — see §7.

> Without this step the "does NLP help?" comparison in §7 is guaranteed to
> show nothing, and the feature is theatre.

### 3.4 Honesty boundary

The data is still synthetic. Every number this system produces measures **the
pipeline**, not real-world predictive power. Say so on the slide, in the repo,
and in Q&A — same disclosure discipline as the beta.

---

## 4. PostgreSQL schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;   -- pgvector: adds the vector type + ANN indexes

CREATE TABLE projects (
    case_id                          TEXT PRIMARY KEY,
    state                            TEXT NOT NULL,
    district                         TEXT NOT NULL,
    project_name                     TEXT,
    project_type                     TEXT NOT NULL,
    acquiring_authority              TEXT NOT NULL,
    land_area_hectares               REAL,
    land_type                        TEXT,
    num_affected_families            INTEGER,
    sia_conducted                    BOOLEAN,
    consent_percentage               REAL,
    compensation_offered_per_hectare REAL,
    compensation_disputed            BOOLEAN,
    land_records_digitized           BOOLEAN,
    survey_settlement_pending        BOOLEAN,
    approval_timeline_days           INTEGER,
    court_case_filed                 BOOLEAN,
    litigation_type                  TEXT,
    case_pending_court               BOOLEAN,
    stay_order_issued                BOOLEAN,
    case_pendency_duration_months    INTEGER,
    r_and_r_plan_prepared            BOOLEAN,
    families_to_be_resettled         INTEGER,
    rehabilitation_site_ready        BOOLEAN,
    livelihood_restoration_provided  BOOLEAN,
    possession_status                TEXT,
    stakeholder_responsiveness_score REAL,
    awarding_officer_assigned        BOOLEAN,
    district_historical_delay_rate   REAL,
    days_since_notification          INTEGER,
    stage_of_process                 TEXT,
    created_at                       TIMESTAMPTZ DEFAULT now(),
    updated_at                       TIMESTAMPTZ DEFAULT now()
);
-- NOTE: community_sentiment_score is GONE. It is now NLP output (nlp_features).
-- NOTE: risk_score / delayed / delay_duration_months are GONE. Now in predictions.

CREATE TABLE sia_reports (
    report_id      SERIAL PRIMARY KEY,
    case_id        TEXT REFERENCES projects(case_id) ON DELETE CASCADE,
    report_text    TEXT NOT NULL,
    report_date    DATE,
    meeting_count  INTEGER,
    attendee_count INTEGER,
    embedding      vector(384),        -- pgvector; all-MiniLM-L6-v2 output
    embed_model    TEXT,               -- which model produced it, for re-embedding later
    ingested_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON sia_reports (case_id);

-- Approximate-nearest-neighbour index for similarity search.
-- HNSW: good recall, fast queries, fine to build at 5,000 rows.
CREATE INDEX ON sia_reports USING hnsw (embedding vector_cosine_ops);

CREATE TABLE nlp_features (
    case_id            TEXT PRIMARY KEY REFERENCES projects(case_id) ON DELETE CASCADE,
    sentiment_score    REAL,      -- 0-1, DERIVED from text (replaces the old proxy)
    objection_themes   TEXT[],    -- e.g. {compensation, livelihood, resettlement_site}
    objection_type     TEXT,      -- procedural | fundamental | none
    escalation_flag    BOOLEAN,
    consultation_score REAL,      -- turnout / process quality, 0-1
    model_version      TEXT,
    extracted_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE predictions (
    case_id       TEXT PRIMARY KEY REFERENCES projects(case_id) ON DELETE CASCADE,
    risk_score    REAL,
    delayed       BOOLEAN,
    pillar_scores JSONB,          -- {acquisition_process_health: 0.55, ...}
    key_drivers   JSONB,          -- ranked, with contribution weights
    model_version TEXT,
    predicted_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE change_log (          -- what the Logs dashboard writes
    id          SERIAL PRIMARY KEY,
    case_id     TEXT REFERENCES projects(case_id),
    field       TEXT,
    old_value   TEXT,
    new_value   TEXT,
    changed_by  TEXT,
    changed_at  TIMESTAMPTZ DEFAULT now()
);
```

**Why the split:** facts, derived text features, and model output have
different lifecycles. The model re-runs without touching `projects`; an officer
edits `projects` without touching predictions. `change_log` gives the audit
trail the roadmap PDF promises.

---

## 5. Vector search with pgvector

`pgvector` is a PostgreSQL extension adding a `vector` column type, distance
operators, and ANN indexes. Embeddings sit in `sia_reports.embedding`, beside
the text they came from. No second service, no API key, no free-tier ceiling.

Since NLP was scoped to **augment the model** rather than power search, vector
search earns its place two ways:

### 5.1 Similar-case retrieval (officer-facing)

"Show me past projects whose consultation looked like this one." A panel on
Project Detail listing the 5 nearest SIA reports with their outcomes — direct
decision support, and a strong demo moment.

Because rows and vectors share a database, that's **one query** — the
similarity search and the project facts come back together:

```sql
SELECT p.case_id, p.project_type, p.district, pr.delayed, pr.risk_score,
       1 - (s.embedding <=> $1) AS similarity      -- <=> is cosine distance
FROM   sia_reports s
JOIN   projects    p  ON p.case_id = s.case_id
LEFT   JOIN predictions pr ON pr.case_id = s.case_id
WHERE  s.case_id <> $2                             -- exclude the project itself
ORDER  BY s.embedding <=> $1                       -- nearest first
LIMIT  5;
```

With a separate vector service this would be two round trips plus a manual
join in application code. Here it's SQL the team can read.

### 5.2 Neighbour features (model-facing)

For each project, the delay rate of its *k* nearest SIA reports becomes a
model feature. Real signal: projects whose consultations read alike tend to
fail alike.

```sql
-- knn_delay_rate for one project
SELECT AVG(CASE WHEN pr.delayed THEN 1.0 ELSE 0.0 END)
FROM  (SELECT case_id FROM sia_reports
       WHERE case_id <> $2
       ORDER BY embedding <=> $1
       LIMIT 10) nn
JOIN  predictions pr ON pr.case_id = nn.case_id;
```

> **Careful — leakage.** When building this feature for *training*, the
> neighbours must come from the training split only. Pulling neighbour labels
> from the full dataset leaks test labels into training and inflates every
> number in §7.3. Compute it inside the cross-validation fold.

### 5.3 Config

| Setting | Value |
|---|---|
| Extension | `vector` (pgvector ≥ 0.7) |
| Column | `sia_reports.embedding vector(384)` |
| Model | `all-MiniLM-L6-v2` → 384 dimensions |
| Distance | cosine (`<=>`) |
| Index | HNSW, `vector_cosine_ops` |
| Vectors | one per SIA report (~1,200 chars — no chunking needed) |

Python access: `pgvector-python` alongside `psycopg`, which registers the type
so a list of floats round-trips without manual serialisation.

---

## 6. NLP pipeline

### 6.1 Embeddings — `nlp/embed.py`

`sentence-transformers` with `all-MiniLM-L6-v2`. Local, free, no API key,
384-dim, runs on a laptop CPU in ~2 minutes for 5,000 reports. Vectors are
written straight into `sia_reports.embedding` — one `UPDATE` per report, or a
single batched write.

### 6.2 Feature extraction — `nlp/extract.py`

Produces the `nlp_features` row for each report:

| Feature | Method |
|---|---|
| `sentiment_score` | Logistic regression over the embedding, trained on a labelled slice |
| `objection_themes` | Multi-label classifier over the embedding |
| `objection_type` | 3-class classifier (procedural / fundamental / none) |
| `escalation_flag` | Classifier + keyword backstop ("High Court", "agitation") |
| `consultation_score` | Rule-based from extracted turnout numbers |

**Why classifiers over embeddings and not an LLM API:** no API key, no
per-call cost, no rate limit, runs offline, and the team can explain every
step. `docs/rules.md` rule 2 rules out paid services without approval.

**Explainability survives** — the model's inputs stay named and inspectable,
which is what the pitch rests on.

---

## 7. Risk model — `model/train.py`

### 7.1 Feature set

```
structured (from projects)     +  NLP-derived (nlp_features)  +  neighbour (pgvector kNN)
- consent_percentage              - sentiment_score               - knn_delay_rate
- compensation_disputed           - objection_type                - knn_mean_similarity
- stay_order_issued               - objection_themes (one-hot)
- case_pending_court              - escalation_flag
- rehabilitation_site_ready       - consultation_score
- district_historical_delay_rate
- ... (see architecture.md §2)
```

### 7.2 Algorithm

Start with **LogisticRegression**. Its coefficients map one-to-one onto the
"key drivers" list the UI already shows, so explainability comes free. Compare
against **GradientBoosting** and report both. `architecture.md` §6 already
says: pick on explainability, not raw accuracy.

### 7.3 The evaluation that matters

Train **three** models on the same split:

| Model | Features |
|---|---|
| A — baseline | structured only |
| B — + NLP | structured + NLP-derived |
| C — + neighbours | structured + NLP + pgvector kNN |

Report accuracy / precision / recall / ROC-AUC for each. **The A→B gap is the
entire justification for the NLP work.** Phase 0 (§3.3) is what makes that gap
real rather than manufactured.

This table is the strongest slide in the deck — it answers "why NLP?" with a
number instead of an adjective.

---

## 8. Backend — `backend/main.py`

FastAPI. Endpoints extend `architecture.md` §3:

| Method | Path | Returns |
|---|---|---|
| GET | `/projects` | list; filters `state`, `project_type`, `district`, `stage`, `risk_level` |
| GET | `/projects/{case_id}` | row + `sia_report` + `nlp_features` + `prediction` + `key_drivers` |
| GET | `/projects/{case_id}/similar` | **new** — k nearest SIA reports via pgvector, with outcomes |
| POST | `/projects` | **new** — create (Logs dashboard) |
| PATCH | `/projects/{case_id}` | **new** — update + write `change_log` |
| POST | `/predict` | run model on arbitrary input |
| GET | `/analytics/overview` | national + per-state KPIs |
| GET | `/analytics/by-state` | per-state aggregates |
| GET | `/analytics/by-project-type` | per-type delay rates |

Layering stays as the beta established: **no SQL outside `repository.py`**, so
the data layer is swappable. Config (`DATABASE_URL`) via environment variables
only — one connection string is now the entire data configuration.

---

## 9. Frontend changes

The static data files are deleted and replaced with real calls. The seams were
built for this:

| Now | Becomes |
|---|---|
| `js/sample-data.js` | `GET /analytics/overview` |
| `js/projects-data.js` (1 MB) | `GET /projects` |
| `js/sia-logs.js` (6 MB) | included in `GET /projects/{case_id}` |
| `js/project-overrides.js` (localStorage) | `PATCH /projects/{case_id}` |
| `computeDrivers()` in `detail.js` | `key_drivers` from the API |
| `js/pillar-scores.js` | `pillar_scores` from the API |

**~7 MB of bundled data disappears.** Page loads get dramatically faster.

`i18n.js` is unaffected — it translates the UI, not the data.

**New UI:** a "Similar past consultations" panel on Project Detail, fed by
`/projects/{case_id}/similar`.

---

## 10. Deployment

The current Netlify plan breaks the moment there's a backend — a static site
cannot reach a database on your laptop.

| Piece | Where | Free tier? |
|---|---|---|
| Frontend | Netlify (unchanged) | yes |
| Backend | Render / Railway / Fly.io | yes |
| PostgreSQL + pgvector | Neon / Supabase / Render | yes |

**Two services, not three.** Neon, Supabase and Render all ship pgvector —
enable it with `CREATE EXTENSION vector;`. Locally, `brew install pgvector`
alongside Postgres, or use the `pgvector/pgvector` Docker image.

Also needed: **CORS** on the backend allowing the Netlify origin, and
`DATABASE_URL` set as an environment variable in the host dashboard — never in
the repo. Add `.env` to `.gitignore` before this phase.

---

## 11. Build order

Each phase ends in something runnable and checkable (`rules.md` rule 8).

| Phase | Work | Done when |
|---|---|---|
| **0** | Regenerate SIA text + label (§3) | `generate_sia_logs_v2.py` produces text with no sentiment dependency; label depends on text-only factors |
| **1** | PostgreSQL + pgvector schema, load script | 5,000 rows queryable; counts match the CSV; `CREATE EXTENSION vector` succeeds |
| **2** | FastAPI read endpoints over Postgres | `/docs` returns real data; frontend switched off static files |
| **3** | Embeddings written to `sia_reports.embedding` | 5,000 vectors stored; HNSW index built; nearest-neighbour query returns sensible matches |
| **4** | NLP feature extraction | `nlp_features` populated for every case |
| **5** | Train + evaluate A/B/C models (§7.3) | the comparison table exists, with numbers |
| **6** | `/predict` + explainability wiring | Project Detail shows model-derived drivers |
| **7** | Write endpoints + `change_log` | Logs dashboard writes to Postgres |
| **8** | Deploy all three services | public URL works end to end |

Phase 0 gates everything. Phases 1–2 are worth doing even if NLP stalls —
they deliver the backend the beta never had.

---

## 12. Open questions / risks

1. **`prd.md` is still missing.** The driver→recommendation wording in
   `detail.js` remains DRAFT. Phase 6 needs it finalised.
2. **Team capacity.** This stack — Postgres, pgvector, transformers, FastAPI,
   a deployment pipeline — is a large step up from plain HTML and JS.
   `rules.md` rule 2 chose the beta stack precisely to avoid that curve.
   Phases 1–2 alone are a respectable round-two deliverable.
3. **Synthetic data ceiling.** Every metric describes the pipeline, not
   reality. This must be stated wherever numbers appear.
4. **kNN label leakage** (§5.2) — neighbour features must be computed inside
   the training fold, never across the full dataset, or §7.3's numbers are
   worthless.
5. **Cost of the sentiment removal.** Dropping `community_sentiment_score` as
   an input column changes the existing dashboard, the SIA card, and
   `pillar-scores.js`. Plan the UI migration alongside Phase 4.
6. **Timeline.** Against the calendar, Phases 0–2 are realistic for the next
   round; 3–8 are a stretch. Sequence by what the pitch needs most.
