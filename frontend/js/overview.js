/*
 * overview.js  --  logic for the Overview tab (index.html)
 *
 * What this file does:
 *   1. loads the overview data (national totals + per-state breakdown)
 *   2. fills in the three KPI cards
 *   3. handles the "National level" / "State level" switch
 *   4. when a state is chosen, updates the KPI cards AND opens the state popup
 *
 * Data source: right now this reads the static snapshot from sample-data.js.
 * getOverviewData() below is the ONE place that changes at backend integration.
 */

"use strict";


/* ==========================================================================
   Data access  --  the single seam between this page and where data comes from
   ========================================================================== */

function getOverviewData() {
  // TODAY: hand back the static snapshot, wrapped in a Promise so the rest of
  // this file is already written the "async" way.
  //
  // AT BACKEND INTEGRATION: replace the line below with a real request, e.g.
  //
  //   return fetch("/analytics/overview").then(function (response) {
  //     if (!response.ok) {
  //       throw new Error("Could not load overview data (" + response.status + ")");
  //     }
  //     return response.json();
  //   });
  //
  // Nothing else in this file needs to change, because it already waits on the
  // Promise that getOverviewData() returns.
  return Promise.resolve(window.OVERVIEW_SNAPSHOT);
}


/* ==========================================================================
   Small helpers
   ========================================================================== */

// Format a whole number the Indian way, e.g. 1488 -> "1,488", 100000 -> "1,00,000".
function formatNumber(value) {
  return value.toLocaleString("en-IN");
}

// The coloured "priority" badge for one project row.
// On this page every listed project is model-flagged (delayed = true), so the
// badge is always "High". Kept as a function so more levels can be added later
// without hunting through the code.
function priorityBadgeHtml() {
  return '<span class="badge badge--high">High priority</span>';
}


/* ==========================================================================
   Rendering
   ========================================================================== */

// Put one set of figures (either the national totals OR a single state's
// figures) into the three KPI cards, and update the "Showing: ..." label.
function renderKpis(figures, viewLabel) {
  document.getElementById("kpi-total").textContent = formatNumber(figures.total_cases);
  document.getElementById("kpi-highpri").textContent = formatNumber(figures.high_priority_cases);
  document.getElementById("kpi-legal").textContent = formatNumber(figures.legal_cases_pending);
  document.querySelector("#scope-label span").textContent = viewLabel;
}

// Fill in the state popup for one state and open it.
function showStatePopup(stateName, stateData) {
  document.getElementById("sd-state").textContent = stateName;
  document.getElementById("sd-summary").textContent =
    formatNumber(stateData.high_priority_cases) + " high-priority cases flagged for review  ·  " +
    formatNumber(stateData.legal_cases_pending) + " legal cases pending";

  // --- table 1: high-priority cases by department ---
  var deptBody = document.getElementById("sd-dept-body");
  deptBody.innerHTML = "";  // clear whatever a previous state left behind
  stateData.departments.forEach(function (row) {
    var tr = document.createElement("tr");
    tr.className = "border-t border-slate-100";
    tr.innerHTML =
      '<td class="py-1.5 pr-2">' + row.department + "</td>" +
      '<td class="py-1.5 text-right font-medium">' + formatNumber(row.high_priority_count) + "</td>";
    deptBody.appendChild(tr);
  });

  // --- table 2: the highest-risk individual projects ---
  // Each row is a shortcut: click it to jump straight to that project's
  // Project Detail page (the case_id and state travel in the URL).
  var projBody = document.getElementById("sd-proj-body");
  projBody.innerHTML = "";
  stateData.flagged_projects_top.forEach(function (project) {
    // The district values look like "Maharashtra_District_2". We're already
    // inside the Maharashtra popup, so drop the repeated state name.
    var shortDistrict = project.district.replace(stateName + "_", "").replace(/_/g, " ");
    var detailUrl = "project-detail.html?case_id=" + encodeURIComponent(project.case_id) +
                    "&state=" + encodeURIComponent(stateName);

    var tr = document.createElement("tr");
    tr.className = "border-t border-slate-100 cursor-pointer hover:bg-slate-50";
    tr.addEventListener("click", function () {
      window.location.href = detailUrl;
    });
    tr.innerHTML =
      '<td class="py-1.5 pr-3 font-mono text-xs">' +
        '<a href="' + detailUrl + '" class="text-blue-700 hover:underline">' + project.case_id + "</a></td>" +
      '<td class="py-1.5 pr-3">' + shortDistrict + "</td>" +
      '<td class="py-1.5 pr-3">' + project.project_type + "</td>" +
      '<td class="py-1.5 pr-3">' + project.department + "</td>" +
      '<td class="py-1.5 pr-3">' + priorityBadgeHtml() + "</td>" +
      '<td class="py-1.5 text-right tabular-nums">' + project.risk_score.toFixed(2) + "</td>";
    projBody.appendChild(tr);
  });

  document.getElementById("sd-proj-count").textContent =
    "(showing top " + stateData.flagged_projects_top.length +
    " of " + formatNumber(stateData.flagged_projects_total) + ")";

  document.getElementById("state-dialog").showModal();
}


/* ==========================================================================
   Wiring  --  runs once the page HTML and sample-data.js have both loaded
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {

  getOverviewData().then(function (overview) {

    // ---- start by PREVIEWING the national figures ----
    // Note: this is only a preview. The user still has to actively choose a
    // view (National level, or a State) before the Project List / Project
    // Detail tabs unlock - see app.js. So we do NOT call LaquiApp.setScope()
    // here; that happens only on a real click below.
    renderKpis(overview.national, "All of India (preview)");

    // ---- fill the state dropdown from whatever states the data contains ----
    var picker = document.getElementById("state-picker");
    Object.keys(overview.states).sort().forEach(function (stateName) {
      var option = document.createElement("option");
      option.value = stateName;
      option.textContent = stateName;
      picker.appendChild(option);
    });

    var btnNational = document.getElementById("scope-national");
    var btnState = document.getElementById("scope-state");
    var pickerWrap = document.getElementById("state-picker-wrap");

    // Mark whichever scope button is currently active (styled in style.css).
    // Nothing is active until the user picks one.
    function setActiveScope(which) {
      btnNational.classList.toggle("scope-btn--active", which === "national");
      btnState.classList.toggle("scope-btn--active", which === "state");
    }

    // If the user already chose a view earlier in this browser session
    // (e.g. they came back from another tab), restore that choice on load.
    var savedScope = LaquiApp.getScope();
    if (savedScope && savedScope.level === "national") {
      setActiveScope("national");
      renderKpis(overview.national, "All of India");
    } else if (savedScope && savedScope.level === "state" && overview.states[savedScope.state]) {
      setActiveScope("state");
      pickerWrap.classList.remove("hidden");
      picker.value = savedScope.state;
      renderKpis(overview.states[savedScope.state], savedScope.state);
    }

    // ---- "National level": show all-India figures + unlock the gated tabs ----
    btnNational.addEventListener("click", function () {
      setActiveScope("national");
      pickerWrap.classList.add("hidden");
      picker.value = "";
      renderKpis(overview.national, "All of India");
      LaquiApp.setScope({ level: "national" });   // <- unlocks Project List / Detail
    });

    // ---- "State level": reveal the state dropdown ----
    // Picking the button alone is not a complete choice yet - the tabs stay
    // locked until an actual state is selected below.
    btnState.addEventListener("click", function () {
      setActiveScope("state");
      pickerWrap.classList.remove("hidden");
      picker.focus();
    });

    // ---- choosing a state: update KPIs, open the popup, unlock the tabs ----
    picker.addEventListener("change", function () {
      var stateName = picker.value;
      if (!stateName) {
        return;  // the "- Select a state -" line is chosen; do nothing
      }
      var stateData = overview.states[stateName];
      LaquiApp.setScope({ level: "state", state: stateName });   // set scope FIRST,
                                                                 // so the popup's row
                                                                 // links work right away
      renderKpis(stateData, stateName);
      showStatePopup(stateName, stateData);
    });

    // ---- closing the popup ----
    var dialog = document.getElementById("state-dialog");
    document.getElementById("sd-close").addEventListener("click", function () {
      dialog.close();
    });
    // A click on the dark backdrop (outside the white box) also closes it.
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });
});
