"""
Phase 0 of docs/architecture-v2.md — regenerate the SIA corpus so NLP has
something real to read.

THE PROBLEM THIS FIXES
----------------------
In v1, generate_sia_logs.py picked the report text *from* the
community_sentiment_score, and that same score fed the risk formula:

    community_sentiment_score ──► SIA log text
                              └──► risk_score

So an NLP model reading that text would just recover the number that wrote it.
Perfect accuracy, zero information gained.

WHAT v2 DOES INSTEAD
--------------------
The generation order is inverted, and seven "text-only factors" are invented
per project. They are expressed ONLY in the report prose - never as columns:

    structured facts  ─┐
                       ├──► SIA report text ──► (later: NLP extracts features)
    text-only factors ─┘
                       └──► delay label

Because the label depends on factors that exist only in the text, a model
using the structured columns alone CANNOT reach them. An NLP model can. That
gap is what docs/architecture-v2.md §7.3 measures - and it is real here rather
than manufactured, because the factors are only partly predictable from the
structured columns (see FACTOR_CORRELATION below).

OUTPUT (all under data/v2/)
---------------------------
    projects.csv            structured columns + the new `delayed` label.
                            NO community_sentiment_score - that is now an NLP
                            OUTPUT, not an input. NO text-factor columns.
    sia_reports.csv         case_id + report_text + meeting/attendee counts.
    _text_factors_truth.csv the hidden factors, for VALIDATION ONLY.
                            Never train on this file - it is the answer key.

Run:  python3 generate_v2_dataset.py
Check: python3 check_v2_dataset.py
"""

from pathlib import Path

import numpy as np
import pandas as pd

SEED = 2026
rng = np.random.default_rng(SEED)

DATA_DIR = Path(__file__).resolve().parent
OUT_DIR = DATA_DIR / "v2"
OUT_DIR.mkdir(exist_ok=True)

# Columns dropped from the v1 dataset. The first is now an NLP output; the
# rest are model outputs that belong in the `predictions` table (v2 §4).
DROP_COLUMNS = ["community_sentiment_score", "risk_score", "delayed",
                "delay_duration_months"]


# ===========================================================================
# 1. The seven text-only factors
#
# Each is drawn with a base probability that shifts based on structured facts,
# so the factors are REALISTIC (a project already in court is likelier to
# contain escalation language) but NOT DETERMINED (plenty of court cases have
# no escalation, plenty of quiet projects do). That leftover randomness is
# exactly what only the text can tell you.
# ===========================================================================

STAKEHOLDER_GROUPS = ["landowning farmers", "tenant cultivators",
                      "agricultural labourers", "the local women's self-help group",
                      "elected Panchayat members", "local shopkeepers and traders",
                      "representatives of the Scheduled Tribe community"]


def draw_text_factors(row):
    """Invent the text-only circumstances for one project."""

    # --- objection_type: none | procedural | fundamental ---------------
    # Fundamental objections (public purpose challenged, displacement scale
    # disputed) are likelier where land is forest/tribal or already disputed.
    p_fundamental = 0.10
    if row["land_type"] in ("Forest", "Tribal/Scheduled Area"):
        p_fundamental += 0.18
    if row["compensation_disputed"]:
        p_fundamental += 0.12
    if row["court_case_filed"]:
        p_fundamental += 0.15
    p_procedural = 0.30                      # notice/turnout/process complaints
    draw = rng.random()
    if draw < p_fundamental:
        objection_type = "fundamental"
    elif draw < p_fundamental + p_procedural:
        objection_type = "procedural"
    else:
        objection_type = "none"

    # --- which groups objected ------------------------------------------
    # Tenant cultivators and labourers have weaker statutory standing under
    # the RFCTLARR Act, so their objections take longer to resolve.
    groups = []
    if objection_type != "none":
        n_groups = rng.integers(1, 4)
        weights = np.array([0.25, 0.18, 0.15, 0.10, 0.12, 0.08, 0.12])
        if row["land_type"] == "Tribal/Scheduled Area":
            weights[6] += 0.25               # tribal community far likelier
        if row["num_affected_families"] > 80:
            weights[1] += 0.12               # more tenants on bigger acquisitions
            weights[2] += 0.10
        weights = weights / weights.sum()
        groups = list(rng.choice(STAKEHOLDER_GROUPS, size=int(n_groups),
                                 replace=False, p=weights))

    # --- prior broken promises -------------------------------------------
    # Mostly independent: a neighbouring district's undisbursed compensation
    # is not visible in THIS project's columns at all.
    p_broken = 0.15 + (0.20 if row["district_historical_delay_rate"] > 0.5 else 0.0)
    prior_broken_promises = bool(rng.random() < p_broken)

    # --- turnout ratio (attendees / affected families) --------------------
    # Low turnout undermines the consultation's legitimacy later.
    turnout_ratio = float(np.clip(rng.normal(0.55, 0.28), 0.05, 1.6))

    # --- gram sabha outcome ----------------------------------------------
    if objection_type == "fundamental":
        outcome = rng.choice(["rejected", "deferred", "passed"], p=[0.45, 0.35, 0.20])
    elif objection_type == "procedural":
        outcome = rng.choice(["rejected", "deferred", "passed"], p=[0.12, 0.43, 0.45])
    else:
        outcome = rng.choice(["rejected", "deferred", "passed"], p=[0.03, 0.17, 0.80])

    # --- escalation language ---------------------------------------------
    p_escalate = 0.08
    if objection_type == "fundamental":
        p_escalate += 0.35
    if row["court_case_filed"]:
        p_escalate += 0.20
    if prior_broken_promises:
        p_escalate += 0.12
    escalation_language = bool(rng.random() < p_escalate)

    # --- culturally weighted asset loss -----------------------------------
    # Losses money does not settle. Tied loosely to land type.
    asset = "none"
    if rng.random() < 0.28:
        if row["land_type"] == "Agricultural":
            asset = rng.choice(["irrigation source", "grazing commons"], p=[0.7, 0.3])
        elif row["land_type"] == "Tribal/Scheduled Area":
            asset = rng.choice(["sacred grove", "burial ground", "grazing commons"],
                               p=[0.4, 0.35, 0.25])
        elif row["land_type"] == "Forest":
            asset = rng.choice(["grazing commons", "sacred grove"], p=[0.6, 0.4])
        else:
            asset = "community water tank"

    return {
        "objection_type": objection_type,
        "objecting_groups": groups,
        "prior_broken_promises": prior_broken_promises,
        "turnout_ratio": round(turnout_ratio, 2),
        "gram_sabha_outcome": str(outcome),
        "escalation_language": escalation_language,
        "asset_loss_type": asset,
    }


# ===========================================================================
# 2. The delay label
#
# Structured component = the v1 weights MINUS the sentiment term.
# Text component = the seven factors above, which appear nowhere in projects.csv.
# ===========================================================================

def structured_pressure(row):
    p = 0.0
    p += 0.20 if row["compensation_disputed"] else 0
    p += 0.15 if row["stay_order_issued"] else 0
    p += 0.10 if (row["case_pending_court"] and not row["stay_order_issued"]) else 0
    p += 0.10 * (1 - row["consent_percentage"] / 100)
    p += 0.08 if not row["land_records_digitized"] else 0
    p += 0.08 if not row["sia_conducted"] else 0
    p += 0.08 if row["survey_settlement_pending"] else 0
    p += 0.10 if (not row["rehabilitation_site_ready"]
                  and row["families_to_be_resettled"] > 20) else 0
    p += 0.06 if not row["r_and_r_plan_prepared"] else 0
    p += 0.05 if not row["awarding_officer_assigned"] else 0
    p += 0.10 * row["district_historical_delay_rate"]
    p += 0.05 * (1 - row["stakeholder_responsiveness_score"])
    p += 0.04 if row["land_type"] in ("Forest", "Tribal/Scheduled Area") else 0
    p += 0.03 if row["num_affected_families"] > 100 else 0
    return p


def text_pressure(f):
    """
    Delay pressure from factors that exist ONLY in the report prose.

    These weights are deliberately comparable to the structured ones. That is
    the project's own thesis - consultation dynamics are a first-class driver
    of delay, not a footnote (see PPT_Focus_Points.pdf, focus point 2). It is
    also what leaves measurable headroom for NLP: with small weights the
    structured model already predicts everything and reading the reports gains
    nothing. check_v2_dataset.py section 4 enforces that headroom.
    """
    p = 0.0
    p += 0.22 if f["objection_type"] == "fundamental" else 0
    p += 0.18 if f["gram_sabha_outcome"] == "rejected" else 0
    p += 0.14 if f["prior_broken_promises"] else 0
    p += 0.13 if f["escalation_language"] else 0
    p += 0.10 if "tenant cultivators" in f["objecting_groups"] else 0
    p += 0.10 if f["asset_loss_type"] != "none" else 0
    p += 0.09 if f["turnout_ratio"] < 0.30 else 0
    # Procedural objections drag too, just far less than fundamental ones.
    p += 0.06 if f["objection_type"] == "procedural" else 0
    return p


DELAY_THRESHOLD = 0.55      # tuned so the delay rate lands near v1's 29.8%


# ===========================================================================
# 3. Writing the report text
#
# Every factor above must be VISIBLE in the prose - that is the whole point.
# Nothing here reads a sentiment score or the label.
# ===========================================================================

VENUES = ["the Gram Panchayat office", "the village community hall",
          "a temporary shamiana erected near the proposed site",
          "the local primary school premises", "the block development office"]

PROCEDURAL_COMPLAINTS = [
    "meeting notices were not circulated widely enough, and several hamlets say they "
    "learned of the session only afterwards",
    "the notice period fell short of what attendees expected, leaving little time to "
    "consult family members working outside the district",
    "the draft rehabilitation schedule was read aloud but not distributed in writing, "
    "which several attendees objected to",
    "attendees asked why the survey map displayed at the meeting differed from the one "
    "circulated earlier",
]

FUNDAMENTAL_COMPLAINTS = [
    "a section of attendees questioned whether the stated public purpose justifies "
    "displacement at this scale, and asked for the project justification documents to "
    "be placed in the public domain",
    "several families disputed the necessity of the alignment itself, arguing an "
    "alternative route would avoid settled habitation entirely",
    "objections were raised to the acquisition in principle, not to its terms, with "
    "attendees stating that no compensation figure would be acceptable",
    "the assembly contested the classification of the land in the revenue record, "
    "which the acquiring authority has relied on to determine compensation",
]

BROKEN_PROMISE_LINES = [
    "Attendees repeatedly referred to an acquisition in a neighbouring district where "
    "compensation remains undisbursed after two years, and said they had no reason to "
    "expect different treatment here.",
    "Several speakers recalled assurances given during an earlier survey visit that were "
    "not honoured, and asked what guarantee distinguishes the present commitments.",
    "The consultation team noted visible distrust rooted in a prior project in the same "
    "block, where promised employment did not materialise.",
]

ESCALATION_LINES = [
    "Some attendees stated that they would approach the High Court if the award is "
    "declared without their objections being addressed in writing.",
    "A group of affected families indicated they have retained counsel and intend to "
    "file a writ petition should possession proceedings begin.",
    "Speakers warned of an indefinite dharna at the site office if the process continues "
    "without a further hearing.",
]

ASSET_LINES = {
    "irrigation source": "Attendees raised the loss of access to the minor irrigation "
                         "channel that supports the second cropping season for land "
                         "beyond the acquisition boundary.",
    "grazing commons": "The assembly recorded that the parcel includes common grazing "
                       "land used by households who own no land in the acquisition area "
                       "and would therefore receive no compensation.",
    "burial ground": "Objection was recorded to the inclusion of a community burial "
                     "ground within the boundary, which attendees said cannot be "
                     "relocated on any terms.",
    "sacred grove": "Attendees identified a sacred grove within the proposed boundary "
                    "and stated that its disturbance is not a matter for negotiation.",
    "community water tank": "The consultation noted that the village water tank falls "
                            "inside the boundary, with no alternative source identified "
                            "in the rehabilitation plan.",
}

OUTCOME_LINES = {
    "passed": "Outcome: the Gram Sabha passed a resolution recording no objection to the "
              "acquisition proceeding to the next stage.",
    "deferred": "Outcome: the Gram Sabha deferred its resolution, requesting a further "
                "sitting once written responses to the points above are furnished.",
    "rejected": "Outcome: the Gram Sabha declined to pass a resolution of consent, and "
                "recorded its objection to the acquisition as presently framed.",
}


def build_report(row, f):
    """
    Compose one SIA report. Reads facts + text factors; never the label.

    Returns (text, meeting_count, attendee_count) so the caller gets the
    numbers directly - no scraping them back out of the prose afterwards.
    """

    if not row["sia_conducted"]:
        text = (
            f"Social Impact Assessment Status — {row['project_type']} Project, "
            f"{row['district']}, {row['state']}\n\n"
            "No formal Social Impact Assessment has been conducted for this project as "
            "of the latest administrative review. Community consultation status: not "
            "initiated. Under Section 4 of the Right to Fair Compensation and "
            "Transparency in Land Acquisition, Rehabilitation and Resettlement Act, "
            "2013, an SIA is a mandatory pre-requisite for acquisitions of this nature "
            "and scale. This file is flagged pending initiation of the consultation "
            "process."
        )
        return text, 0, 0

    meetings = int(rng.integers(2, 5))
    affected = max(int(row["num_affected_families"]), 1)
    # A floor of 8 keeps tiny projects realistic (nobody holds three meetings
    # for two people), but it can push a small acquisition ABOVE 100% turnout.
    # Write the realised ratio back onto f so the commentary below and
    # text_pressure() both describe the numbers actually printed - otherwise
    # the prose contradicts itself.
    attendees = max(int(affected * f["turnout_ratio"]), 8)
    f["turnout_ratio"] = round(attendees / affected, 2)
    venue = rng.choice(VENUES)

    parts = [
        f"Social Impact Assessment Report — {row['project_type']} Project, "
        f"{row['district']}, {row['state']}\n",
        f"Consultation process: {meetings} public consultation meetings were held at "
        f"{venue} under the Gram Sabha / local body process required by the LARR Act, "
        f"2013. Approximately {attendees} persons attended across all sessions, against "
        f"{affected} families recorded as affected.",
    ]

    # Turnout commentary - lets the text carry legitimacy signal explicitly.
    if f["turnout_ratio"] < 0.30:
        parts.append(
            "The consultation team notes that attendance represented a small share of "
            "the affected households, and that the sessions may not reflect the views "
            "of the wider affected population."
        )
    elif f["turnout_ratio"] > 0.9:
        parts.append(
            "Attendance was high relative to the number of affected households, with "
            "participation from beyond the immediately affected families."
        )

    if f["objecting_groups"]:
        groups_text = ", ".join(f["objecting_groups"][:-1])
        groups_text = (groups_text + " and " + f["objecting_groups"][-1]
                       if len(f["objecting_groups"]) > 1 else f["objecting_groups"][0])
        parts.append(f"Objections at these sessions were raised principally by {groups_text}.")

    if f["objection_type"] == "procedural":
        parts.append("Nature of objections — procedural: "
                     + str(rng.choice(PROCEDURAL_COMPLAINTS)) + ".")
    elif f["objection_type"] == "fundamental":
        parts.append("Nature of objections — substantive: "
                     + str(rng.choice(FUNDAMENTAL_COMPLAINTS)) + ".")
    else:
        parts.append("No material objection to the acquisition was recorded during the "
                     "sessions; queries were limited to timelines and disbursement "
                     "procedure.")

    if f["prior_broken_promises"]:
        parts.append(str(rng.choice(BROKEN_PROMISE_LINES)))

    if f["asset_loss_type"] != "none":
        parts.append(ASSET_LINES[f["asset_loss_type"]])

    if f["escalation_language"]:
        parts.append(str(rng.choice(ESCALATION_LINES)))

    parts.append(OUTCOME_LINES[f["gram_sabha_outcome"]])

    return "\n\n".join(parts), meetings, attendees


# ===========================================================================
# 4. Run it
# ===========================================================================

def main():
    source = DATA_DIR / "land_acquisition_synthetic.csv"
    df = pd.read_csv(source)
    df["litigation_type"] = df["litigation_type"].fillna("None")
    print(f"Read {len(df)} rows from {source.name}")

    reports, factors, labels, durations = [], [], [], []

    for row in df.to_dict("records"):
        f = draw_text_factors(row)
        text, meetings, attendees = build_report(row, f)

        # Projects with no SIA have no report, so no text factors apply.
        t_pressure = text_pressure(f) if row["sia_conducted"] else 0.0
        pressure = structured_pressure(row) + t_pressure + rng.normal(0, 0.07)
        delayed = bool(pressure > DELAY_THRESHOLD)
        duration = (round(max(0.0, pressure * 30 + rng.normal(0, 4)), 1) if delayed
                    else round(max(0.0, rng.normal(2, 1.5)), 1))

        reports.append({
            "case_id": row["case_id"],
            "report_text": text,
            "meeting_count": meetings,
            "attendee_count": attendees,
        })
        factors.append({"case_id": row["case_id"],
                        **{k: (";".join(v) if isinstance(v, list) else v)
                           for k, v in f.items()}})
        labels.append(delayed)
        durations.append(duration)

    # --- projects.csv: structured columns + label. No sentiment, no factors.
    projects = df.drop(columns=[c for c in DROP_COLUMNS if c in df.columns]).copy()
    projects["delayed"] = labels
    projects["delay_duration_months"] = durations
    projects.to_csv(OUT_DIR / "projects.csv", index=False)

    pd.DataFrame(reports).to_csv(OUT_DIR / "sia_reports.csv", index=False)
    pd.DataFrame(factors).to_csv(OUT_DIR / "_text_factors_truth.csv", index=False)

    print(f"\nWrote {OUT_DIR}/")
    print(f"  projects.csv             {len(projects)} rows, {len(projects.columns)} cols"
          f"  (community_sentiment_score removed)")
    print(f"  sia_reports.csv          {len(reports)} reports")
    print(f"  _text_factors_truth.csv  validation only - never train on this")
    print(f"\nDelay rate: {np.mean(labels):.1%}   (v1 was 29.8%)")


if __name__ == "__main__":
    main()
