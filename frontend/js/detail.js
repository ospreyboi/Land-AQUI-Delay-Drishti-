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
  // Wording comes from i18n.js (keys "rec.*") so it exists in both languages;
  // the DRAFT / pending-prd.md caveat above still applies to both.
  var RECOMMENDATIONS = {
    compensation_disputed: I18N.t("rec.compensation_disputed"),
    stay_order: I18N.t("rec.stay_order"),
    consent: I18N.t("rec.consent"),
    digitize: I18N.t("rec.digitize"),
    sia: I18N.t("rec.sia"),
    sentiment: I18N.t("rec.sentiment"),
    rehab: I18N.t("rec.rehab"),
    district: I18N.t("rec.district")
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
    showMessage(I18N.t("detail.noneSelected.title"), I18N.t("detail.noneSelected.body"));
    return;
  }
  if (!project) {
    showMessage(I18N.t("detail.notFound.title", { id: caseId }), I18N.t("detail.notFound.body"));
    return;
  }

  // The actual render call is at the very BOTTOM of this file, so that the
  // lookup tables below (GROUPS, RECOMMENDATIONS, ...) are assigned before it runs.


  /* ==================================================================
     helpers
     ================================================================== */

  function el(id) { return document.getElementById(id); }

  function showMessage(title, body) {
    el("pd-message-title").textContent = title;
    el("pd-message-body").textContent = body;
    el("pd-message").classList.remove("hidden");
  }

  function yesNo(v) { return v ? I18N.t("yesNo.yes") : I18N.t("yesNo.no"); }

  // "Punjab_District_2" -> "District 2"  (leaves a plain name like "Bhopal" as-is)
  function shortDistrict(d) {
    if (!d) { return "—"; }
    if (d.indexOf("_") === -1) { return d; }
    var parts = d.split("_");   // ["Punjab", "District", "2"]
    return I18N.t("table.district") + " " + parts[2];
  }

  // Field metadata is shared with the Logs dashboard - see js/schema.js.
  // Labels come through I18N.fieldLabel() (falls back to PROJECT_SCHEMA.labels).
  var BOOLEAN_KEYS = PROJECT_SCHEMA.booleanKeys;
  var GROUPS = PROJECT_SCHEMA.groups;

  // Fields whose stored value is one of schema.js's fixed enums - translate
  // the DISPLAYED text only (formatValue never changes what's stored/compared).
  var ENUM_FIELD_KEYS = Object.keys(PROJECT_SCHEMA.enums);

  // Format one field value for display in the "full record" section.
  function formatValue(key, value) {
    if ((value === undefined || value === null || value === "") &&
        BOOLEAN_KEYS.indexOf(key) === -1) return "—";
    if (BOOLEAN_KEYS.indexOf(key) !== -1) return yesNo(value);
    if (ENUM_FIELD_KEYS.indexOf(key) !== -1) return I18N.tv(value);
    if (key === "state" || key === "district") return I18N.tv(value);
    if (key === "consent_percentage") return value + "%";
    if (key === "district_historical_delay_rate") return Math.round(value * 100) + "%";
    if (key === "community_sentiment_score" ||
        key === "stakeholder_responsiveness_score" ||
        key === "risk_score") return Number(value).toFixed(2);
    if (key === "land_area_hectares") return value + " " + I18N.t("unit.hectares");
    if (key === "compensation_offered_per_hectare") return "₹ " + Number(value).toLocaleString("en-IN") + " / " + I18N.t("unit.hectares");
    if (key === "delay_duration_months") return value + " " + I18N.t("unit.months");
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
        text: I18N.t("driver.compensation_disputed"),
        rec: RECOMMENDATIONS.compensation_disputed },
      { on: p.stay_order_issued,
        text: I18N.t("driver.stay_order"),
        rec: RECOMMENDATIONS.stay_order },
      { on: p.community_sentiment_score < 0.4,
        text: I18N.t("driver.sentiment"),
        rec: RECOMMENDATIONS.sentiment },
      { on: p.consent_percentage < 60,
        text: I18N.t("driver.consent"),
        rec: RECOMMENDATIONS.consent },
      { on: !p.rehabilitation_site_ready && p.families_to_be_resettled > 20,
        text: I18N.t("driver.rehab"),
        rec: RECOMMENDATIONS.rehab },
      { on: p.district_historical_delay_rate > 0.5,
        text: I18N.t("driver.district"),
        rec: RECOMMENDATIONS.district },
      { on: !p.land_records_digitized,
        text: I18N.t("driver.digitize"),
        rec: RECOMMENDATIONS.digitize },
      { on: !p.sia_conducted,
        text: I18N.t("driver.sia"),
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
      { name: I18N.t("pillar.1.title"), concerns: [
          !p.sia_conducted && I18N.t("concern.siaNotConducted"),
          p.consent_percentage < 60 && I18N.t("concern.consentBelow", { pct: p.consent_percentage }),
          p.community_sentiment_score < 0.4 && I18N.t("concern.sentimentLow", { score: p.community_sentiment_score.toFixed(2) }),
          p.compensation_disputed && I18N.t("concern.compDisputed"),
          !p.land_records_digitized && I18N.t("concern.recordsNotDigitised"),
          p.survey_settlement_pending && I18N.t("concern.surveyPending")
        ].filter(Boolean) },
      { name: I18N.t("pillar.2.title"), concerns: [
          p.stay_order_issued && I18N.t("concern.stayOrder"),
          p.case_pending_court && I18N.t("concern.casePending"),
          (p.court_case_filed && p.litigation_type && p.litigation_type !== "None") &&
            I18N.t("concern.litigation", { type: I18N.tv(p.litigation_type) })
        ].filter(Boolean) },
      { name: I18N.t("pillar.3.title"), concerns: [
          !p.r_and_r_plan_prepared && I18N.t("concern.rrPlanNotPrepared"),
          (!p.rehabilitation_site_ready && p.families_to_be_resettled > 20) &&
            I18N.t("concern.siteNotReady", { n: p.families_to_be_resettled }),
          !p.livelihood_restoration_provided && I18N.t("concern.livelihoodNotProvided")
        ].filter(Boolean) },
      { name: I18N.t("pillar.4.title"), concerns: [
          !p.awarding_officer_assigned && I18N.t("concern.noOfficer"),
          p.district_historical_delay_rate > 0.5 &&
            I18N.t("concern.districtHigh", { pct: Math.round(p.district_historical_delay_rate * 100) }),
          p.possession_status === "Not Started" && I18N.t("concern.possessionNotStarted"),
          p.stakeholder_responsiveness_score < 0.4 &&
            I18N.t("concern.responsivenessLow", { score: p.stakeholder_responsiveness_score.toFixed(2) })
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
               '<span class="stage-name">' + I18N.tv(name) + '</span>' +
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
      [I18N.t("pillar.1.name"), scores.acquisition_process_health],
      [I18N.t("pillar.2.name"), scores.legal_disputes],
      [I18N.t("pillar.3.name"), scores.rehabilitation_readiness],
      [I18N.t("pillar.4.name"), scores.administrative_efficiency]
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
    var logExists = !!(window.SIA_LOGS && window.SIA_LOGS[p.case_id]);
    var text = logExists ? window.SIA_LOGS[p.case_id] : I18N.t("detail.siaNoLog");
    // textContent (not innerHTML): show the report text exactly, no markup.
    // CSS .sia-log uses white-space: pre-wrap to keep the line breaks.
    el("pd-sia-text").textContent = text;
    el("pd-sia-sentiment").textContent = Number(p.community_sentiment_score).toFixed(2);
    // The log text itself is only ever generated in English (see js/sia-logs.js) -
    // say so when the page is in Hindi, rather than silently mixing languages.
    el("pd-sia-lang-note").classList.toggle("hidden", !(logExists && I18N.isHindi()));
  }


  /* ==================================================================
     Render
     ================================================================== */

  function renderDetail(p) {
    el("pd-content").classList.remove("hidden");
    document.title = p.case_id + " · " + I18N.t("nav.detail") + " · " + I18N.t("shell.dashboardTitle");

    // ---- header ----
    el("pd-caseid").textContent = (p.project_name ? p.project_name + "  ·  " : "") + p.case_id;
    if (isNewProject) {
      el("pd-caseid").insertAdjacentHTML("afterend",
        '<p class="text-xs text-amber-700 mt-0.5">' + I18N.t("detail.newProjectNotice") + '</p>');
    } else if (ProjectOverrides.get(p.case_id)) {
      el("pd-caseid").insertAdjacentHTML("afterend",
        '<p class="text-xs text-amber-700 mt-0.5">' + I18N.t("detail.editedNotice") + '</p>');
    }
    el("pd-header-facts").innerHTML = [
      [I18N.t("detail.projectType"), p.project_type ? I18N.tv(p.project_type) : "—"],
      [I18N.t("detail.location"), (p.state ? I18N.tv(p.state) : "—") + " / " + shortDistrict(p.district)],
      [I18N.t("detail.department"), p.acquiring_authority ? I18N.tv(p.acquiring_authority) : "—"],
      [I18N.t("detail.stageOfProcess"), p.stage_of_process ? I18N.tv(p.stage_of_process) : "—"]
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
        '<span class="badge badge--normal">' + I18N.t("detail.awaitingAssessment") + '</span>';
      el("pd-risk-duration").textContent = "";
    } else {
      el("pd-risk-score").textContent = p.risk_score.toFixed(2);
      bar.style.width = Math.round(p.risk_score * 100) + "%";
      bar.className = "h-2.5 rounded-full " + (p.delayed ? "bg-red-600" : "bg-blue-600");
      el("pd-risk-status").innerHTML = p.delayed
        ? '<span class="badge badge--high">' + I18N.t("detail.flaggedHighPriority") + '</span> &nbsp;' + I18N.t("detail.forOfficerReview")
        : '<span class="badge badge--normal">' + I18N.t("detail.notCurrentlyFlagged") + '</span>';
      el("pd-risk-duration").textContent = p.delayed
        ? I18N.t("detail.estimatedDelay", { n: Math.round(p.delay_duration_months) })
        : "";
    }
    renderPillarPopover(p);

    // ---- drivers + recommendations ----
    var drivers = computeDrivers(p);
    var driversBox = el("pd-drivers");
    if (drivers.length === 0) {
      driversBox.innerHTML = '<p class="text-sm text-slate-500">' + I18N.t("detail.noDrivers") + '</p>';
      el("pd-rec-note").textContent = "";
    } else {
      driversBox.innerHTML = drivers.map(function (d, i) {
        return '<div class="border border-slate-200 rounded-md p-3">' +
                 '<p class="text-sm font-medium text-slate-800">' + (i + 1) + '. ' + d.text + '</p>' +
                 '<p class="text-sm text-slate-600 mt-1">' +
                   '<span class="text-slate-400">' + I18N.t("detail.suggestedAction") + ' </span>' + d.rec +
                 '</p>' +
               '</div>';
      }).join("");
      el("pd-rec-note").textContent = I18N.t("detail.recNote");
    }

    // ---- community consultation (SIA) log ----
    renderSiaLog(p);

    // ---- four-pillar breakdown ----
    el("pd-pillars").innerHTML = pillarAssessment(p).map(function (pillar) {
      var hasConcerns = pillar.concerns.length > 0;
      var body = hasConcerns
        ? '<ul class="mt-2 text-sm text-slate-600 list-disc list-inside space-y-0.5">' +
            pillar.concerns.map(function (c) { return '<li>' + c + '</li>'; }).join("") + '</ul>'
        : '<p class="mt-2 text-sm text-slate-500">' + I18N.t("detail.nothingFlagged") + '</p>';
      return '<div class="pillar-card">' +
               '<p class="font-semibold text-slate-800">' + pillar.name + '</p>' +
               '<p class="text-sm font-medium ' +
                 (hasConcerns ? "pillar-status--attention" : "pillar-status--ok") + '">' +
                 (hasConcerns ? I18N.t("detail.needsAttention") : I18N.t("detail.noConcerns")) + '</p>' +
               body +
             '</div>';
    }).join("");

    // ---- full record ----
    el("pd-record").innerHTML = GROUPS.map(function (g) {
      var rows = g.keys.map(function (k) {
        return '<div class="flex justify-between gap-4 py-1 border-b border-slate-100">' +
                 '<dt class="text-slate-500">' + I18N.fieldLabel(k) + '</dt>' +
                 '<dd class="font-medium text-right">' + formatValue(k, p[k]) + '</dd>' +
               '</div>';
      }).join("");
      return '<div>' +
               '<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">' + I18N.groupTitle(g.title) + '</p>' +
               '<dl class="text-sm">' + rows + '</dl>' +
             '</div>';
    }).join("");
  }


  /* ==================================================================
     Kick it off (now that every lookup table above is assigned).
     ================================================================== */
  renderDetail(project);
})();
