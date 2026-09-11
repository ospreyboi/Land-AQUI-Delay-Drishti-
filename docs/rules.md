# Rules for building this project

These rules are constraints, not suggestions. Follow them even if a "better"
technical solution occurs to you — they exist because of team skill level,
timeline, and judging context, not just code quality.

## 1. Wait for explicit instructions per feature/page

Do not build ahead of what's been asked. The team lead will specify changes
page-by-page, feature-by-feature. If something in `prd.md` or
`architecture.md` seems incomplete or ambiguous, ask rather than assuming and
building it — this is a learning project for the team, and undirected large
changes are harder for them to review and understand.

## 2. Tech stack is fixed — do not substitute

- Frontend: plain HTML + CSS (Tailwind via CDN) + vanilla JavaScript only.
  **No React, Vue, Node build tools, or npm bundlers.** The team does not know
  these and doesn't have time to learn them.
- Backend: FastAPI + SQLite + scikit-learn + joblib. Do not introduce
  PostgreSQL, MongoDB, Docker, or cloud services unless explicitly asked.
- No paid services, no API keys requiring signup/billing, unless explicitly
  approved.

## 3. Code must be readable and commented

This team is actively learning to code, not just shipping. Every non-trivial
function needs a short comment explaining what it does and why. Prefer
straightforward, slightly verbose code over clever one-liners — the team
needs to be able to read and modify what's built.

## 4. Never invent data or features not in the schema

Use exactly the columns defined in `architecture.md`. Do not add speculative
fields, mock APIs, or invented data sources. If more data seems necessary,
flag it rather than fabricating it.

## 5. Explainability and human-in-the-loop are non-negotiable

Every prediction must be paired with plain-language reasoning (see
"key drivers" logic in `architecture.md`). The UI must never phrase output as
an automatic decision or final verdict — always as information for a human
official to review and act on. This is core to the project's pitch, not a
style preference.

## 6. Keep the beta scope honest

Do not silently build the full long-term vision (GIS maps, live alerts,
authentication, continuous learning). These are explicitly out of scope for
this beta — see `prd.md` section 3. If asked to build toward these later,
that will be a separate, explicit instruction.

## 7. Match existing naming exactly

Column names, endpoint paths, and file names are already decided in
`architecture.md` and `readme.md`. Don't rename things for "cleaner" code —
consistency across frontend/backend/model matters more than any individual
naming preference, since a name mismatch is the most common integration bug
for this kind of split-team build.

## 8. One thing at a time, verifiable at each step

Build and confirm one endpoint or one page works before moving to the next.
Don't produce a large multi-file change in one pass that can't be easily
tested or reviewed by the team.
