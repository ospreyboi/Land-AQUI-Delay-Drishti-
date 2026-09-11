/*
 * logs.js  --  the Logs data-entry dashboard (logs.html)
 *
 * Only for users signed in with the "logs" role. Two things:
 *   - "+ New project": enter a name + department + the rest of the fields;
 *     the project number is assigned automatically.
 *   - pick an existing project and edit the same fields the viewing dashboard
 *     shows.
 * Everything is saved via project-overrides.js (localStorage) and merged into
 * the viewing dashboard.
 */

"use strict";

(function () {

  var session = LaquiApp.requireLogin();
  if (!session) { return; }
  if (session.role !== "logs") {
    window.location.href = "index.html";   // this dashboard is for the logs role only
    return;
  }

  var S = PROJECT_SCHEMA;

  function el(id) { return document.getElementById(id); }

  // Shipped projects, by case_id.
  var byId = {};
  PROJECTS.forEach(function (p) { byId[p.case_id] = p; });

  var picker = el("lg-picker");
  var formBox = el("lg-form");
  var actions = el("lg-actions");

  var mode = null;       // "new" | "edit"
  var currentId = null;


  /* ---- project number for a new entry: highest existing + 1 ---- */

  function nextCaseId() {
    var max = 0;
    function consider(id) {
      var n = parseInt(String(id).replace(/\D/g, ""), 10);
      if (n > max) { max = n; }
    }
    Object.keys(byId).forEach(consider);
    Object.keys(ProjectOverrides.all()).forEach(consider);
    return "LA" + String(max + 1).padStart(5, "0");
  }


  /* ---- rebuild the dropdown (shipped + any new projects) ---- */

  function fillPicker(selected) {
    picker.innerHTML = '<option value="">— Select a project —</option>' +
                       '<option value="__new__">+ New project</option>';
    ProjectOverrides.newList().sort(function (a, b) {
      return a.case_id < b.case_id ? -1 : 1;
    }).forEach(function (p) {
      picker.appendChild(makeOption(p.case_id, p.case_id + " — " + (p.project_name || "(unnamed)") + "  [new]"));
    });
    Object.keys(byId).sort().forEach(function (id) {
      picker.appendChild(makeOption(id, id + " — " + byId[id].project_type + ", " + byId[id].district));
    });
    if (selected) { picker.value = selected; }
  }
  function makeOption(value, text) {
    var o = document.createElement("option");
    o.value = value; o.textContent = text;
    return o;
  }


  /* ---- one input for a field ---- */

  function inputFor(key, value, readOnly) {
    var v = (value === undefined || value === null) ? "" : value;

    if (readOnly) {
      return '<div class="filter-input bg-slate-100 text-slate-500">' + (v === "" ? "—" : v) + '</div>';
    }
    if (S.enums[key]) {
      return '<select name="' + key + '" class="filter-input">' +
        (S.enums[key].indexOf(v) === -1 ? '<option value="">— select —</option>' : '') +
        S.enums[key].map(function (o) {
          return '<option' + (o === v ? ' selected' : '') + '>' + o + '</option>';
        }).join("") + '</select>';
    }
    if (S.booleanKeys.indexOf(key) !== -1) {
      return '<select name="' + key + '" class="filter-input">' +
        '<option value="true"' + (v === true ? ' selected' : '') + '>Yes</option>' +
        '<option value="false"' + (v === true ? '' : ' selected') + '>No</option>' +
        '</select>';
    }
    if (S.textKeys.indexOf(key) !== -1) {
      return '<input name="' + key + '" type="text" value="' + escapeAttr(v) + '" class="filter-input" />';
    }
    var meta = S.numberMeta[key] || {};
    var attrs = 'type="number" step="' + (meta.step || 1) + '"';
    if (meta.min !== undefined) { attrs += ' min="' + meta.min + '"'; }
    if (meta.max !== undefined) { attrs += ' max="' + meta.max + '"'; }
    var unit = meta.unit ? ' <span class="text-xs text-slate-400">(' + meta.unit + ')</span>' : "";
    return '<input name="' + key + '" ' + attrs + ' value="' + v + '" class="filter-input" />' + unit;
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }


  /* ---- render the form ---- */

  function renderForm(project, editableIdentity) {
    var titles = editableIdentity ? S.newFormGroupTitles : S.formGroupTitles;

    formBox.innerHTML = S.groups.filter(function (g) {
      return titles.indexOf(g.title) !== -1;
    }).map(function (g) {
      return '<fieldset class="lg-fieldset">' +
        '<legend class="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1">' + g.title + '</legend>' +
        '<div class="grid gap-3 sm:grid-cols-2">' +
          g.keys.map(function (k) {
            // case_id is always read-only; identity fields are read-only when
            // editing a shipped project.
            var readOnly = (k === "case_id") ||
                           (!editableIdentity && S.identityKeys.indexOf(k) !== -1);
            return '<label class="block"><span class="filter-label">' + S.labels[k] + '</span>' +
                   inputFor(k, project[k], readOnly) + '</label>';
          }).join("") +
        '</div></fieldset>';
    }).join("");

    actions.hidden = false;
  }


  /* ---- start a new project ---- */

  function beginNew() {
    mode = "new";
    currentId = nextCaseId();
    renderForm({ case_id: currentId }, true);
    el("lg-heading").textContent = "New project";
    el("lg-updated").textContent = "Project number " + currentId + " will be assigned on save.";
    el("lg-status").textContent = "";
  }


  /* ---- edit an existing project (shipped or previously-created) ---- */

  function beginEdit(id) {
    var shipped = byId[id];
    var project = shipped ? ProjectOverrides.merge(shipped) : ProjectOverrides.getNew(id);
    if (!project) { return; }

    mode = "edit";
    currentId = id;
    renderForm(project, !shipped);   // identity editable only for non-shipped projects

    el("lg-heading").textContent = "Editing " + id +
      (shipped ? "" : " (" + (project.project_name || "unnamed") + ", created here)");
    var o = ProjectOverrides.get(id);
    el("lg-updated").textContent = o
      ? "Last saved " + new Date(o._updated_at).toLocaleString("en-IN")
      : "No local edits yet - values shown as shipped.";
    el("lg-status").textContent = "";
  }


  /* ---- collect the form into a fields object ---- */

  function collect() {
    var fields = {};
    Array.prototype.forEach.call(formBox.querySelectorAll("[name]"), function (input) {
      var k = input.name;
      var raw = input.value;
      if (S.booleanKeys.indexOf(k) !== -1) {
        fields[k] = (raw === "true");
      } else if (S.enums[k] || S.textKeys.indexOf(k) !== -1) {
        if (raw !== "") { fields[k] = raw; }         // skip blank enums / text
      } else {
        if (raw !== "") { fields[k] = Number(raw); } // skip blank numbers (stay undefined)
      }
    });
    return fields;
  }


  /* ---- save ---- */

  el("lg-save").addEventListener("click", function () {
    if (!currentId) { return; }
    var wasNew = (mode === "new");
    var fields = collect();
    if (wasNew) {
      if (!fields.project_name) {
        el("lg-status").className = "text-sm text-red-700";
        el("lg-status").textContent = "Enter a project name before saving.";
        return;
      }
      fields._new = true;
    }
    ProjectOverrides.save(currentId, fields);

    var savedId = currentId;
    fillPicker(savedId);
    beginEdit(savedId);   // continue in edit mode on the same project
    el("lg-status").className = "text-sm text-green-700";
    el("lg-status").innerHTML = (wasNew ? "Created " : "Saved ") + savedId + ". " +
      '<a class="underline" href="project-detail.html?case_id=' + savedId + '">Open in the viewing dashboard</a>';
  });


  /* ---- discard local edits / delete a new project ---- */

  el("lg-reset").addEventListener("click", function () {
    if (!currentId) { return; }
    var wasNew = ProjectOverrides.isNew(currentId);
    ProjectOverrides.remove(currentId);
    if (wasNew) {
      fillPicker("");
      formBox.innerHTML = "";
      actions.hidden = true;
      el("lg-heading").textContent = "Project data entry";
      el("lg-updated").textContent = "";
      el("lg-status").textContent = "New project discarded.";
      mode = null; currentId = null;
    } else {
      beginEdit(currentId);
      el("lg-status").textContent = "Local edits discarded.";
    }
  });


  /* ---- wiring ---- */

  picker.addEventListener("change", function () {
    if (picker.value === "__new__") { beginNew(); }
    else if (picker.value) { beginEdit(picker.value); }
  });

  fillPicker("");

  // deep link: logs.html?case_id=LA00123  or  logs.html?new=1
  var params = new URLSearchParams(window.location.search);
  var q = (params.get("case_id") || "").toUpperCase();
  if (params.get("new")) {
    picker.value = "__new__"; beginNew();
  } else if (q && (byId[q] || ProjectOverrides.isNew(q))) {
    picker.value = q; beginEdit(q);
  }
})();
