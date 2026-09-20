/* Run: node frontend/js/pillar-scores.test.js  */
var assert = require("assert");
var computePillarScores = require("./pillar-scores").computePillarScores;

// An all-clear project: every pillar sub-score should be exactly 0.
var best = {
  compensation_disputed: false, consent_percentage: 100, sia_conducted: true,
  survey_settlement_pending: false, land_records_digitized: true,
  stay_order_issued: false, case_pending_court: false, court_case_filed: false,
  rehabilitation_site_ready: true, r_and_r_plan_prepared: true, families_to_be_resettled: 0,
  awarding_officer_assigned: true, district_historical_delay_rate: 0
};
assert.deepStrictEqual(computePillarScores(best), {
  acquisition_process_health: 0, legal_disputes: 0,
  rehabilitation_readiness: 0, administrative_efficiency: 0
}, "all-clear project -> all zero");

// A worst-case project (no stay order, case pending).
var worst = {
  compensation_disputed: true, consent_percentage: 0, sia_conducted: false,
  survey_settlement_pending: true, land_records_digitized: false,
  stay_order_issued: false, case_pending_court: true, court_case_filed: true,
  rehabilitation_site_ready: false, r_and_r_plan_prepared: false, families_to_be_resettled: 200,
  awarding_officer_assigned: false, district_historical_delay_rate: 1
};
var w = computePillarScores(worst);
assert.ok(w.acquisition_process_health > 0.999, "acq maxes out: " + w.acquisition_process_health);
assert.ok(Math.abs(w.legal_disputes - 0.4) < 1e-9, "legal (pending, no stay) = 0.10/0.25: " + w.legal_disputes);
assert.ok(w.rehabilitation_readiness > 0.999, "rehab maxes out: " + w.rehabilitation_readiness);
assert.ok(w.administrative_efficiency > 0.999, "admin maxes out: " + w.administrative_efficiency);

// With a stay order, the "pending" term drops and legal = 0.15/0.25 = 0.6.
var stay = Object.assign({}, worst, { stay_order_issued: true });
assert.ok(Math.abs(computePillarScores(stay).legal_disputes - 0.6) < 1e-9, "stay order -> legal 0.6");

// A just-logged project with missing numbers -> no NaN, values stay in [0,1].
var sparse = computePillarScores({});
Object.keys(sparse).forEach(function (k) {
  assert.ok(!isNaN(sparse[k]) && sparse[k] >= 0 && sparse[k] <= 1, "sparse " + k + " = " + sparse[k]);
});

console.log("pillar-scores: all checks passed");
