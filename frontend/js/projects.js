/*
 * projects.js  --  logic for the Project List page (projects.html)
 *
 * Shows every project for the chosen view (one State, or All of India) in a
 * filterable table, highest model risk score first. Clicking a row opens that
 * project's detail page.
 *
 * Data source: projects-data.js (the temporary full snapshot). At backend
 * integration this becomes  fetch("/projects?state=...&project_type=...&...")
 * with the filters sent as query params - see docs/architecture.md.
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

  var isNational = (scope.level === "national");

  // Projects for this view, already narrowed to the scope, highest risk first.
  var scopeProjects = isNational
    ? PROJECTS.slice()
    : PROJECTS.filter(function (p) { return p.state === scope.state; });
  scopeProjects.sort(function (a, b) { return b.risk_score - a.risk_score; });

  // Cap on rows drawn at once. A single state has ~500 projects (all shown);
  // "All of India" has 5000, so we show the 500 highest-risk and say so.
  var MAX_ROWS = 500;

  // Fixed reference lists - straight from docs/architecture.md. Do not edit.
  var PROJECT_TYPES = ["Highway", "Railway", "Irrigation", "Industrial Corridor",
                       "Urban Housing", "Mining", "Power Plant"];
  var STAGES = ["Notification", "SIA", "Award Declared", "Possession Taken",
                "Compensation Disbursed", "Closed"];
  var POSSESSION_STATUSES = ["Not Started", "Partial", "Full"];


  /* ---- small helpers ---- */

  function el(id) { return document.getElementById(id); }
  function value(id) { return el(id).value; }

  function fillSelect(id, items, labelFn) {
    var select = el(id);
    items.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item;
      option.textContent = labelFn ? labelFn(item) : item;
      select.appendChild(option);
    });
  }

  // "Punjab_District_2" -> "District 2"  (state scope)
  //                     -> "Punjab / District 2"  (national scope, so it's unambiguous)
  function districtLabel(fullName) {
    var parts = fullName.split("_");            // ["Punjab", "District", "2"]
    var shortName = I18N.t("table.district") + " " + parts[2];   // "District 2"
    return isNational ? I18N.tv(parts[0]) + " / " + shortName : shortName;
  }

  function priorityBadge(project) {
    return project.delayed
      ? '<span class="badge badge--high">' + I18N.t("badge.highPriority") + '</span>'
      : '<span class="badge badge--normal">' + I18N.t("badge.standard") + '</span>';
  }

  // Refill the district dropdown for a given state ("" = every district in scope).
  function fillDistrictOptions(stateName) {
    el("f-district").innerHTML = '<option value="">All districts</option>';
    var pool = stateName
      ? scopeProjects.filter(function (p) { return p.state === stateName; })
      : scopeProjects;
    var districts = Array.from(new Set(pool.map(function (p) { return p.district; }))).sort();
    fillSelect("f-district", districts, districtLabel);
  }


  /* ---- filter + render ---- */

  function currentFilters() {
    return {
      state: isNational ? value("f-state") : scope.state,
      type: value("f-type"),
      district: value("f-district"),
      caseId: value("f-caseid").trim().toUpperCase(),
      stage: value("f-stage"),
      possession: value("f-possession"),
      risk: value("f-risk")   // "" | "flagged" | "notflagged"
    };
  }

  function matchesFilters(project, f) {
    if (f.state && project.state !== f.state) return false;
    if (f.type && project.project_type !== f.type) return false;
    if (f.district && project.district !== f.district) return false;
    if (f.caseId && project.case_id.indexOf(f.caseId) === -1) return false;
    if (f.stage && project.stage_of_process !== f.stage) return false;
    if (f.possession && project.possession_status !== f.possession) return false;
    if (f.risk === "flagged" && !project.delayed) return false;
    if (f.risk === "notflagged" && project.delayed) return false;
    return true;
  }

  function render() {
    var f = currentFilters();
    var results = scopeProjects.filter(function (p) { return matchesFilters(p, f); });
    renderDepartmentSummary(results);
    renderTable(results);
  }

  // A one-line "flagged projects by department" summary of the current results.
  function renderDepartmentSummary(results) {
    var counts = {};
    results.forEach(function (p) {
      if (p.delayed) {
        counts[p.acquiring_authority] = (counts[p.acquiring_authority] || 0) + 1;
      }
    });
    var rows = Object.keys(counts)
      .map(function (dept) { return { dept: dept, n: counts[dept] }; })
      .sort(function (a, b) { return b.n - a.n; });

    var box = el("pl-dept");
    if (rows.length === 0) {
      box.innerHTML = '<span class="text-slate-400">' + I18N.t("projects.noneMatch") + '</span>';
      return;
    }
    box.innerHTML = rows.map(function (r) {
      return '<span class="inline-block mr-4 mb-1">' +
               '<span class="font-medium">' + I18N.tv(r.dept) + '</span> ' +
               '<span class="text-slate-500">' + r.n + '</span>' +
             '</span>';
    }).join("");
  }

  function renderTable(results) {
    var body = el("pl-body");
    body.innerHTML = "";

    results.slice(0, MAX_ROWS).forEach(function (p) {
      var url = "project-detail.html?case_id=" + encodeURIComponent(p.case_id) +
                "&state=" + encodeURIComponent(p.state);

      var tr = document.createElement("tr");
      tr.className = "border-t border-slate-100 cursor-pointer hover:bg-slate-50";
      tr.addEventListener("click", function () { window.location.href = url; });
      tr.innerHTML =
        '<td class="py-1.5 pr-3 font-mono text-xs">' +
          '<a href="' + url + '" class="text-blue-700 hover:underline">' + p.case_id + '</a></td>' +
        '<td class="py-1.5 pr-3">' + districtLabel(p.district) + '</td>' +
        '<td class="py-1.5 pr-3">' + I18N.tv(p.project_type) + '</td>' +
        '<td class="py-1.5 pr-3">' + I18N.tv(p.acquiring_authority) + '</td>' +
        '<td class="py-1.5 pr-3">' + I18N.tv(p.stage_of_process) + '</td>' +
        '<td class="py-1.5 pr-3">' + I18N.tv(p.possession_status) + '</td>' +
        '<td class="py-1.5 pr-3">' + priorityBadge(p) + '</td>' +
        '<td class="py-1.5 text-right tabular-nums">' + p.risk_score.toFixed(2) + '</td>';
      body.appendChild(tr);
    });

    var total = results.length;
    el("pl-count").textContent = (total > MAX_ROWS)
      ? I18N.t("projects.showingTop", { max: MAX_ROWS, total: total.toLocaleString("en-IN") })
      : I18N.t("projects.showingAll", { n: total.toLocaleString("en-IN"), s: (total === 1 ? "" : "s") });
  }


  /* ---- set-up (runs now - this script is at the end of <body>) ---- */

  el("pl-scope").textContent = LaquiApp.scopeLabel(scope);
  el("pl-scope-count").textContent = I18N.t("projects.projectsOnRecord", {
    n: scopeProjects.length.toLocaleString("en-IN")
  });

  if (isNational) {
    var states = Array.from(new Set(PROJECTS.map(function (p) { return p.state; }))).sort();
    fillSelect("f-state", states, I18N.tv);
    el("f-state").addEventListener("change", function () {
      fillDistrictOptions(value("f-state"));   // district options follow the state
      render();
    });
  } else {
    el("f-state-wrap").classList.add("hidden");   // one state only - no state filter
  }

  fillSelect("f-type", PROJECT_TYPES, I18N.tv);
  fillSelect("f-stage", STAGES, I18N.tv);
  fillSelect("f-possession", POSSESSION_STATUSES, I18N.tv);
  fillDistrictOptions(isNational ? "" : scope.state);

  ["f-type", "f-district", "f-stage", "f-possession", "f-risk"].forEach(function (id) {
    el(id).addEventListener("change", render);
  });
  el("f-caseid").addEventListener("input", render);

  el("f-clear").addEventListener("click", function () {
    ["f-state", "f-type", "f-district", "f-caseid", "f-stage", "f-possession", "f-risk"]
      .forEach(function (id) { if (el(id)) el(id).value = ""; });
    fillDistrictOptions(isNational ? "" : scope.state);
    render();
  });

  render();
})();
