/*
 * detail.js  --  logic for the Project Detail page (project-detail.html)
 *
 * Reads ?case_id=LA00123 from the URL, finds that project in projects-data.js,
 * and renders:
 *   - a header with the key facts
 *   - the model risk score + flag status
 *   - "key drivers": plain-language reasons (docs/architecture.md §4)
 *   - a suggested action for each driver
 *   - the four-pillar breakdown
 *   - the full project record
 *
 * At backend integration this becomes  fetch("/projects/" + caseId)  which per
 * architecture.md returns the row plus key_drivers and recommendations.
 */

"use strict";

(function () {

  // Gate 1: must be signed in (redirects to login.html if not).
  var session = LaquiApp.requireLogin();
  if (!session) {
    return;
  }

  // Gate 2: must have chosen a view on the Overview page (redirects to index.html).
  var scope = LaquiApp.requireScope();
  if (!scope) {
    return;
  }

  /* ----------------------------------------------------------------------
     DRAFT recommendation wording.
     docs/architecture.md §4 lists the key DRIVERS and says "map each driver to
     one recommended action (see prd.md)". prd.md is not in the repo yet, so the
     text below is a DRAFT for the team's domain reviewer to confirm. It is
     grounded in the RFCTLARR Act, 2013 process but is not final wording.
     ---------------------------------------------------------------------- */
  var RECOMMENDATIONS = {
    compensation_disputed:
      "Convene a compensation review with the District Collector; re-examine the award against current circle rates and the RFCTLARR Act, 2013 solatium and multiplier provisions.",
    stay_order:
      "Refer the case to the Government Pleader for early vacation of the stay; hold possession until the court's direction is received.",
    consent:
      "Resume consent-building consultations with the affected families; record objections and reassess whether the consent threshold for this project category can be met.",
    digitize:
      "Coordinate with the DILRMP cell / Tehsildar to digitise and reconcile the relevant land records before the award stage.",
    sia:
      "Commission the Social Impact Assessment through the appointed agency before issuing further notifications, as required under the RFCTLARR Act, 2013.",
    sentiment:
      "Hold a public hearing / gram sabha consultation to record and address grievances, and brief the project authority on the level of local opposition.",
    rehab:
      "Escalate resettlement-site development with the R&R Administrator; confirm the site infrastructure and allotment plan before possession is taken.",
    district:
      "Place the project under the district review committee for closer monitoring, with a fortnightly progress review."
  };


  /* ---- which project? ---- */

  var params = new URLSearchParams(window.location.search);
  var caseId = (params.get("case_id") || "").trim().toUpperCase();

  var shipped = caseId
    ? PROJECTS.find(function (p) { return p.case_id === caseId; })
    : null;
  // A shipped project + local edits, OR a project created on the Logs dashboard.
  var project = shipped ? ProjectOverrides.merge(shipped)
                        : ProjectOverrides.getNew(caseId);
  var isNewProject = !shipped && !!project;

  if (!caseId) {
    showMessage("No project selected",
      "Open a project from the Project List, or from a state's popup on the Overview page.");
    return;
  }
  if (!project) {
    showMessage("Project " + caseId + " was not found",
      "Check the case ID, or return to the Project List to pick a project.");
    return;
  }

  // The actual render call is at the very BOTTOM of this file, so that the
  // lookup tables below (LABELS, GROUPS, ...) are assigned before it runs.


  /* ==================================================================
     helpers
     ================================================================== */

  function el(id) { return document.getElementById(id); }

  function showMessage(title, body) {
    el("pd-message-title").textContent = title;
    el("pd-message-body").textContent = body;
    el("pd-message").classList.remove("hidden");
  }

  function yesNo(v) { return v ? "Yes" : "No"; }

  // "Punjab_District_2" -> "District 2"  (leaves a plain name like "Bhopal" as-is)
  function shortDistrict(d) {
    if (!d) { return "—"; }
    return d.indexOf("_") === -1 ? d : d.split("_").slice(1).join(" ");
  }

  // Field metadata is shared with the Logs dashboard - see js/schema.js.
  var BOOLEAN_KEYS = PROJECT_SCHEMA.booleanKeys;
  var LABELS = PROJECT_SCHEMA.labels;
  var GROUPS = PROJECT_SCHEMA.groups;

  // Format one field value for display in the "full record" section.
  function formatValue(key, value) {
    if ((value === undefined || value === null || value === "") &&
        BOOLEAN_KEYS.indexOf(key) === -1) return "—";
    if (BOOLEAN_KEYS.indexOf(key) !== -1) return yesNo(value);
    if (key === "consent_percentage") return value + "%";
    if (key === "district_historical_delay_rate") return Math.round(value * 100) + "%";
    if (key === "community_sentiment_score" ||
        key === "stakeholder_responsiveness_score" ||
        key === "risk_score") return Number(value).toFixed(2);
    if (key === "land_area_hectares") return value + " ha";
    if (key === "compensation_offered_per_hectare") return "₹ " + Number(value).toLocaleString("en-IN") + " / ha";
    if (key === "delay_duration_months") return value + " months";
    return String(value);
  }


  /* ==================================================================
     Key drivers  (exactly the conditions from docs/architecture.md §4).
     Ordered most-significant first, using the relative weights baked into
     data/generate_dataset.py.
     ================================================================== */

  function computeDrivers(p) {
    var candidates = [
      { on: p.compensation_disputed,
        text: "Compensation is disputed by the landowners",
        rec: RECOMMENDATIONS.compensation_disputed },
      { on: p.stay_order_issued,
        text: "A court stay order is currently in effect",
        rec: RECOMMENDATIONS.stay_order },
      { on: p.community_sentiment_score < 0.4,
        text: "Local community sentiment is largely opposed to this acquisition",
        rec: RECOMMENDATIONS.sentiment },
      { on: p.consent_percentage < 60,
        text: "Landowner consent is below the required threshold",
        rec: RECOMMENDATIONS.consent },
      { on: !p.rehabilitation_site_ready && p.families_to_be_resettled > 20,
        text: "The resettlement site is not ready for the number of families affected",
        rec: RECOMMENDATIONS.rehab },
      { on: p.district_historical_delay_rate > 0.5,
        text: "This district has a history of delayed projects",
        rec: RECOMMENDATIONS.district },
      { on: !p.land_records_digitized,
        text: "Land records are not yet digitised",
        rec: RECOMMENDATIONS.digitize },
      { on: !p.sia_conducted,
        text: "A Social Impact Assessment has not been conducted",
        rec: RECOMMENDATIONS.sia }
    ];
    return candidates.filter(function (c) { return c.on; });
  }


  /* ==================================================================
     Four-pillar breakdown - a transparent, rule-based summary (NOT a second
     model). For each pillar it lists the specific concerns found in that
     project's data; no concerns => "No concerns flagged".
     ================================================================== */

  function pillarAssessment(p) {
    return [
      { name: "1. Acquisition process health", concerns: [
          !p.sia_conducted && "SIA not conducted",
          p.consent_percentage < 60 && ("Consent below threshold (" + p.consent_percentage + "%)"),
          p.community_sentiment_score < 0.4 && ("Community sentiment low (" + p.community_sentiment_score.toFixed(2) + ")"),
          p.compensation_disputed && "Compensation disputed",
          !p.land_records_digitized && "Land records not digitised",
          p.survey_settlement_pending && "Survey / settlement pending"
        ].filter(Boolean) },
      { name: "2. Legal disputes", concerns: [
          p.stay_order_issued && "Stay order in effect",
          p.case_pending_court && "Case pending in court",
          (p.court_case_filed && p.litigation_type && p.litigation_type !== "None") && ("Litigation: " + p.litigation_type)
        ].filter(Boolean) },
      { name: "3. Rehabilitation readiness", concerns: [
          !p.r_and_r_plan_prepared && "R&R plan not prepared",
          (!p.rehabilitation_site_ready && p.families_to_be_resettled > 20) && ("Site not ready for " + p.families_to_be_resettled + " families"),
          !p.livelihood_restoration_provided && "Livelihood restoration not provided"
        ].filter(Boolean) },
      { name: "4. Administrative efficiency", concerns: [
          !p.awarding_officer_assigned && "No awarding officer assigned",
          p.district_historical_delay_rate > 0.5 && ("District delay history high (" + Math.round(p.district_historical_delay_rate * 100) + "%)"),
          p.possession_status === "Not Started" && "Possession not started",
          p.stakeholder_responsiveness_score < 0.4 && ("Stakeholder responsiveness low (" + p.stakeholder_responsiveness_score.toFixed(2) + ")")
        ].filter(Boolean) }
    ];
  }


  /* ==================================================================
     Stage / lifecycle tracker  (feature 2)
     ================================================================== */

  // Fixed order from task_quick_wins.md / docs/architecture.md schema notes.
  var STAGES = ["Notification", "SIA", "Award Declared", "Possession Taken",
                "Compensation Disbursed", "Closed"];

  function renderStageTracker(p) {
    var current = STAGES.indexOf(p.stage_of_process);   // -1 if unknown -> all greyed
    el("pd-stage-steps").innerHTML = STAGES.map(function (name, i) {
      var done = (i <= current);
      var cls = "stage-step" + (done ? " stage-step--done" : "") +
                (i === current ? " stage-step--current" : "");
      var mark = (i < current) ? "✓" : String(i + 1);
      return '<li class="' + cls + '">' +
               '<span class="stage-dot">' + mark + '</span>' +
               '<span class="stage-name">' + name + '</span>' +
             '</li>';
    }).join("");
  }


  /* ==================================================================
     "How is this calculated?" pillar-score popover  (feature 3)
     Explains the score - it never states a decision (docs/rules.md).
     ================================================================== */

  function renderPillarPopover(p) {
    var scores = computePillarScores(p);   // from js/pillar-scores.js
    var rows = [
      ["Acquisition process health", scores.acquisition_process_health],
      ["Legal disputes", scores.legal_disputes],
      ["Rehabilitation readiness", scores.rehabilitation_readiness],
      ["Administrative efficiency", scores.administrative_efficiency]
    ];
    el("pd-pillar-bars").innerHTML = rows.map(function (r) {
      var pct = Math.round(r[1] * 100);
      return '<div class="mt-1.5">' +
               '<div class="flex justify-between text-xs text-slate-600">' +
                 '<span>' + r[0] + '</span><span class="tabular-nums">' + r[1].toFixed(2) + '</span>' +
               '</div>' +
               '<div class="h-1.5 bg-slate-200 rounded-full mt-0.5">' +
                 '<div class="h-1.5 bg-blue-600 rounded-full" style="width:' + pct + '%"></div>' +
               '</div>' +
             '</div>';
    }).join("");

    // click the link to toggle; a click anywhere else closes it
    var pop = el("pd-pillar-pop");
    el("pd-pillar-info").addEventListener("click", function (event) {
      event.stopPropagation();
      pop.classList.toggle("hidden");
    });
    document.addEventListener("click", function () {
      pop.classList.add("hidden");
    });
  }


  /* ==================================================================
     Community Consultation (SIA) log  (feature 1)
     Verbatim text from js/sia-logs.js, keyed by case_id. Shown as filed -
     if the SIA wasn't conducted, the log text itself says so.
     ================================================================== */

  function renderSiaLog(p) {
    var text = (window.SIA_LOGS && window.SIA_LOGS[p.case_id]) ||
               "No consultation log is on file for this project.";
    // textContent (not innerHTML): show the report text exactly, no markup.
    // CSS .sia-log uses white-space: pre-wrap to keep the line breaks.
    el("pd-sia-text").textContent = text;
    el("pd-sia-sentiment").textContent = Number(p.community_sentiment_score).toFixed(2);
  }


  /* ==================================================================
     Render
     ================================================================== */

  function renderDetail(p) {
    el("pd-content").classList.remove("hidden");
    document.title = p.case_id + " · Project Detail · Land Acquisition Delay Risk Dashboard";

    // ---- header ----
    el("pd-caseid").textContent = (p.project_name ? p.project_name + "  ·  " : "") + p.case_id;
    if (isNewProject) {
      el("pd-caseid").insertAdjacentHTML("afterend",
        '<p class="text-xs text-amber-700 mt-0.5">Logged on the Logs dashboard (this browser). ' +
        'The model has not assessed it yet, so there is no risk score - the points below are ' +
        'from the entered data.</p>');
    } else if (ProjectOverrides.get(p.case_id)) {
      el("pd-caseid").insertAdjacentHTML("afterend",
        '<p class="text-xs text-amber-700 mt-0.5">Includes field edits saved on the Logs dashboard ' +
        '(this browser). The risk score below is the last model run - the model re-runs server-side.</p>');
    }
    el("pd-header-facts").innerHTML = [
      ["Project type", p.project_type || "—"],
      ["Location", (p.state || "—") + " / " + shortDistrict(p.district)],
      ["Department", p.acquiring_authority || "—"],
      ["Stage of process", p.stage_of_process || "—"]
    ].map(function (row) {
      return '<div><p class="text-slate-500">' + row[0] + '</p>' +
             '<p class="font-medium">' + row[1] + '</p></div>';
    }).join("");

    // ---- stage tracker ----
    renderStageTracker(p);

    // ---- risk panel ----
    var bar = el("pd-risk-bar");
    if (typeof p.risk_score !== "number") {
      // New project - the model hasn't run.
      el("pd-risk-score").textContent = "—";
      bar.style.width = "0%";
      el("pd-risk-status").innerHTML =
        '<span class="badge badge--normal">Awaiting model assessment</span>';
      el("pd-risk-duration").textContent = "";
    } else {
      el("pd-risk-score").textContent = p.risk_score.toFixed(2);
      bar.style.width = Math.round(p.risk_score * 100) + "%";
      bar.className = "h-2.5 rounded-full " + (p.delayed ? "bg-red-600" : "bg-blue-600");
      el("pd-risk-status").innerHTML = p.delayed
        ? '<span class="badge badge--high">Flagged high-priority</span> &nbsp;for officer review'
        : '<span class="badge badge--normal">Not currently flagged</span>';
      el("pd-risk-duration").textContent = p.delayed
        ? "Model-estimated delay if it occurs: about " + Math.round(p.delay_duration_months) + " months."
        : "";
    }
    renderPillarPopover(p);

    // ---- drivers + recommendations ----
    var drivers = computeDrivers(p);
    var driversBox = el("pd-drivers");
    if (drivers.length === 0) {
      driversBox.innerHTML =
        '<p class="text-sm text-slate-500">No major risk drivers were identified from the available data for this project.</p>';
      el("pd-rec-note").textContent = "";
    } else {
      driversBox.innerHTML = drivers.map(function (d, i) {
        return '<div class="border border-slate-200 rounded-md p-3">' +
                 '<p class="text-sm font-medium text-slate-800">' + (i + 1) + '. ' + d.text + '</p>' +
                 '<p class="text-sm text-slate-600 mt-1">' +
                   '<span class="text-slate-400">Suggested action &mdash; </span>' + d.rec +
                 '</p>' +
               '</div>';
      }).join("");
      el("pd-rec-note").textContent =
        "Suggested actions are DRAFT wording for the reviewing officer, pending finalisation with prd.md. " +
        "They are prompts for consideration, not automatic directives.";
    }

    // ---- community consultation (SIA) log ----
    renderSiaLog(p);

    // ---- four-pillar breakdown ----
    el("pd-pillars").innerHTML = pillarAssessment(p).map(function (pillar) {
      var hasConcerns = pillar.concerns.length > 0;
      var body = hasConcerns
        ? '<ul class="mt-2 text-sm text-slate-600 list-disc list-inside space-y-0.5">' +
            pillar.concerns.map(function (c) { return '<li>' + c + '</li>'; }).join("") + '</ul>'
        : '<p class="mt-2 text-sm text-slate-500">Nothing in this area is flagged for this project.</p>';
      return '<div class="pillar-card">' +
               '<p class="font-semibold text-slate-800">' + pillar.name + '</p>' +
               '<p class="text-sm font-medium ' +
                 (hasConcerns ? "pillar-status--attention" : "pillar-status--ok") + '">' +
                 (hasConcerns ? "Needs attention" : "No concerns flagged") + '</p>' +
               body +
             '</div>';
    }).join("");

    // ---- full record ----
    el("pd-record").innerHTML = GROUPS.map(function (g) {
      var rows = g.keys.map(function (k) {
        return '<div class="flex justify-between gap-4 py-1 border-b border-slate-100">' +
                 '<dt class="text-slate-500">' + (LABELS[k] || k) + '</dt>' +
                 '<dd class="font-medium text-right">' + formatValue(k, p[k]) + '</dd>' +
               '</div>';
      }).join("");
      return '<div>' +
               '<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">' + g.title + '</p>' +
               '<dl class="text-sm">' + rows + '</dl>' +
             '</div>';
    }).join("");
  }


  /* ==================================================================
     Kick it off (now that every lookup table above is assigned).
     ================================================================== */
  renderDetail(project);
})();
