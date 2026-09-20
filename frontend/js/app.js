/*
 * app.js  --  shared "app shell". Loaded right after js/i18n.js on every page
 * (it calls I18N.t() while building the shell, so i18n.js must load first).
 *
 * Jobs:
 *   1. SHELL      - draws the tricolour strip + masthead + profile menu + tab
 *                   nav into <div id="app-shell" data-active-tab="..."></div>,
 *                   so every page has identical chrome from one place.
 *   2. SIGN-IN    - the user picks a name + role on login.html before the
 *                   "Project List" / "Project Detail" pages open. It is a
 *                   PROTOTYPE gate (no password, no server) - the session lives
 *                   only in this browser tab. At integration this becomes a real
 *                   POST /login. The role is stored ready to route the per-role
 *                   dashboards the team will build next.
 *   3. SCOPE GATE - after signing in, the user picks a view on the Overview
 *                   page (National level, or one State) before those same two
 *                   pages open. "Analytics" and "Overview" are always open.
 *
 * Everything is exposed on one global object: window.LaquiApp
 */

"use strict";

window.LaquiApp = (function () {

  // Storage keys, prefixed so they never clash with anything else.
  // Both use sessionStorage - cleared when the browser tab closes.
  var SCOPE_KEY = "laqui.scope";
  var SESSION_KEY = "laqui.session";

  // Tabs locked until BOTH a sign-in and a scope exist. Matched by href.
  var GATED_TAB_HREFS = ["projects.html", "project-detail.html"];

  // Role key -> i18n key. The three dashboards the team is planning.
  var ROLE_KEYS = { viewing: "role.viewing", logs: "role.logs", admin: "role.admin" };
  function roleLabel(role) {
    return ROLE_KEYS[role] ? I18N.t(ROLE_KEYS[role]) : role;
  }


  /* ======================================================================
     Safe storage helpers - browser storage can throw (private mode, policy).
     If it does, behave as if nothing was saved.
     ====================================================================== */

  function readJson(storage, key) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* not critical - ignore */
    }
  }


  /* ======================================================================
     Shell (masthead + nav + profile menu)
     ====================================================================== */

  // Neutral placeholder mark. NOT the State Emblem of India (legally restricted).
  function emblemSvgHtml() {
    return '' +
      '<svg class="w-11 h-11 shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
        '<circle cx="24" cy="24" r="22" fill="#1e3a8a" />' +
        '<path d="M9 31 L19 22 L27 27 L39 16" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
        '<rect x="9" y="34" width="30" height="5" rx="1" fill="#ffffff" opacity="0.35" />' +
        '<circle cx="35" cy="14" r="3" fill="#ff9933" />' +
      '</svg>';
  }

  // The profile button + dropdown. Wired up by wireProfileMenu(); its contents
  // (signed-in name/role, or a "Log in" link) are filled in by renderIdentity().
  function profileMenuHtml() {
    var lang = I18N.getLanguage();
    return '' +
      '<div class="relative shrink-0">' +
        '<button id="profile-button" type="button" aria-haspopup="true" aria-expanded="false" ' +
                'class="flex items-center gap-1.5 rounded-full border border-slate-300 pl-1 pr-2 py-1 hover:bg-slate-50">' +
          '<span id="profile-avatar" class="profile-avatar">•</span>' +
          '<svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
            '<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />' +
          '</svg>' +
          '<span class="sr-only">' + I18N.t("nav.openAccountMenu") + '</span>' +
        '</button>' +
        '<div id="profile-menu" class="profile-menu hidden">' +
          '<div class="px-4 py-3 border-b border-slate-200">' +
            '<p id="profile-name" class="text-sm font-semibold text-slate-900">' + I18N.t("account.notSignedIn") + '</p>' +
            '<p id="profile-role" class="text-xs text-slate-500"></p>' +
          '</div>' +
          '<div class="py-1">' +
            '<a id="profile-login-link" href="login.html" class="profile-menu-item">' + I18N.t("account.signIn") + '</a>' +
            '<button id="profile-settings-toggle" type="button" class="profile-menu-item">' + I18N.t("account.settings") + '</button>' +
            '<div id="profile-settings" class="hidden px-4 py-3 bg-slate-50 border-y border-slate-200 text-sm">' +
              '<p class="text-xs font-medium text-slate-600 mb-1">' + I18N.t("account.language") + '</p>' +
              '<label class="flex items-center gap-2 py-0.5"><input type="radio" name="app-language" value="en"' + (lang === "en" ? " checked" : "") + ' /><span>English</span></label>' +
              '<label class="flex items-center gap-2 py-0.5"><input type="radio" name="app-language" value="hi"' + (lang === "hi" ? " checked" : "") + ' /><span>हिन्दी (Hindi)</span></label>' +
              '<p class="text-[11px] text-slate-400 mt-1">' + I18N.t("account.hindiNote") + '</p>' +
            '</div>' +
            '<button id="profile-logout" type="button" class="profile-menu-item hidden">' + I18N.t("account.logout") + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // Build one nav tab link.
  function navTabHtml(href, label, key, activeKey, gated) {
    var isActive = (key === activeKey);
    var cls = "px-4 py-3";
    var attrs = "";
    if (isActive) {
      cls += " bg-blue-800 font-semibold";
      attrs = ' aria-current="page"';
    } else {
      cls += " hover:bg-blue-800";
      if (gated) {
        cls += " nav-locked";               // applyNavGate() removes this once a scope is set
        attrs = ' aria-disabled="true" tabindex="-1"';
      }
    }
    return '<a href="' + href + '" class="' + cls + '"' + attrs + '>' + label + '</a>';
  }

  // Draw the whole shell into #app-shell. Runs before anything else on the page.
  function renderShell() {
    var mount = document.getElementById("app-shell");
    if (!mount) {
      return;
    }
    var active = mount.getAttribute("data-active-tab") || "";
    var session = getSession();

    mount.innerHTML = '' +
      '<div class="gov-tricolour"></div>' +
      '<header class="bg-white border-b border-slate-200">' +
        '<div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">' +
          profileMenuHtml() +
          emblemSvgHtml() +
          '<div class="leading-tight">' +
            '<p class="text-[11px] uppercase tracking-wide text-slate-500">' + I18N.t("shell.govOfIndia") + '</p>' +
            '<p class="text-sm font-semibold text-slate-900">' + I18N.t("shell.ministry") + '</p>' +
            '<p class="text-xs text-slate-600">' + I18N.t("shell.department") + '</p>' +
          '</div>' +
          '<div class="ml-auto text-right">' +
            '<p class="text-sm font-semibold text-blue-900">' + I18N.t("shell.dashboardTitle") + '</p>' +
            '<p class="text-[11px] text-slate-500">' + I18N.t("shell.problemStatement") + '</p>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<nav class="bg-blue-900 text-white">' +
        '<div class="max-w-6xl mx-auto px-4 flex flex-wrap text-sm">' +
          navTabHtml("index.html", I18N.t("nav.overview"), "overview", active, false) +
          navTabHtml("projects.html", I18N.t("nav.projects"), "projects", active, true) +
          navTabHtml("project-detail.html", I18N.t("nav.detail"), "detail", active, true) +
          navTabHtml("analytics.html", I18N.t("nav.analytics"), "analytics", active, false) +
          // Data-entry tab only for the "logs" role.
          (session && session.role === "logs"
            ? navTabHtml("logs.html", I18N.t("nav.logs"), "logs", active, false)
            : "") +
        '</div>' +
      '</nav>' +
      '<div id="nav-gate-hint" class="nav-gate-hint hidden">' +
        '<div class="max-w-6xl mx-auto px-4 py-2">' +
          '<span id="nav-gate-hint-text"></span>' +
        '</div>' +
      '</div>';
  }

  // The shared footer (beta + synthetic-data disclaimers). Goes in <div id="app-footer">.
  function renderFooter() {
    var mount = document.getElementById("app-footer");
    if (!mount) {
      return;
    }
    mount.innerHTML = '' +
      '<footer class="border-t border-slate-200 bg-white mt-10">' +
        '<div class="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-500 space-y-1">' +
          '<p>' + I18N.t("footer.beta") + '</p>' +
          '<p>' + I18N.t("footer.synthetic") + '</p>' +
        '</div>' +
      '</footer>';
  }


  /* ======================================================================
     Scope gate
     ====================================================================== */

  // The chosen scope, or null if the user hasn't chosen yet.
  //   { level: "national" }
  //   { level: "state", state: "Madhya Pradesh" }
  function getScope() {
    return readJson(window.sessionStorage, SCOPE_KEY);
  }

  function setScope(scope) {
    writeJson(window.sessionStorage, SCOPE_KEY, scope);
    applyNavGate();
  }

  // A short, TRANSLATED label for the current scope, e.g. "Punjab" / "पंजाब"
  // or "All of India" / "संपूर्ण भारत".
  function scopeLabel(scope) {
    if (scope && scope.level === "state") {
      return I18N.tv(scope.state);
    }
    if (scope && scope.level === "national") {
      return I18N.t("overview.allIndia");
    }
    return "";
  }

  // Used by the gated pages: return the scope, or send the user to Overview to pick one.
  function requireScope() {
    var scope = getScope();
    if (!scope) {
      window.location.href = "index.html";
      return null;
    }
    return scope;
  }

  // Lock or unlock the gated tabs. They open only once the user has BOTH signed
  // in AND chosen a scope; the hint bar says which step is still missing.
  function applyNavGate() {
    var signedIn = getSession() !== null;
    var hasScope = getScope() !== null;
    var open = signedIn && hasScope;

    GATED_TAB_HREFS.forEach(function (href) {
      var link = document.querySelector('nav a[href="' + href + '"]');
      if (!link) {
        return;
      }
      if (open) {
        link.classList.remove("nav-locked");
        link.removeAttribute("aria-disabled");
        link.removeAttribute("tabindex");
      } else {
        link.classList.add("nav-locked");
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("tabindex", "-1");
      }
    });

    var hint = document.getElementById("nav-gate-hint");
    var hintText = document.getElementById("nav-gate-hint-text");
    if (hint && hintText) {
      hint.classList.toggle("hidden", open);
      if (!signedIn) {
        var signInLink = '<a href="login.html" class="underline font-semibold">' + I18N.t("nav.gate.signIn") + '</a>';
        hintText.innerHTML = I18N.t("nav.gate.needLogin", { signIn: signInLink });
      } else if (!hasScope) {
        hintText.innerHTML = I18N.t("nav.gate.needScope");
      }
    }
  }

  // Stop clicks on a locked tab from navigating.
  function wireNavGate() {
    var nav = document.querySelector("nav");
    if (nav) {
      nav.addEventListener("click", function (event) {
        var link = event.target.closest("a");
        if (link && link.classList.contains("nav-locked")) {
          event.preventDefault();
        }
      });
    }
    applyNavGate();
  }


  /* ======================================================================
     Sign-in / session

     PROTOTYPE ONLY. No password, no server. The user picks a name + role on
     login.html; we keep it for this browser tab. At integration this whole
     block is replaced by real calls to a POST /login endpoint + a token.
     ====================================================================== */

  // The signed-in user, or null.  { name: "A. Deshmukh", role: "viewing" }
  function getSession() {
    return readJson(window.sessionStorage, SESSION_KEY);
  }

  // Called by login.js after the form is submitted.
  function signIn(session) {
    var role = session.role || "viewing";
    if (!ROLE_KEYS.hasOwnProperty(role)) {
      role = "viewing";
    }
    writeJson(window.sessionStorage, SESSION_KEY, {
      name: (session.name || "").trim(),
      role: role
    });
  }

  function logout() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      /* ignore */
    }
    window.location.href = "index.html";   // Overview stays public
  }

  // Used by the gated pages: return the session, or send the user to sign in.
  // Passes the page they wanted as ?next= so login.js can send them straight back.
  function requireLogin() {
    var session = getSession();
    if (!session) {
      var here = window.location.pathname.split("/").pop() + window.location.search;
      window.location.href = "login.html?next=" + encodeURIComponent(here);
      return null;
    }
    return session;
  }

  // "Asha Rao" -> "AR"
  function initialsOf(name) {
    var parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "";
    }
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  // Fill the account menu: signed-in name + role, or a "Sign in" prompt.
  function renderIdentity() {
    var session = getSession();

    var avatar = document.getElementById("profile-avatar");
    var nameEl = document.getElementById("profile-name");
    var roleEl = document.getElementById("profile-role");
    var loginLink = document.getElementById("profile-login-link");
    var logoutBtn = document.getElementById("profile-logout");
    if (!nameEl) {
      return;   // no account menu on this page (e.g. login.html)
    }

    if (session) {
      if (avatar) avatar.textContent = initialsOf(session.name) || "•";
      nameEl.textContent = session.name || I18N.t("account.signedIn");
      roleEl.textContent = roleLabel(session.role);
      loginLink.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
    } else {
      if (avatar) avatar.textContent = "•";
      nameEl.textContent = I18N.t("account.notSignedIn");
      roleEl.textContent = "";
      loginLink.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    }
  }

  function wireProfileMenu() {
    var button = document.getElementById("profile-button");
    var menu = document.getElementById("profile-menu");
    if (!button || !menu) {
      return;
    }
    var settings = document.getElementById("profile-settings");

    function closeMenu() {
      menu.classList.add("hidden");
      button.setAttribute("aria-expanded", "false");
      settings.classList.add("hidden");
    }

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      if (menu.classList.contains("hidden")) {
        menu.classList.remove("hidden");
        button.setAttribute("aria-expanded", "true");
      } else {
        closeMenu();
      }
    });

    document.addEventListener("click", function (event) {
      if (!menu.classList.contains("hidden") &&
          !menu.contains(event.target) &&
          !button.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    document.getElementById("profile-settings-toggle").addEventListener("click", function () {
      settings.classList.toggle("hidden");
    });

    // Switching language re-renders the whole page in the new language - the
    // simplest correct way to update everything, since most of the dashboard's
    // text is built once, at page load, by half a dozen different scripts.
    Array.prototype.forEach.call(
      document.querySelectorAll('input[name="app-language"]'),
      function (radio) {
        radio.addEventListener("change", function () {
          if (this.checked) {
            I18N.setLanguage(this.value);
            window.location.reload();
          }
        });
      }
    );

    document.getElementById("profile-logout").addEventListener("click", logout);
  }


  /* ======================================================================
     Start-up  (this script is loaded at the end of <body>, so the DOM for
     #app-shell already exists - but guard anyway in case that changes).
     ====================================================================== */

  function boot() {
    renderShell();         // 1. draw the chrome (masthead + nav)
    renderFooter();        // 2. draw the shared footer
    wireNavGate();         // 3. lock/unlock tabs + block locked clicks
    wireProfileMenu();     // 4. make the account menu interactive
    renderIdentity();      // 5. fill in the signed-in name / role (or "Sign in")
    I18N.applyStatic();    // 6. translate every [data-i18n] element on the page -
                           //    the shell/footer just built above, AND this
                           //    page's own static markup (already in the DOM,
                           //    since this script runs at the end of <body>)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  return {
    // sign-in
    getSession: getSession,
    signIn: signIn,
    logout: logout,
    requireLogin: requireLogin,
    roleLabel: roleLabel,
    // scope
    getScope: getScope,
    setScope: setScope,
    requireScope: requireScope,
    scopeLabel: scopeLabel,
    applyNavGate: applyNavGate
  };
})();
