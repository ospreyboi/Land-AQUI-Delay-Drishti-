/*
 * schema.js  --  ONE definition of the project fields.
 *
 * Shared by the viewing dashboard (project-detail.html) and the Logs data-entry
 * dashboard (logs.html) so the two always show the same fields with the same
 * labels. At backend integration this mirrors the columns returned by
 * GET /projects/{case_id}.
 */

window.PROJECT_SCHEMA = (function () {

  // Field -> human label (verbatim from the old detail.js copy, keep in sync).
  var labels = {
    case_id: "Project number", project_name: "Project name",
    state: "State", district: "District", project_type: "Project type",
    acquiring_authority: "Acquiring authority (department)", land_area_hectares: "Land area", land_type: "Land type",
    num_affected_families: "Affected families", sia_conducted: "SIA conducted",
    consent_percentage: "Landowner consent", community_sentiment_score: "Community sentiment (0–1)",
    compensation_offered_per_hectare: "Compensation offered", compensation_disputed: "Compensation disputed",
    land_records_digitized: "Land records digitised", survey_settlement_pending: "Survey / settlement pending",
    approval_timeline_days: "Approval timeline (days)", court_case_filed: "Court case filed",
    litigation_type: "Litigation type", case_pending_court: "Case pending in court",
    stay_order_issued: "Stay order issued", case_pendency_duration_months: "Case pendency (months)",
    r_and_r_plan_prepared: "R&R plan prepared", families_to_be_resettled: "Families to be resettled",
    rehabilitation_site_ready: "Rehabilitation site ready",
    livelihood_restoration_provided: "Livelihood restoration provided", possession_status: "Possession status",
    stakeholder_responsiveness_score: "Stakeholder responsiveness (0–1)",
    awarding_officer_assigned: "Awarding officer assigned",
    district_historical_delay_rate: "District historical delay rate",
    days_since_notification: "Days since notification", stage_of_process: "Stage of process",
    risk_score: "Model risk score", delayed: "Flagged as likely to be delayed",
    delay_duration_months: "Model-estimated delay (if it occurs)"
  };

  // Display groups. The middle four are the four pillars (docs/memory.md).
  var groups = [
    { title: "Identification", keys: ["case_id", "project_name", "state", "district", "project_type"] },
    { title: "Status", keys: ["acquiring_authority", "stage_of_process"] },
    { title: "Project scale", keys: ["land_area_hectares", "land_type", "num_affected_families"] },
    { title: "1. Acquisition process health", keys: ["sia_conducted", "consent_percentage", "community_sentiment_score", "compensation_offered_per_hectare", "compensation_disputed", "land_records_digitized", "survey_settlement_pending", "approval_timeline_days"] },
    { title: "2. Legal disputes", keys: ["court_case_filed", "litigation_type", "case_pending_court", "stay_order_issued", "case_pendency_duration_months"] },
    { title: "3. Rehabilitation readiness", keys: ["r_and_r_plan_prepared", "families_to_be_resettled", "rehabilitation_site_ready", "livelihood_restoration_provided"] },
    { title: "4. Administrative efficiency", keys: ["possession_status", "stakeholder_responsiveness_score", "awarding_officer_assigned", "district_historical_delay_rate", "days_since_notification"] },
    { title: "Model output", keys: ["risk_score", "delayed", "delay_duration_months"] }
  ];

  // Columns stored as true/false.
  var booleanKeys = ["sia_conducted", "compensation_disputed", "land_records_digitized",
    "survey_settlement_pending", "court_case_filed", "case_pending_court", "stay_order_issued",
    "r_and_r_plan_prepared", "rehabilitation_site_ready", "livelihood_restoration_provided",
    "awarding_officer_assigned", "delayed"];

  // Fixed option lists (docs/architecture.md / generate_dataset.py).
  var enums = {
    project_type: ["Highway", "Railway", "Irrigation", "Industrial Corridor", "Urban Housing", "Mining", "Power Plant"],
    land_type: ["Agricultural", "Forest", "Tribal/Scheduled Area", "Urban/Residential", "Wasteland"],
    acquiring_authority: ["State PWD", "NHAI", "Indian Railways", "State Industrial Dev. Corp", "Municipal Corporation", "Irrigation Dept", "State Power Corp"],
    litigation_type: ["None", "Compensation Dispute", "Title Dispute", "Public Purpose Challenge"],
    possession_status: ["Not Started", "Partial", "Full"],
    stage_of_process: ["Notification", "SIA", "Award Declared", "Possession Taken", "Compensation Disbursed", "Closed"]
  };

  // min / max / step for number inputs where it matters (default step 1).
  var numberMeta = {
    consent_percentage: { min: 0, max: 100, step: 1, unit: "%" },
    community_sentiment_score: { min: 0, max: 1, step: 0.01 },
    stakeholder_responsiveness_score: { min: 0, max: 1, step: 0.01 },
    district_historical_delay_rate: { min: 0, max: 1, step: 0.01 },
    land_area_hectares: { min: 0, step: 0.01, unit: "ha" },
    compensation_offered_per_hectare: { min: 0, step: 1000, unit: "₹/ha" },
    num_affected_families: { min: 0, step: 1 },
    families_to_be_resettled: { min: 0, step: 1 },
    approval_timeline_days: { min: 0, step: 1 },
    case_pendency_duration_months: { min: 0, step: 1 },
    days_since_notification: { min: 0, step: 1 }
  };

  return {
    labels: labels,
    groups: groups,
    booleanKeys: booleanKeys,
    enums: enums,
    numberMeta: numberMeta,
    // Free-text fields (everything else numeric unless enum/boolean).
    textKeys: ["project_name", "state", "district"],
    // Groups the Logs form shows when EDITING a shipped project (identity fixed).
    formGroupTitles: ["Status", "Project scale", "1. Acquisition process health",
      "2. Legal disputes", "3. Rehabilitation readiness", "4. Administrative efficiency"],
    // Groups shown when LOGGING A NEW project (identity is entered too).
    newFormGroupTitles: ["Identification", "Status", "Project scale",
      "1. Acquisition process health", "2. Legal disputes",
      "3. Rehabilitation readiness", "4. Administrative efficiency"],
    // Always read-only (auto-assigned). state/district/project_type are also
    // locked when editing a shipped project - see logs.js.
    identityKeys: ["case_id", "state", "district", "project_type"]
  };
})();
