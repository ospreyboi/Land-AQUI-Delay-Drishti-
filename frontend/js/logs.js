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
    picker.innerHTML =
      '<option value="">' + I18N.t("logs.selectProject") + '</option>' +
      '<option value="__new__">' + I18N.t("logs.newProject") + '</option>';
    ProjectOverrides.newList().sort(function (a, b) {
      return a.case_id < b.case_id ? -1 : 1;
    }).forEach(function (p) {
      picker.appendChild(makeOption(p.case_id,
        p.case_id + " — " + (p.project_name || I18N.t("logs.unnamed")) + "  " + I18N.t("logs.newTag")));
    });
    Object.keys(byId).sort().forEach(function (id) {
      picker.appendChild(makeOption(id,
        id + " — " + I18N.tv(byId[id].project_type) + ", " + shortDistrict(byId[id].district)));
    });
    if (selected) { picker.value = selected; }
  }

  // "Punjab_District_2" -> "District 2" (the picker only needs the short form).
  function shortDistrict(d) {
    var parts = d.split("_");
    return parts.length === 3 ? I18N.t("table.district") + " " + parts[2] : d;
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
      var shown = v === "" ? I18N.t("logs.readonlyEmpty") : I18N.tv(v);
      return '<div class="filter-input bg-slate-100 text-slate-500">' + shown + '</div>';
    }
    if (S.enums[key]) {
      return '<select name="' + key + '" class="filter-input">' +
        (S.enums[key].indexOf(v) === -1 ? '<option value="">' + I18N.t("logs.selectPlaceholder") + '</option>' : '') +
        S.enums[key].map(function (o) {
          return '<option value="' + o + '"' + (o === v ? ' selected' : '') + '>' + I18N.tv(o) + '</option>';
        }).join("") + '</select>';
    }
    if (S.booleanKeys.indexOf(key) !== -1) {
      return '<select name="' + key + '" class="filter-input">' +
        '<option value="true"' + (v === true ? ' selected' : '') + '>' + I18N.t("yesNo.yes") + '</option>' +
        '<option value="false"' + (v === true ? '' : ' selected') + '>' + I18N.t("yesNo.no") + '</option>' +
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
        '<legend class="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1">' + I18N.groupTitle(g.title) + '</legend>' +
        '<div class="grid gap-3 sm:grid-cols-2">' +
          g.keys.map(function (k) {
            // case_id is always read-only; identity fields are read-only when
            // editing a shipped project.
            var readOnly = (k === "case_id") ||
                           (!editableIdentity && S.identityKeys.indexOf(k) !== -1);
            return '<label class="block"><span class="filter-label">' + I18N.fieldLabel(k) + '</span>' +
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
    el("lg-heading").textContent = I18N.t("logs.heading.new");
    el("lg-updated").textContent = I18N.t("logs.numberAssignedOnSave", { id: currentId });
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

    el("lg-heading").textContent = shipped
      ? I18N.t("logs.heading.editing", { id: id })
      : I18N.t("logs.heading.editingNew", { id: id, name: project.project_name || I18N.t("logs.unnamed") });
    var o = ProjectOverrides.get(id);
    el("lg-updated").textContent = o
      ? I18N.t("logs.lastSaved", { date: new Date(o._updated_at).toLocaleString("en-IN") })
      : I18N.t("logs.noEditsYet");
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
        el("lg-status").textContent = I18N.t("logs.enterNameFirst");
        return;
      }
      fields._new = true;
    }
    ProjectOverrides.save(currentId, fields);

    var savedId = currentId;
    fillPicker(savedId);
    beginEdit(savedId);   // continue in edit mode on the same project
    el("lg-status").className = "text-sm text-green-700";
    el("lg-status").innerHTML = I18N.t(wasNew ? "logs.created" : "logs.saved", { id: savedId }) +
      '<a class="underline" href="project-detail.html?case_id=' + savedId + '">' + I18N.t("logs.openInViewing") + '</a>';
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
      el("lg-heading").textContent = I18N.t("logs.heading.default");
      el("lg-updated").textContent = "";
      el("lg-status").textContent = I18N.t("logs.newDiscarded");
      mode = null; currentId = null;
    } else {
      beginEdit(currentId);
      el("lg-status").textContent = I18N.t("logs.editsDiscarded");
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
