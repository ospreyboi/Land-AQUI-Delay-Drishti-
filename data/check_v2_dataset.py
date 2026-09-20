"""
Phase 0 gate — does the regenerated corpus actually support honest NLP work?

Run: python3 check_v2_dataset.py     (after generate_v2_dataset.py)

Four things get checked. The third and fourth are the ones that matter.

  1. community_sentiment_score is gone from projects.csv, and the label is not
     sitting in the report text.

  2. Report text is varied, not a handful of recycled templates.

  3. The text factors are NOT recoverable from the structured columns.
     If a structured model could predict "was there a fundamental objection?"
     with near-perfect accuracy, the text would be redundant and NLP pointless.

  4. THE HEADLINE: the text factors genuinely improve delay prediction.
     Model A uses structured columns only. Model B adds the true text factors.
     The AUC gap is the ceiling an NLP model could reach by reading the
     reports - the evidence that architecture-v2.md §7.3 will be measuring
     something real rather than manufactured.

Model B here uses the ANSWER KEY (_text_factors_truth.csv) on purpose: it
establishes the upper bound. A real NLP model extracting these from prose
will land somewhere between A and B.
"""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


def fit_logreg(X, y):
    """Scaled logistic regression - scaling keeps the solver from stalling."""
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000)).fit(X, y)

V2 = Path(__file__).resolve().parent / "v2"
SEED = 7

projects = pd.read_csv(V2 / "projects.csv")
reports = pd.read_csv(V2 / "sia_reports.csv")
truth = pd.read_csv(V2 / "_text_factors_truth.csv")
truth["objecting_groups"] = truth["objecting_groups"].fillna("")


def encode(df):
    """One-hot the categoricals, leave numbers alone."""
    return pd.get_dummies(df, drop_first=True).astype(float)


print("=" * 66)
print("1. STRUCTURE")
print("=" * 66)

assert "community_sentiment_score" not in projects.columns, \
    "community_sentiment_score is still an input column - the circularity is not fixed"
print("  community_sentiment_score removed from projects.csv     PASS")

assert len(projects) == len(reports) == len(truth) == 5000
print(f"  {len(projects)} projects / reports / factor rows, aligned        PASS")

leak_terms = ["delayed", "risk_score", "delay_duration"]
leaks = [t for t in leak_terms if reports["report_text"].str.contains(t, case=False).any()]
assert not leaks, f"report text mentions the label: {leaks}"
print("  report text never names the label                       PASS")


print()
print("=" * 66)
print("2. TEXT VARIETY")
print("=" * 66)

conducted = reports[reports["report_text"].str.startswith("Social Impact Assessment Report")]
uniq = conducted["report_text"].nunique()
print(f"  {uniq} distinct reports out of {len(conducted)} with an SIA")
assert uniq / len(conducted) > 0.95, "reports are too repetitive"
print("  >95% distinct                                           PASS")
print(f"  mean length {int(conducted['report_text'].str.len().mean())} chars")


print()
print("=" * 66)
print("3. ARE THE TEXT FACTORS HIDDEN FROM THE STRUCTURED COLUMNS?")
print("=" * 66)
print("  (0.50 = invisible, 1.00 = fully determined. We want clearly < 1.)")
print()

X_struct = encode(projects.drop(columns=["case_id", "delayed", "delay_duration_months",
                                         "state", "district"]))

for factor, positive in [("objection_type", "fundamental"),
                         ("gram_sabha_outcome", "rejected"),
                         ("prior_broken_promises", True),
                         ("escalation_language", True)]:
    y = (truth[factor] == positive).astype(int)
    Xtr, Xte, ytr, yte = train_test_split(X_struct, y, test_size=0.3,
                                          random_state=SEED, stratify=y)
    m = fit_logreg(Xtr, ytr)
    auc = roc_auc_score(yte, m.predict_proba(Xte)[:, 1])
    verdict = "ok" if auc < 0.85 else "TOO PREDICTABLE"
    print(f"  {factor:<24} {positive!s:<12} AUC {auc:.3f}   {verdict}")
    assert auc < 0.85, f"{factor} is recoverable from structured columns - text adds nothing"

print()
print("  All text factors keep meaningful independence            PASS")


print()
print("=" * 66)
print("4. DO THE TEXT FACTORS IMPROVE DELAY PREDICTION?")
print("=" * 66)

y = projects["delayed"].astype(int)

text_feats = encode(truth[["objection_type", "gram_sabha_outcome",
                           "prior_broken_promises", "escalation_language",
                           "turnout_ratio", "asset_loss_type"]])
text_feats["tenant_objection"] = truth["objecting_groups"] \
    .str.contains("tenant cultivators").astype(float)

X_a = X_struct
X_b = pd.concat([X_struct.reset_index(drop=True),
                 text_feats.reset_index(drop=True)], axis=1)

idx_tr, idx_te = train_test_split(np.arange(len(y)), test_size=0.3,
                                  random_state=SEED, stratify=y)

results = {}
for name, X in [("A  structured only", X_a), ("B  + text factors", X_b)]:
    m = fit_logreg(X.iloc[idx_tr], y.iloc[idx_tr])
    auc = roc_auc_score(y.iloc[idx_te], m.predict_proba(X.iloc[idx_te])[:, 1])
    acc = m.score(X.iloc[idx_te], y.iloc[idx_te])
    results[name] = auc
    print(f"  {name:<22} AUC {auc:.4f}   accuracy {acc:.3f}")

gap = results["B  + text factors"] - results["A  structured only"]
print()
print(f"  Headroom for NLP:  +{gap:.4f} AUC")

assert gap > 0.02, (
    f"text factors add only {gap:.4f} AUC - not enough signal to justify NLP. "
    "Increase the text_pressure weights in generate_v2_dataset.py."
)
print("  Text carries real, measurable signal                     PASS")

print()
print("=" * 66)
print("PHASE 0 GATE: PASSED")
print("=" * 66)
print("The SIA text now holds information the structured columns do not.")
print(f"An NLP model that reads the reports perfectly would gain ~{gap:.3f} AUC.")
print("Anything it actually achieves lands between Model A and Model B.")
