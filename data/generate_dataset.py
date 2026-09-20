"""
Synthetic Land Acquisition Delay Dataset Generator
Built for SIH26017 - Predictive Analytics System for Early Detection of Land Acquisition Delays

Columns are grounded in the official 'Description of Study' parameter list, and correlation
logic is calibrated against real, published patterns from NJDG (delay reasons), DoLR/LACRRIS
(acquisition progress), and DILRMP (land record digitization stats) research.
"""

import numpy as np
import pandas as pd

np.random.seed(42)  # reproducible results every run

N = 5000  # number of synthetic project records

# ---- Reference lists ----
states = ["Maharashtra", "Uttar Pradesh", "Madhya Pradesh", "Odisha", "Bihar",
          "Gujarat", "Punjab", "West Bengal", "Rajasthan", "Karnataka"]

districts_per_state = {s: [f"{s}_District_{i}" for i in range(1, 5)] for s in states}

project_types = ["Highway", "Railway", "Irrigation", "Industrial Corridor",
                  "Urban Housing", "Mining", "Power Plant"]

acquiring_authorities = ["State PWD", "NHAI", "Indian Railways",
                          "State Industrial Dev. Corp", "Municipal Corporation",
                          "Irrigation Dept", "State Power Corp"]

land_types = ["Agricultural", "Forest", "Tribal/Scheduled Area",
              "Urban/Residential", "Wasteland"]

litigation_types = ["None", "Compensation Dispute", "Title Dispute",
                     "Public Purpose Challenge"]

possession_statuses = ["Not Started", "Partial", "Full"]

stage_of_process = ["Notification", "SIA", "Award Declared",
                     "Possession Taken", "Compensation Disbursed", "Closed"]

# Rough district-level "historical delay rate" - some districts are just slower
# (captures the 'historical performance' parameter from the official ask)
district_delay_baseline = {}
for s in states:
    for d in districts_per_state[s]:
        district_delay_baseline[d] = np.clip(np.random.beta(2, 3), 0.05, 0.9)

rows = []

for i in range(N):
    state = np.random.choice(states)
    district = np.random.choice(districts_per_state[state])
    project_type = np.random.choice(project_types)
    acquiring_authority = np.random.choice(acquiring_authorities)

    land_area_hectares = round(np.random.lognormal(mean=2.5, sigma=1.2), 2)
    land_type = np.random.choice(land_types, p=[0.45, 0.15, 0.15, 0.20, 0.05])
    num_affected_families = int(np.random.lognormal(mean=3.5, sigma=1.1))

    sia_conducted = np.random.rand() < 0.65
    consent_percentage = round(np.clip(np.random.normal(70, 20), 0, 100), 1)

    # Community sentiment score: what affected residents/stakeholders express
    # during the SIA / public consultation process (0 = strong opposition,
    # 1 = strong support). When SIA wasn't conducted, there's no real signal
    # to measure, so sentiment defaults lower (unknown/unaddressed concerns
    # are itself a risk signal) and is noisier. When SIA WAS conducted,
    # sentiment tends to track consent_percentage (people who consent are
    # more likely to have expressed support during SIA) but with its own
    # independent variation, since consent and sentiment aren't identical.
    if sia_conducted:
        community_sentiment_score = round(np.clip(
            np.random.normal(consent_percentage / 100, 0.15), 0, 1), 2)
    else:
        community_sentiment_score = round(np.clip(
            np.random.normal(0.35, 0.2), 0, 1), 2)
    compensation_offered_per_hectare = round(np.random.lognormal(mean=13, sigma=0.5), 0)
    compensation_disputed = np.random.rand() < (0.55 if consent_percentage < 60 else 0.2)

    land_records_digitized = np.random.rand() < 0.75  # DILRMP: ~95% rural digitized nationally,
                                                        # kept lower here to allow model signal
    survey_settlement_pending = np.random.rand() < 0.3

    approval_timeline_days = int(np.random.lognormal(mean=5.2, sigma=0.7))

    court_case_filed = np.random.rand() < (0.5 if compensation_disputed else 0.15)
    litigation_type = (np.random.choice(litigation_types[1:], p=[0.4, 0.4, 0.2])
                        if court_case_filed else "None")
    case_pending_court = court_case_filed and (np.random.rand() < 0.7)
    stay_order_issued = case_pending_court and (np.random.rand() < 0.35)
    case_pendency_duration_months = (int(np.random.lognormal(mean=2.8, sigma=0.8))
                                      if case_pending_court else 0)

    r_and_r_plan_prepared = np.random.rand() < 0.6
    families_to_be_resettled = int(num_affected_families * np.random.uniform(0.1, 0.6))
    rehabilitation_site_ready = np.random.rand() < (0.5 if r_and_r_plan_prepared else 0.15)
    livelihood_restoration_provided = rehabilitation_site_ready and (np.random.rand() < 0.6)

    stakeholder_responsiveness_score = round(np.clip(np.random.beta(3, 2), 0, 1), 2)
    awarding_officer_assigned = np.random.rand() < 0.8
    district_historical_delay_rate = round(district_delay_baseline[district], 2)
    days_since_notification = int(np.random.uniform(30, 1800))

    possession_status = np.random.choice(possession_statuses, p=[0.35, 0.4, 0.25])
    stage = np.random.choice(stage_of_process, p=[0.15, 0.15, 0.2, 0.2, 0.15, 0.15])

    # ---- Risk score: weighted combination of real-pattern-informed factors ----
    risk = 0.0
    risk += 0.20 if compensation_disputed else 0
    risk += 0.15 if stay_order_issued else 0
    risk += 0.10 if case_pending_court and not stay_order_issued else 0
    risk += 0.10 * (1 - consent_percentage / 100)
    risk += 0.08 if not land_records_digitized else 0
    risk += 0.08 if not sia_conducted else 0
    risk += 0.12 * (1 - community_sentiment_score)
    risk += 0.08 if survey_settlement_pending else 0
    risk += 0.10 if (not rehabilitation_site_ready and families_to_be_resettled > 20) else 0
    risk += 0.06 if not r_and_r_plan_prepared else 0
    risk += 0.05 if not awarding_officer_assigned else 0
    risk += 0.10 * district_historical_delay_rate
    risk += 0.05 * (1 - stakeholder_responsiveness_score)
    risk += 0.04 if land_type in ["Forest", "Tribal/Scheduled Area"] else 0
    risk += 0.03 if num_affected_families > 100 else 0

    # noise so it's not a perfectly deterministic rule (keeps it a real ML task)
    risk += np.random.normal(0, 0.07)
    risk = float(np.clip(risk, 0, 1))

    delayed = risk > 0.45
    delay_duration_months = round(max(0, risk * 30 + np.random.normal(0, 4)), 1) if delayed else round(
        max(0, np.random.normal(2, 1.5)), 1)

    rows.append(dict(
        case_id=f"LA{i+1:05d}",
        state=state, district=district, project_type=project_type,
        acquiring_authority=acquiring_authority,
        land_area_hectares=land_area_hectares, land_type=land_type,
        num_affected_families=num_affected_families,
        sia_conducted=sia_conducted, consent_percentage=consent_percentage,
        community_sentiment_score=community_sentiment_score,
        compensation_offered_per_hectare=compensation_offered_per_hectare,
        compensation_disputed=compensation_disputed,
        land_records_digitized=land_records_digitized,
        survey_settlement_pending=survey_settlement_pending,
        approval_timeline_days=approval_timeline_days,
        court_case_filed=court_case_filed, litigation_type=litigation_type,
        case_pending_court=case_pending_court, stay_order_issued=stay_order_issued,
        case_pendency_duration_months=case_pendency_duration_months,
        r_and_r_plan_prepared=r_and_r_plan_prepared,
        families_to_be_resettled=families_to_be_resettled,
        rehabilitation_site_ready=rehabilitation_site_ready,
        livelihood_restoration_provided=livelihood_restoration_provided,
        possession_status=possession_status,
        stakeholder_responsiveness_score=stakeholder_responsiveness_score,
        awarding_officer_assigned=awarding_officer_assigned,
        district_historical_delay_rate=district_historical_delay_rate,
        days_since_notification=days_since_notification,
        stage_of_process=stage,
        risk_score=round(risk, 3),
        delayed=delayed,
        delay_duration_months=delay_duration_months,
    ))

df = pd.DataFrame(rows)

# ---- Quick sanity checks ----
print("Shape:", df.shape)
print("\nDelayed rate overall:", df["delayed"].mean().round(3))
print("\nDelayed rate when compensation disputed:",
      df[df.compensation_disputed]["delayed"].mean().round(3))
print("Delayed rate when NOT disputed:",
      df[~df.compensation_disputed]["delayed"].mean().round(3))
print("\nDelayed rate when stay order issued:",
      df[df.stay_order_issued]["delayed"].mean().round(3))
print("\nDelayed rate when sentiment < 0.4 (opposed):",
      df[df.community_sentiment_score < 0.4]["delayed"].mean().round(3))
print("Delayed rate when sentiment > 0.7 (supportive):",
      df[df.community_sentiment_score > 0.7]["delayed"].mean().round(3))

df.to_csv("/home/claude/land_acquisition_synthetic.csv", index=False)
print("\nSaved to land_acquisition_synthetic.csv")
