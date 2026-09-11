/*
 * project-overrides.js  --  local store for edits made on the Logs dashboard.
 *
 * BETA: no backend. What a Logs-role user saves goes into THIS browser's
 * localStorage; the viewing dashboard merges it on top of the shipped data so
 * their input is reflected (drivers, pillar breakdown, full record). The
 * headline risk score is NOT recomputed here - the model re-runs server-side.
 *
 * At integration: replace with PATCH /projects/{case_id}.
 */

window.ProjectOverrides = (function () {
  var KEY = "laqui.overrides";

  function all() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }

  function get(caseId) {
    return all()[caseId] || null;
  }

  function save(caseId, fields) {
    var store = all();
    store[caseId] = Object.assign({}, store[caseId], fields,
                                  { _updated_at: new Date().toISOString() });
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }

  function remove(caseId) {
    var store = all();
    delete store[caseId];
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }

  // Shipped project + any local edits layered on top.
  function merge(project) {
    if (!project) { return project; }
    var o = get(project.case_id);
    return o ? Object.assign({}, project, o) : project;
  }

  // A project created on the Logs dashboard (no shipped row behind it), or null.
  function isNew(caseId) {
    var o = get(caseId);
    return !!(o && o._new);
  }
  function getNew(caseId) {
    if (!isNew(caseId)) { return null; }
    return Object.assign({ case_id: caseId }, get(caseId));
  }
  function newList() {
    var store = all();
    return Object.keys(store)
      .filter(function (id) { return store[id]._new; })
      .map(function (id) { return Object.assign({ case_id: id }, store[id]); });
  }

  return {
    all: all, get: get, save: save, remove: remove, merge: merge,
    isNew: isNew, getNew: getNew, newList: newList
  };
})();
