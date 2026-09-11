# Architecture — Land Acquisition Delay Risk Dashboard

## 1. High-level data flow

```
generate_dataset.py
        |
        v
land_acquisition_synthetic.csv
        |
        v
  SQLite (projects table)
        |
        +----------------------------+
        |                            |
        v                            v
  model_train.py               FastAPI backend (main.py)
  trains model,                queries SQLite for list/detail
  saves model.pkl                    |
        |                            v
        +------------------> loads model.pkl, runs .predict()
                                     |
                                     v
                          returns JSON (risk_score, drivers, recs)
                                     |
                                     v
                    Frontend (fetch() calls from JS files)
                                     |
                                     v
                     Rendered into the 4 dashboard tabs
```

## 2. Database schema (SQLite table: `projects`)

All columns come directly from `generate_dataset.py`. Do not rename or drop
columns without instruction — frontend and model code both depend on these
exact names.

| Column | Type | Notes |
|---|---|---|
| case_id | TEXT (primary key) | e.g. "LA00001" |
| state | TEXT | |
| district | TEXT | |
| project_type | TEXT | Highway, Railway, Irrigation, Industrial Corridor, Urban Housing, Mining, Power Plant |
| acquiring_authority | TEXT | |
| land_area_hectares | REAL | |
| land_type | TEXT | Agricultural, Forest, Tribal/Scheduled Area, Urban/Residential, Wasteland |
| num_affected_families | INTEGER | |
| sia_conducted | BOOLEAN | Social Impact Assessment done? |
| consent_percentage | REAL | 0-100 |
| community_sentiment_score | REAL | 0-1. What affected residents/stakeholders express during SIA/public consultation (0 = strong opposition, 1 = strong support). Proxy signal for this beta — see `memory.md` for how a future round would derive this from real NLP analysis of SIA reports instead. |
| compensation_offered_per_hectare | REAL | |
| compensation_disputed | BOOLEAN | |
| land_records_digitized | BOOLEAN | |
| survey_settlement_pending | BOOLEAN | |
| approval_timeline_days | INTEGER | |
| court_case_filed | BOOLEAN | |
| litigation_type | TEXT | None, Compensation Dispute, Title Dispute, Public Purpose Challenge |
| case_pending_court | BOOLEAN | |
| stay_order_issued | BOOLEAN | |
| case_pendency_duration_months | INTEGER | |
| r_and_r_plan_prepared | BOOLEAN | Rehabilitation & Resettlement plan |
| families_to_be_resettled | INTEGER | |
| rehabilitation_site_ready | BOOLEAN | |
| livelihood_restoration_provided | BOOLEAN | |
| possession_status | TEXT | Not Started, Partial, Full |
| stakeholder_responsiveness_score | REAL | 0-1 |
| awarding_officer_assigned | BOOLEAN | |
| district_historical_delay_rate | REAL | 0-1 |
| days_since_notification | INTEGER | |
| stage_of_process | TEXT | Notification, SIA, Award Declared, Possession Taken, Compensation Disbursed, Closed |
| risk_score | REAL | 0-1, model output (or precomputed for seed data) |
| delayed | BOOLEAN | model output / label |
| delay_duration_months | REAL | model output / label |

## 3. API endpoints (FastAPI)

| Method | Path | Purpose | Returns |
|---|---|---|---|
| GET | `/projects` | List all projects, with optional query params: `state`, `project_type`, `risk_level` | Array of project summaries (case_id, state, project_type, risk_score, delayed) |
| GET | `/projects/{case_id}` | Single project's full detail | Full row + `key_drivers` (list) + `recommendations` (list) |
| POST | `/predict` | Run model on arbitrary input features (for testing / future live-entry) | `{risk_score, delayed, key_drivers, recommendations}` |
| GET | `/analytics/by-state` | Aggregate avg risk score / delay rate per state | Array of `{state, avg_risk_score, delay_rate}` |
| GET | `/analytics/by-project-type` | Aggregate delay rate per project type | Array of `{project_type, delay_rate}` |

All responses are JSON. All endpoints should have basic error handling
(e.g. 404 if `case_id` not found) — keep error messages plain and specific,
not generic.

## 4. "Key drivers" logic (explainability)

Do NOT treat the model as a black box. For each prediction, determine which
of the following boolean/threshold conditions are true for that project, and
surface the top 3-4 as plain-language strings:

- `compensation_disputed = True` → "Compensation is disputed by landowners"
- `stay_order_issued = True` → "A court stay order is currently in effect"
- `consent_percentage < 60` → "Landowner consent is below the required threshold"
- `land_records_digitized = False` → "Land records are not yet digitized"
- `sia_conducted = False` → "Social Impact Assessment has not been conducted"
- `community_sentiment_score < 0.4` → "Local community sentiment is largely opposed to this acquisition"
- `rehabilitation_site_ready = False and families_to_be_resettled > 20` →
  "Resettlement site is not ready for the number of families affected"
- `district_historical_delay_rate > 0.5` → "This district has a history of
  delayed projects"

Map each driver to one recommended action (see `prd.md` for the
human-in-the-loop framing — recommendations are suggestions for officials,
never automatic).

## 5. Frontend structure

Four static HTML pages, one per tab, sharing `css/style.css` and per-page JS
files that call `js/api.js` helper functions (wrapping `fetch()`). Tabs link
to each other via normal `<a href="...">` navigation — no client-side router
needed for this scope.

## 6. Model

- Train with scikit-learn (`LogisticRegression` or `RandomForestClassifier`
  to start — pick based on what gives cleaner, more explainable outputs)
- Save with `joblib.dump(model, "model.pkl")`
- Backend loads `model.pkl` once at startup, not per-request
- Feature list for training = all columns except `case_id`, `risk_score`,
  `delayed`, `delay_duration_months` (those are the targets/outputs)
