# Project memory / context

This file captures decisions made so far and why, so context isn't lost when
new instructions come in piecemeal. Read this before making assumptions about
scope or intent.

## Problem statement

**SIH26017 — Predictive Analytics System for Early Detection of Land
Acquisition Delays.** Ministry of Rural Development, Dept. of Land Resources
(DoLR). Team pivoted to this from an earlier idea (SIH26188, a document-fraud
detection system) after evaluating fit and learning goals.

## Why this framing: 4 focus areas

The team chose to organize the whole project around 4 pillars, each mapped to
causes named explicitly in the official problem statement's background text
(prolonged administrative approvals, legal disputes, delayed compensation,
incomplete documentation, pending notifications, land ownership conflicts,
rehabilitation/resettlement challenges, inter-departmental coordination):

1. **Acquisition process health** (SIA, consent, compensation, documentation)
2. **Legal disputes** (court cases, stay orders, litigation type)
3. **Rehabilitation readiness** (R&R plan, resettlement site status)
4. **Administrative efficiency** (officer assignment, district historical
   performance)

This 4-pillar structure appears throughout the dashboard (Overview tab
breakdown, per-project breakdown on Detail tab) and is a deliberate
differentiator in the pitch — do not remove or restructure it without
instruction.

## Why a risk score

The official problem statement explicitly asks for a risk score three
separate times ("generate a risk score for each project", "risk scoring and
prioritization", "risk categorization" in dashboards). It is not decorative —
it IS the model's core prediction output, just presented for a non-technical
official. Everything else (drivers, recommendations, pillar breakdown) exists
to explain that one number.

## Why human-in-the-loop / explainable framing

Team deliberately reframed the system away from a fully automated
fake/real-style verdict toward one where AI flags + explains risk, and a
human official makes the final call. This is both (a) a better real-world fit
for high-stakes government decisions, and (b) a stronger, more responsible-AI
pitch to judges. Carried through consistently — do not let any feature imply
an automatic/final decision.

## Why GIS map view was dropped

Originally planned as a 5th tab. Dropped due to time constraints (true GIS
needs geocoded lat/long data the team doesn't have, and building it eats
time better spent on the core predictive features). State/district analytics
tab covers similar prioritization value without the geocoding overhead. If
asked about this gap in Q&A, team's answer is: scoped out for time, state/
district analytics gives equivalent insight, map layer is a natural addition
later.

## Why this tech stack

Team is entirely amateur-level, working under a 1-month total timeline (with
a beta due in ~1 week). Every choice optimizes for "learnable and debuggable
fast" over "impressive/scalable":
- SQLite over Postgres/Mongo: zero setup, matches tabular data shape
- FastAPI over Flask: similar effort, but free auto-generated API docs are
  useful for demoing to judges
- Plain HTML/CSS/JS over React: avoids a real framework learning curve the
  team doesn't have time for; dashboard's actual interactivity needs
  (tab switching, fetching data, filtering a table) don't require React
- Tailwind CSS: faster path to polished visual design than hand-written CSS

## Database: stayed on SQLite (PostgreSQL considered and deferred)

Team considered switching to PostgreSQL, reasoning that land acquisition is
sensitive data and deserves a "more serious" database. Decision: stay on
SQLite for this beta — data sensitivity is primarily about access control and
governance, not which DB engine is used, and switching now adds real setup
risk this close to the Sept 10 deadline for a demo only the team/judges will
touch. This is framed as a deliberate, presentable choice in the pitch:
SQLite for rapid prototyping now, PostgreSQL as the natural production
upgrade for real multi-user government deployment. Revisit in later rounds,
not before.

## Community sentiment as a feature (added)

Team wanted SIA (Social Impact Assessment) and community sentiment to be a
primary driver of predictions, reasoning that SIA's real purpose is capturing
what affected people think, and that signal should meaningfully inform delay
risk. Decision: added `community_sentiment_score` (0-1) as a new dataset
column rather than hard-coding SIA/sentiment as a manually-forced dominant
weight — the model should be allowed to learn which features matter most
from the data, which is both better ML practice and a stronger story for
judges ("the model discovered sentiment matters, we didn't assume it").

For this beta, `community_sentiment_score` is a synthetic proxy (correlated
with `consent_percentage` when SIA was conducted, lower/noisier when it
wasn't). A future round would replace this proxy with real NLP sentiment
analysis of actual SIA report text / public consultation records — flag this
explicitly as a next step if asked in Q&A, don't present the proxy as if it
were derived from real text analysis.

## Dataset

Real row-level land acquisition case data is not realistically obtainable
from Indian government sources in this timeframe (NJDG/LACRRIS/data.gov.in
expose aggregate dashboards, not bulk exportable per-case records). Team
built a **synthetic dataset, calibrated to real published patterns** (NJDG
delay-reason stats, DoLR/LACRRIS structure, DILRMP digitization rates,
academic litigation-delay studies) rather than pure random data. This is
disclosed transparently in the pitch, not hidden. Generator script:
`data/generate_dataset.py`, 5,000 rows, 33 columns. Correlation logic is
deliberately baked in (e.g. disputed compensation → ~57% delay rate vs ~5%
for undisputed) so the data is a genuinely learnable ML task, not noise.

## Team roles (current, as of last discussion)

| Person | Role |
|---|---|
| Akshaj (lead) | AI/ML — model training, evaluation, feature/driver logic; coordinates across all tracks |
| Silviya + Harshangi | UI/UX design + frontend build (together) |
| Arpan | Frontend integration — connects built UI to backend API |
| Prathmesh | Backend/API — FastAPI, database, model serving |
| Priyanshie | Domain research — feeds content into pitch/deck |
| Silviya + Harshangi + Priyanshie | PPT slide design (split three ways) |
| Arpan | PPT presenting/structuring |

Roles have changed multiple times during planning — this table is the latest
state. If a future instruction references an older role split, this table
takes precedence unless told otherwise.

## Timeline

- **10 Sept**: PPT + video submission for SIH internal round
- **12 Sept**: Internal hackathon round
- This beta build (frontend + backend, not necessarily fully integrated) is
  meant to be demoable by these dates. Full integration and polish is
  expected to continue into later rounds — this is not the final build.

## Dashboard structure (4 tabs, finalized)

1. Overview — KPIs, risk distribution, top high-risk projects, 4-pillar
   national breakdown
2. Project List — filterable/sortable table, color-coded risk badges
3. Project Detail — risk score, key drivers (plain language), recommended
   actions, per-project pillar breakdown
4. District/State Analytics — state comparison, project-type delay rates,
   historical district performance

A clickable wireframe mockup already exists (`dashboard_wireframe.html`) —
use it as the structural/layout reference, not the final visual design.
