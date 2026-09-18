/*
 * login.js  --  the prototype sign-in (login.html)
 *
 * No password, no server: the user types a name and picks a role, and we keep
 * that for the browser tab (via LaquiApp.signIn). It gates the Project List and
 * Project Detail pages so the team can demo role-based access.
 *
 * AT INTEGRATION: this becomes a real  POST /login  that returns a session
 * token; the role would come from the user's account, not a dropdown.
 */

"use strict";

(function () {

  var rawNext = new URLSearchParams(window.location.search).get("next") || "";

  // Where to land after signing in:
  //  - an explicit, allow-listed ?next= (they were bounced off a gated page), or
  //  - the logs dashboard for the logs role, or
  //  - the Overview page.
  function landingFor(role) {
    var allowed = ["index.html", "projects.html", "project-detail.html", "analytics.html", "logs.html"];
    if (allowed.indexOf(rawNext.split("?")[0]) !== -1) { return rawNext; }
    return role === "logs" ? "logs.html" : "index.html";
  }

  // Already signed in? Skip the form.
  var existing = LaquiApp.getSession();
  if (existing) {
    window.location.href = landingFor(existing.role);
    return;
  }

  var form = document.getElementById("login-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = document.getElementById("login-name").value.trim();
    var role = document.getElementById("login-role").value;
    var error = document.getElementById("login-error");

    if (name.length < 2) {
      error.textContent = I18N.t("login.enterName");
      error.classList.remove("hidden");
      return;
    }

    LaquiApp.signIn({ name: name, role: role });
    window.location.href = landingFor(role);
  });
})();
