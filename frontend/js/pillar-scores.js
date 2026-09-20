/*
 * pillar-scores.js  --  rough 0-1 sub-score per pillar, for the Project Detail
 * "How is this calculated?" popover (task_quick_wins.md feature 3).
 *
 * It re-uses the SAME weights as data/generate_dataset.py's risk formula, split
 * into the four pillars and scaled to 0-1 within each group
 * (group's actual points / the group's maximum possible points).
 *
 * ROUGH ON PURPOSE - known limits (shown to the user in the popover too):
 *   - Only weights that map cleanly to one of the four field groups are used.
 *     Community sentiment (0.12), stakeholder responsiveness (0.05), land type
 *     (0.04) and affected-family count (0.03) are model factors that don't
 *     belong to a single pillar, so they are left out here. The four sub-scores
 *     therefore do NOT add up to the overall risk score.
 *   - court_case_filed has no weight of its own in the generator, so it does
 *     not move the legal sub-score.
 *   - Legal can't reach 1.0: the generator only counts "case pending" when
 *     there is no stay order, so stay + pending caps at 0.15 / 0.25 = 0.6.
 *
 * This is decision-support context for an officer, not a second model output.
 */

function computePillarScores(p) {
  // Missing numbers (e.g. a just-logged project) count as 0.
  var consent = Number(p.consent_percentage) || 0;
  var districtRate = Number(p.district_historical_delay_rate) || 0;

  // --- 1. acquisition process health  (group max 0.54) ---
  var acq =
    (p.compensation_disputed ? 0.20 : 0) +
    0.10 * (1 - consent / 100) +
    (p.sia_conducted ? 0 : 0.08) +
    (p.survey_settlement_pending ? 0.08 : 0) +
    (p.land_records_digitized ? 0 : 0.08);

  // --- 2. legal disputes  (group max 0.25) ---
  var legal =
    (p.stay_order_issued ? 0.15 : 0) +
    ((p.case_pending_court && !p.stay_order_issued) ? 0.10 : 0);
  // court_case_filed: no weight in generate_dataset.py -> not added

  // --- 3. rehabilitation readiness  (group max 0.16) ---
  var rehab =
    ((!p.rehabilitation_site_ready && p.families_to_be_resettled > 20) ? 0.10 : 0) +
    (p.r_and_r_plan_prepared ? 0 : 0.06);

  // --- 4. administrative efficiency  (group max 0.15) ---
  var admin =
    (p.awarding_officer_assigned ? 0 : 0.05) +
    0.10 * districtRate;

  function scale(value, max) {
    var s = value / max;
    if (isNaN(s)) { return 0; }
    return s < 0 ? 0 : (s > 1 ? 1 : s);
  }

  return {
    acquisition_process_health: scale(acq, 0.54),
    legal_disputes: scale(legal, 0.25),
    rehabilitation_readiness: scale(rehab, 0.16),
    administrative_efficiency: scale(admin, 0.15)
  };
}

// Works both as a browser <script> (attaches to window) and as a Node module
// (so pillar-scores.test.js can import it).
if (typeof window !== "undefined") { window.computePillarScores = computePillarScores; }
if (typeof module !== "undefined") { module.exports = { computePillarScores: computePillarScores }; }
