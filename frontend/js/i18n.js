/*
 * i18n.js  --  English / Hindi text for the dashboard. Loaded on every page,
 * before app.js.
 *
 * How it works (no build step, no library - matches docs/rules.md rule 2):
 *   - DICT.en / DICT.hi are plain "key: string" dictionaries. I18N.t(key, vars)
 *     looks a key up in the current language, falls back to English, then to
 *     the key itself, so a missing translation never renders blank.
 *   - Static text typed directly into an .html file gets a data-i18n="key"
 *     attribute; I18N.applyStatic() (called once, from app.js) fills all of
 *     them from the dictionary. Everything else - inside a live tab
 *     (overview.js / projects.js / detail.js / logs.js) - calls I18N.t()
 *     directly while building its HTML strings.
 *   - I18N.tv(value) translates a fixed DATA VALUE for display only (a state
 *     name, "Highway", "Not Started", ...). The value stored in PROJECTS /
 *     saved by the Logs dashboard never changes - only what's shown does.
 *   - The language choice is saved in localStorage (kept between visits) and
 *     applied by reloading the page, so every render function - most of which
 *     run once, at page load - picks it up without a separate "live update"
 *     mechanism.
 *
 * NOT translated (flagged in the UI too):
 *   - The SIA consultation log text (js/sia-logs.js) - ~6 MB of generated
 *     English prose. Translating that needs a real translation pass or
 *     service, out of scope here.
 *   - Anything a person types themselves (a project name, their own name).
 *
 * The Hindi below is a first-pass translation (by Claude) using standard
 * government-portal vocabulary. It has not been reviewed by a native speaker
 * or the team's domain reviewer - same DRAFT caveat as the recommendation
 * wording in detail.js. Have someone check it before it goes in front of judges.
 */

"use strict";

window.I18N = (function () {

  var LANG_KEY = "laqui.lang";

  /* ========================================================================
     UI STRINGS
     ======================================================================== */
  var DICT = {
    en: {
      /* ---- shell: masthead, nav, footer, account menu (app.js) ---- */
      "shell.govOfIndia": "Government of India",
      "shell.ministry": "Ministry of Rural Development",
      "shell.department": "Department of Land Resources (DoLR)",
      "shell.dashboardTitle": "Land Acquisition Delay Risk Dashboard",
      "shell.problemStatement": "Problem statement SIH26017 · Beta build",
      "nav.overview": "Overview",
      "nav.projects": "Project List",
      "nav.detail": "Project Detail",
      "nav.analytics": "District / State Analytics",
      "nav.logs": "Data Entry",
      "nav.openAccountMenu": "Open account menu",
      "nav.gate.signIn": "Sign in",
      "nav.gate.needLogin": "{{signIn}} and choose a view to open the <em>Project List</em> and <em>Project Detail</em> tabs.",
      "nav.gate.needScope": "Choose <strong>National level</strong> or a <strong>State</strong> below to open the <em>Project List</em> and <em>Project Detail</em> tabs.",
      "account.notSignedIn": "Not signed in",
      "account.signedIn": "Signed in",
      "account.signIn": "Sign in",
      "account.settings": "Settings",
      "account.language": "Language",
      "account.logout": "Log out",
      "account.hindiNote": "First-pass machine translation - have a native speaker review it before the pitch.",
      "footer.beta": "<strong>Beta / proof-of-concept.</strong> Built for the SIH internal round. Not a production system.",
      "footer.synthetic": "Data shown is <strong>synthetic</strong>, calibrated to real published patterns (NJDG delay reasons, DoLR / LACRRIS structure, DILRMP digitisation rates). It does not contain real case records.",
      "role.viewing": "Risk-viewing dashboard",
      "role.logs": "Logs dashboard",
      "role.admin": "Administrative dashboard",

      /* ---- Overview page (index.html / overview.js) ---- */
      "overview.welcome.title": "Welcome",
      "overview.welcome.p1": "This dashboard helps officers of the Department of Land Resources identify land acquisition projects that are <strong>likely to face delay</strong> - and understand <strong>why</strong> - early enough to act on them.",
      "overview.welcome.p2": "For each project the system produces a <strong>delay-risk score</strong> together with a plain-language explanation. The reasoning is grouped under four areas:",
      "overview.hitl": "<strong>How to read this dashboard:</strong> every risk flag is decision-support information for an authorised officer to review and verify. It is <strong>not</strong> an automatic or final decision, and it does not replace field verification or due process.",
      "overview.view": "View",
      "overview.nationalLevel": "National level",
      "overview.stateLevel": "State level",
      "overview.state": "State",
      "overview.selectState": "— Select a state —",
      "overview.showing": "Showing:",
      "overview.allIndia": "All of India",
      "overview.allIndiaPreview": "All of India (preview)",
      "kpi.total.label": "Total acquisition cases",
      "kpi.total.note": "All projects on record for the selected view",
      "kpi.highpri.label": "High-priority cases",
      "kpi.highpri.note": "Flagged by the model for officer review",
      "kpi.legal.label": "Legal cases pending",
      "kpi.legal.note": "Projects with a court case currently pending",
      "overview.apiNote": "Figures come from a static snapshot of the synthetic dataset while the backend is being built. After integration they will be served live from <code class=\"text-slate-500\">GET /analytics/overview</code>.",
      "overview.popup.byDept": "High-priority cases by department",
      "overview.popup.highestRisk": "Highest-risk projects",
      "overview.popup.selectRow": "Select a row to open that project's detail page.",
      "overview.popup.footer": "\"High priority\" here means the model has flagged the project as likely to be delayed, for an officer to review - it is not a confirmed delay or a decision. A project's full drivers and recommended actions will appear on the Project Detail tab.",
      "overview.popup.summary": "{{highpri}} high-priority cases flagged for review  ·  {{legal}} legal cases pending",
      "overview.popup.showingTop": "(showing top {{shown}} of {{total}})",
      "close": "Close",
      "table.department": "Department",
      "table.highPriorityCases": "High-priority cases",
      "table.caseId": "Case ID",
      "table.district": "District",
      "table.projectType": "Project type",
      "table.priority": "Priority",
      "table.riskScore": "Risk score",
      "table.stage": "Stage",
      "table.possession": "Possession",
      "badge.highPriority": "High priority",
      "badge.standard": "Standard",

      /* ---- pillar names (used across Overview list, detail page, popover) ---- */
      "pillar.1.title": "1. Acquisition process health",
      "pillar.1.name": "Acquisition process health",
      "pillar.1.desc": "SIA, landowner consent, compensation, documentation",
      "pillar.2.title": "2. Legal disputes",
      "pillar.2.name": "Legal disputes",
      "pillar.2.desc": "court cases, stay orders, litigation type",
      "pillar.3.title": "3. Rehabilitation readiness",
      "pillar.3.name": "Rehabilitation readiness",
      "pillar.3.desc": "R&R plan, resettlement site status",
      "pillar.4.title": "4. Administrative efficiency",
      "pillar.4.name": "Administrative efficiency",
      "pillar.4.desc": "officer assignment, district historical performance",

      /* ---- Project List (projects.html / projects.js) ---- */
      "projects.browsing": "Browsing",
      "projects.changeView": "Change view",
      "projects.projectsOnRecord": "{{n}} projects on record",
      "projects.findProjects": "Find projects",
      "projects.clearFilters": "Clear filters",
      "filter.state": "State",
      "filter.projectType": "Project type",
      "filter.district": "District",
      "filter.caseId": "Case ID",
      "filter.caseIdPlaceholder": "e.g. LA00123",
      "filter.stage": "Stage of process",
      "filter.possession": "Possession status",
      "filter.riskStatus": "Risk status",
      "filter.allStates": "All states",
      "filter.allTypes": "All types",
      "filter.allDistricts": "All districts",
      "filter.allStages": "All stages",
      "filter.all": "All",
      "filter.flagged": "Flagged high-priority",
      "filter.notFlagged": "Not flagged",
      "projects.byDept": "High-priority projects by department",
      "projects.noneMatch": "No high-priority projects match the current filters.",
      "projects.sortedNote": "Sorted by model risk score, highest first. Select a row to open that project.",
      "projects.footerNote": "\"High priority\" means the model has flagged the project as likely to be delayed, for an officer to review - it is not a confirmed delay or a decision.",
      "projects.showingTop": "Showing the top {{max}} of {{total}} matching projects. Add filters to narrow the list.",
      "projects.showingAll": "Showing {{n}} matching project{{s}}.",

      /* ---- Project Detail (project-detail.html / detail.js) ---- */
      "detail.noneSelected.title": "No project selected",
      "detail.noneSelected.body": "Open a project from the Project List, or from a state's popup on the Overview page.",
      "detail.notFound.title": "Project {{id}} was not found",
      "detail.notFound.body": "Check the case ID, or return to the Project List to pick a project.",
      "detail.goToList": "Go to Project List",
      "detail.project": "Project",
      "detail.backToList": "Back to Project List",
      "detail.projectType": "Project type",
      "detail.location": "Location",
      "detail.department": "Department",
      "detail.stageOfProcess": "Stage of process",
      "detail.lifecycleStage": "Acquisition lifecycle stage",
      "detail.riskScoreLabel": "Model delay-risk score",
      "detail.riskScoreScale": "on a 0.00 – 1.00 scale",
      "detail.howCalculated": "How is this calculated?",
      "detail.pillarPopTitle": "Score breakdown by pillar (rough)",
      "detail.pillarPopNote": "A rough split of the model's weighted factors into the four pillars, each scaled 0–1. It leaves out factors that don't belong to a single pillar, so the four do not sum to the total. Context for review – not a separate decision.",
      "detail.awaitingAssessment": "Awaiting model assessment",
      "detail.flaggedHighPriority": "Flagged high-priority",
      "detail.forOfficerReview": "for officer review",
      "detail.notCurrentlyFlagged": "Not currently flagged",
      "detail.estimatedDelay": "Model-estimated delay if it occurs: about {{n}} months.",
      "detail.forOfficerReviewNotice": "<strong>For officer review.</strong> This score and the points below are model estimates to help prioritise attention. They are not a decision, not a finding, and not a substitute for field verification and due process.",
      "detail.newProjectNotice": "Logged on the Logs dashboard (this browser). The model has not assessed it yet, so there is no risk score - the points below are from the entered data.",
      "detail.editedNotice": "Includes field edits saved on the Logs dashboard (this browser). The risk score below is the last model run - the model re-runs server-side.",
      "detail.keyDriversTitle": "Why this project is flagged – key drivers",
      "detail.keyDriversNote": "Plain-language reasons drawn from the project's own data (docs/architecture.md §4), most significant first. Each is paired with a suggested action.",
      "detail.noDrivers": "No major risk drivers were identified from the available data for this project.",
      "detail.suggestedAction": "Suggested action —",
      "detail.recNote": "Suggested actions are DRAFT wording for the reviewing officer, pending finalisation with prd.md. They are prompts for consideration, not automatic directives.",
      "detail.pillarsTitle": "Four-pillar breakdown",
      "detail.needsAttention": "Needs attention",
      "detail.noConcerns": "No concerns flagged",
      "detail.nothingFlagged": "Nothing in this area is flagged for this project.",
      "detail.siaTitle": "Community Consultation (SIA) Log",
      "detail.siaSentimentLabel": "Community sentiment score (proxy):",
      "detail.siaNote": "The consultation record behind the sentiment score - shown as filed. Not a decision.",
      "detail.siaNoLog": "No consultation log is on file for this project.",
      "detail.siaEnglishOnlyNote": "This log's text is machine-generated in English and is shown as filed; it is not translated.",
      "detail.fullRecordTitle": "Full project record",
      "yesNo.yes": "Yes",
      "yesNo.no": "No",
      "unit.months": "months",
      "unit.hectares": "ha",

      /* ---- key drivers + recommendations (detail.js) ---- */
      "driver.compensation_disputed": "Compensation is disputed by the landowners",
      "driver.stay_order": "A court stay order is currently in effect",
      "driver.sentiment": "Local community sentiment is largely opposed to this acquisition",
      "driver.consent": "Landowner consent is below the required threshold",
      "driver.rehab": "The resettlement site is not ready for the number of families affected",
      "driver.district": "This district has a history of delayed projects",
      "driver.digitize": "Land records are not yet digitised",
      "driver.sia": "A Social Impact Assessment has not been conducted",
      "rec.compensation_disputed": "Convene a compensation review with the District Collector; re-examine the award against current circle rates and the RFCTLARR Act, 2013 solatium and multiplier provisions.",
      "rec.stay_order": "Refer the case to the Government Pleader for early vacation of the stay; hold possession until the court's direction is received.",
      "rec.consent": "Resume consent-building consultations with the affected families; record objections and reassess whether the consent threshold for this project category can be met.",
      "rec.digitize": "Coordinate with the DILRMP cell / Tehsildar to digitise and reconcile the relevant land records before the award stage.",
      "rec.sia": "Commission the Social Impact Assessment through the appointed agency before issuing further notifications, as required under the RFCTLARR Act, 2013.",
      "rec.sentiment": "Hold a public hearing / gram sabha consultation to record and address grievances, and brief the project authority on the level of local opposition.",
      "rec.rehab": "Escalate resettlement-site development with the R&R Administrator; confirm the site infrastructure and allotment plan before possession is taken.",
      "rec.district": "Place the project under the district review committee for closer monitoring, with a fortnightly progress review.",

      /* ---- pillar concern templates (detail.js pillarAssessment) ---- */
      "concern.siaNotConducted": "SIA not conducted",
      "concern.consentBelow": "Consent below threshold ({{pct}}%)",
      "concern.sentimentLow": "Community sentiment low ({{score}})",
      "concern.compDisputed": "Compensation disputed",
      "concern.recordsNotDigitised": "Land records not digitised",
      "concern.surveyPending": "Survey / settlement pending",
      "concern.stayOrder": "Stay order in effect",
      "concern.casePending": "Case pending in court",
      "concern.litigation": "Litigation: {{type}}",
      "concern.rrPlanNotPrepared": "R&R plan not prepared",
      "concern.siteNotReady": "Site not ready for {{n}} families",
      "concern.livelihoodNotProvided": "Livelihood restoration not provided",
      "concern.noOfficer": "No awarding officer assigned",
      "concern.districtHigh": "District delay history high ({{pct}}%)",
      "concern.possessionNotStarted": "Possession not started",
      "concern.responsivenessLow": "Stakeholder responsiveness low ({{score}})",

      /* ---- field labels (schema.js) - only where the Hindi differs from the
         PROJECT_SCHEMA.labels English text; I18N.fieldLabel() falls back to
         that English text automatically, so this list only needs to exist for hi. ---- */

      /* ---- Logs dashboard (logs.html / logs.js) ---- */
      "logs.betaBanner": "<strong>BETA STAGE.</strong> Entries here are saved in <strong>this browser only</strong> and are not sent to a server. They are merged into the viewing dashboard so you can see the effect of your inputs. In production this would write to the project database and re-run the model.",
      "logs.heading.default": "Project data entry",
      "logs.description": "Log a new project, or pick an existing one to update. Fields match the viewing dashboard's \"Full project record\". The project number is assigned automatically.",
      "logs.project": "Project",
      "logs.selectProject": "— Select a project —",
      "logs.newProject": "+ New project",
      "logs.unnamed": "(unnamed)",
      "logs.newTag": "[new]",
      "logs.save": "Save",
      "logs.discard": "Discard local edits",
      "logs.heading.new": "New project",
      "logs.numberAssignedOnSave": "Project number {{id}} will be assigned on save.",
      "logs.heading.editing": "Editing {{id}}",
      "logs.heading.editingNew": "Editing {{id}} ({{name}}, created here)",
      "logs.lastSaved": "Last saved {{date}}",
      "logs.noEditsYet": "No local edits yet - values shown as shipped.",
      "logs.enterNameFirst": "Enter a project name before saving.",
      "logs.created": "Created {{id}}. ",
      "logs.saved": "Saved {{id}}. ",
      "logs.openInViewing": "Open in the viewing dashboard",
      "logs.newDiscarded": "New project discarded.",
      "logs.editsDiscarded": "Local edits discarded.",
      "logs.selectPlaceholder": "— select —",
      "logs.readonlyEmpty": "—",

      /* ---- Login page (login.html / login.js) ---- */
      "login.title": "Sign in",
      "login.yourName": "Your name",
      "login.namePlaceholder": "e.g. A. Deshmukh",
      "login.role": "Role",
      "login.role.viewing": "Risk-viewing — review delay-risk predictions",
      "login.role.logs": "Logs — record on-ground updates &amp; human inputs (coming soon)",
      "login.role.admin": "Administrative — inter-departmental coordination &amp; task execution (coming soon)",
      "login.continue": "Continue",
      "login.enterName": "Please enter your name to continue.",
      "login.notice": "<strong>Prototype sign-in.</strong> This is a demonstration gate for the SIH beta - it is not connected to a real authentication service and does not verify identity. The Logs and Administrative dashboards are planned; for now every role opens the risk-viewing dashboard.",

      /* ---- Analytics stub (analytics.html) ---- */
      "analytics.title": "District / State Analytics",
      "analytics.body": "This tab (state comparison, project-type delay rates, historical district performance) is planned for the next build step. It is listed here so the navigation is complete; the page itself is not built yet.",
      "analytics.backToOverview": "Back to Overview"
    },

    hi: {
      "shell.govOfIndia": "भारत सरकार",
      "shell.ministry": "ग्रामीण विकास मंत्रालय",
      "shell.department": "भूमि संसाधन विभाग (DoLR)",
      "shell.dashboardTitle": "भूमि अधिग्रहण विलंब जोखिम डैशबोर्ड",
      "shell.problemStatement": "समस्या कथन SIH26017 · बीटा संस्करण",
      "nav.overview": "अवलोकन",
      "nav.projects": "परियोजना सूची",
      "nav.detail": "परियोजना विवरण",
      "nav.analytics": "जिला / राज्य विश्लेषण",
      "nav.logs": "डेटा प्रविष्टि",
      "nav.openAccountMenu": "खाता मेनू खोलें",
      "nav.gate.signIn": "साइन इन करें",
      "nav.gate.needLogin": "<em>परियोजना सूची</em> और <em>परियोजना विवरण</em> टैब खोलने के लिए {{signIn}} और एक दृश्य चुनें।",
      "nav.gate.needScope": "<em>परियोजना सूची</em> और <em>परियोजना विवरण</em> टैब खोलने के लिए नीचे <strong>राष्ट्रीय स्तर</strong> या कोई <strong>राज्य</strong> चुनें।",
      "account.notSignedIn": "साइन इन नहीं है",
      "account.signedIn": "साइन इन है",
      "account.signIn": "साइन इन करें",
      "account.settings": "सेटिंग्स",
      "account.language": "भाषा",
      "account.logout": "लॉग आउट करें",
      "account.hindiNote": "यह पहला मशीनी अनुवाद है - प्रस्तुति से पहले किसी हिंदी भाषी से इसकी समीक्षा करवाएं।",
      "footer.beta": "<strong>बीटा / प्रूफ़-ऑफ़-कॉन्सेप्ट।</strong> SIH आंतरिक चरण के लिए बनाया गया। यह उत्पादन प्रणाली नहीं है।",
      "footer.synthetic": "दिखाया गया डेटा <strong>कृत्रिम (सिंथेटिक)</strong> है, जो वास्तविक प्रकाशित प्रतिरूपों (NJDG विलंब कारण, DoLR / LACRRIS संरचना, DILRMP डिजिटलीकरण दर) के अनुरूप तैयार किया गया है। इसमें वास्तविक मामलों का रिकॉर्ड शामिल नहीं है।",
      "role.viewing": "जोखिम-अवलोकन डैशबोर्ड",
      "role.logs": "लॉग्स डैशबोर्ड",
      "role.admin": "प्रशासनिक डैशबोर्ड",

      "overview.welcome.title": "स्वागत है",
      "overview.welcome.p1": "यह डैशबोर्ड भूमि संसाधन विभाग के अधिकारियों को उन भूमि अधिग्रहण परियोजनाओं की पहचान करने में मदद करता है जिनमें <strong>विलंब की संभावना</strong> है - और समय रहते कार्रवाई के लिए <strong>कारण</strong> समझने में मदद करता है।",
      "overview.welcome.p2": "प्रत्येक परियोजना के लिए यह प्रणाली एक <strong>विलंब-जोखिम स्कोर</strong> और सरल भाषा में स्पष्टीकरण देती है। यह विवेचन चार क्षेत्रों में बांटा गया है:",
      "overview.hitl": "<strong>इस डैशबोर्ड को कैसे पढ़ें:</strong> प्रत्येक जोखिम चिन्ह एक अधिकृत अधिकारी की समीक्षा व सत्यापन हेतु निर्णय-सहायक जानकारी है। यह <strong>स्वतः या अंतिम निर्णय नहीं है</strong>, और यह क्षेत्रीय सत्यापन या नियत प्रक्रिया का विकल्प नहीं है।",
      "overview.view": "दृश्य",
      "overview.nationalLevel": "राष्ट्रीय स्तर",
      "overview.stateLevel": "राज्य स्तर",
      "overview.state": "राज्य",
      "overview.selectState": "— एक राज्य चुनें —",
      "overview.showing": "दिखाया जा रहा है:",
      "overview.allIndia": "संपूर्ण भारत",
      "overview.allIndiaPreview": "संपूर्ण भारत (पूर्वावलोकन)",
      "kpi.total.label": "कुल अधिग्रहण मामले",
      "kpi.total.note": "चयनित दृश्य के लिए दर्ज सभी परियोजनाएं",
      "kpi.highpri.label": "उच्च-प्राथमिकता मामले",
      "kpi.highpri.note": "अधिकारी समीक्षा हेतु मॉडल द्वारा चिन्हित",
      "kpi.legal.label": "लंबित कानूनी मामले",
      "kpi.legal.note": "वे परियोजनाएं जिनमें वर्तमान में न्यायालय का मामला लंबित है",
      "overview.apiNote": "बैकएंड बनने तक ये आंकड़े कृत्रिम डेटासेट के एक स्थिर स्नैपशॉट से लिए गए हैं। एकीकरण के बाद ये <code class=\"text-slate-500\">GET /analytics/overview</code> से सीधे उपलब्ध होंगे।",
      "overview.popup.byDept": "विभाग अनुसार उच्च-प्राथमिकता मामले",
      "overview.popup.highestRisk": "सर्वाधिक जोखिम वाली परियोजनाएं",
      "overview.popup.selectRow": "उस परियोजना का विवरण पृष्ठ खोलने हेतु एक पंक्ति चुनें।",
      "overview.popup.footer": "यहां \"उच्च प्राथमिकता\" का अर्थ है कि मॉडल ने इस परियोजना को विलंबित होने की संभावना के रूप में चिन्हित किया है, ताकि कोई अधिकारी इसकी समीक्षा करे - यह पुष्टि किया गया विलंब या निर्णय नहीं है। किसी परियोजना के पूरे कारण और सुझाए गए कदम परियोजना विवरण टैब पर दिखेंगे।",
      "overview.popup.summary": "{{highpri}} उच्च-प्राथमिकता मामले समीक्षा हेतु चिन्हित  ·  {{legal}} कानूनी मामले लंबित",
      "overview.popup.showingTop": "(कुल {{total}} में से शीर्ष {{shown}} दिखाए जा रहे हैं)",
      "close": "बंद करें",
      "table.department": "विभाग",
      "table.highPriorityCases": "उच्च-प्राथमिकता मामले",
      "table.caseId": "मामला क्रमांक",
      "table.district": "ज़िला",
      "table.projectType": "परियोजना प्रकार",
      "table.priority": "प्राथमिकता",
      "table.riskScore": "जोखिम स्कोर",
      "table.stage": "चरण",
      "table.possession": "कब्ज़ा",
      "badge.highPriority": "उच्च प्राथमिकता",
      "badge.standard": "मानक",

      "pillar.1.title": "1. अधिग्रहण प्रक्रिया स्वास्थ्य",
      "pillar.1.name": "अधिग्रहण प्रक्रिया स्वास्थ्य",
      "pillar.1.desc": "SIA, भूस्वामी सहमति, क्षतिपूर्ति, दस्तावेज़ीकरण",
      "pillar.2.title": "2. कानूनी विवाद",
      "pillar.2.name": "कानूनी विवाद",
      "pillar.2.desc": "न्यायालय मामले, स्थगन आदेश, वाद प्रकार",
      "pillar.3.title": "3. पुनर्वास तत्परता",
      "pillar.3.name": "पुनर्वास तत्परता",
      "pillar.3.desc": "पुनर्वास एवं पुनर्स्थापन योजना, पुनर्वास स्थल स्थिति",
      "pillar.4.title": "4. प्रशासनिक दक्षता",
      "pillar.4.name": "प्रशासनिक दक्षता",
      "pillar.4.desc": "अधिकारी नियुक्ति, जिले का ऐतिहासिक प्रदर्शन",

      "projects.browsing": "ब्राउज़ किया जा रहा है",
      "projects.changeView": "दृश्य बदलें",
      "projects.projectsOnRecord": "{{n}} परियोजनाएं दर्ज हैं",
      "projects.findProjects": "परियोजनाएं खोजें",
      "projects.clearFilters": "फ़िल्टर हटाएं",
      "filter.state": "राज्य",
      "filter.projectType": "परियोजना प्रकार",
      "filter.district": "ज़िला",
      "filter.caseId": "मामला क्रमांक",
      "filter.caseIdPlaceholder": "उदा. LA00123",
      "filter.stage": "प्रक्रिया चरण",
      "filter.possession": "कब्ज़ा स्थिति",
      "filter.riskStatus": "जोखिम स्थिति",
      "filter.allStates": "सभी राज्य",
      "filter.allTypes": "सभी प्रकार",
      "filter.allDistricts": "सभी ज़िले",
      "filter.allStages": "सभी चरण",
      "filter.all": "सभी",
      "filter.flagged": "उच्च-प्राथमिकता चिन्हित",
      "filter.notFlagged": "चिन्हित नहीं",
      "projects.byDept": "विभाग अनुसार उच्च-प्राथमिकता परियोजनाएं",
      "projects.noneMatch": "वर्तमान फ़िल्टर से कोई उच्च-प्राथमिकता परियोजना मेल नहीं खाती।",
      "projects.sortedNote": "मॉडल जोखिम स्कोर के अनुसार क्रमबद्ध, सर्वाधिक जोखिम पहले। परियोजना खोलने हेतु एक पंक्ति चुनें।",
      "projects.footerNote": "\"उच्च प्राथमिकता\" का अर्थ है कि मॉडल ने इस परियोजना को विलंबित होने की संभावना के रूप में चिन्हित किया है, ताकि कोई अधिकारी इसकी समीक्षा करे - यह पुष्टि किया गया विलंब या निर्णय नहीं है।",
      "projects.showingTop": "कुल {{total}} मेल खाती परियोजनाओं में से शीर्ष {{max}} दिखाई जा रही हैं। सूची सीमित करने हेतु फ़िल्टर जोड़ें।",
      "projects.showingAll": "{{n}} मेल खाती परियोजनाएं दिखाई जा रही हैं।",

      "detail.noneSelected.title": "कोई परियोजना चयनित नहीं",
      "detail.noneSelected.body": "परियोजना सूची से, या अवलोकन पृष्ठ पर किसी राज्य के पॉपअप से एक परियोजना खोलें।",
      "detail.notFound.title": "परियोजना {{id}} नहीं मिली",
      "detail.notFound.body": "मामला क्रमांक जांचें, या परियोजना चुनने हेतु परियोजना सूची पर लौटें।",
      "detail.goToList": "परियोजना सूची पर जाएं",
      "detail.project": "परियोजना",
      "detail.backToList": "परियोजना सूची पर वापस जाएं",
      "detail.projectType": "परियोजना प्रकार",
      "detail.location": "स्थान",
      "detail.department": "विभाग",
      "detail.stageOfProcess": "प्रक्रिया चरण",
      "detail.lifecycleStage": "अधिग्रहण जीवनचक्र चरण",
      "detail.riskScoreLabel": "मॉडल विलंब-जोखिम स्कोर",
      "detail.riskScoreScale": "0.00 – 1.00 के पैमाने पर",
      "detail.howCalculated": "यह कैसे परिकलित होता है?",
      "detail.pillarPopTitle": "स्तंभ अनुसार स्कोर विश्लेषण (अनुमानित)",
      "detail.pillarPopNote": "मॉडल के भारांकित कारकों का चार स्तंभों में एक अनुमानित विभाजन, प्रत्येक को 0–1 के बीच दर्शाया गया है। जो कारक किसी एक स्तंभ से संबंधित नहीं हैं वे इसमें शामिल नहीं हैं, इसलिए चारों का योग कुल स्कोर के बराबर नहीं होता। यह समीक्षा हेतु संदर्भ है - अलग से कोई निर्णय नहीं।",
      "detail.awaitingAssessment": "मॉडल मूल्यांकन प्रतीक्षित",
      "detail.flaggedHighPriority": "उच्च-प्राथमिकता चिन्हित",
      "detail.forOfficerReview": "अधिकारी समीक्षा हेतु",
      "detail.notCurrentlyFlagged": "वर्तमान में चिन्हित नहीं",
      "detail.estimatedDelay": "यदि विलंब होता है तो मॉडल-अनुमानित अवधि: लगभग {{n}} महीने।",
      "detail.forOfficerReviewNotice": "<strong>अधिकारी समीक्षा हेतु।</strong> यह स्कोर और नीचे दिए गए बिंदु ध्यान को प्राथमिकता देने में मदद हेतु मॉडल के अनुमान हैं। ये कोई निर्णय, निष्कर्ष नहीं हैं, और न ही क्षेत्रीय सत्यापन या नियत प्रक्रिया का विकल्प हैं।",
      "detail.newProjectNotice": "यह परियोजना लॉग्स डैशबोर्ड (इस ब्राउज़र) पर दर्ज की गई है। मॉडल ने अभी तक इसका मूल्यांकन नहीं किया है, इसलिए कोई जोखिम स्कोर नहीं है - नीचे दिए गए बिंदु दर्ज किए गए डेटा पर आधारित हैं।",
      "detail.editedNotice": "इसमें लॉग्स डैशबोर्ड (इस ब्राउज़र) पर सहेजे गए फ़ील्ड बदलाव शामिल हैं। नीचे दिया गया जोखिम स्कोर मॉडल के अंतिम परिणाम का है - मॉडल सर्वर पर पुनः चलेगा।",
      "detail.keyDriversTitle": "यह परियोजना क्यों चिन्हित है – मुख्य कारण",
      "detail.keyDriversNote": "परियोजना के अपने डेटा से लिए गए सरल-भाषा कारण (docs/architecture.md §4), सबसे महत्वपूर्ण पहले। प्रत्येक के साथ एक सुझाया गया कदम भी है।",
      "detail.noDrivers": "इस परियोजना के लिए उपलब्ध डेटा में कोई प्रमुख जोखिम कारण नहीं पाया गया।",
      "detail.suggestedAction": "सुझाया गया कदम —",
      "detail.recNote": "सुझाए गए कदम समीक्षा अधिकारी हेतु प्रारूप (DRAFT) शब्द हैं, prd.md के अंतिम रूप की प्रतीक्षा में। ये विचारार्थ सुझाव हैं, स्वतः निर्देश नहीं।",
      "detail.pillarsTitle": "चार-स्तंभ विश्लेषण",
      "detail.needsAttention": "ध्यान आवश्यक",
      "detail.noConcerns": "कोई समस्या चिन्हित नहीं",
      "detail.nothingFlagged": "इस परियोजना के लिए इस क्षेत्र में कुछ भी चिन्हित नहीं है।",
      "detail.siaTitle": "सामुदायिक परामर्श (SIA) लॉग",
      "detail.siaSentimentLabel": "सामुदायिक भावना स्कोर (अनुमानित):",
      "detail.siaNote": "भावना स्कोर के पीछे का परामर्श रिकॉर्ड - जैसा दर्ज है वैसा दिखाया गया है। यह कोई निर्णय नहीं है।",
      "detail.siaNoLog": "इस परियोजना के लिए कोई परामर्श लॉग दर्ज नहीं है।",
      "detail.siaEnglishOnlyNote": "यह लॉग मशीन द्वारा अंग्रेज़ी में तैयार किया गया है और जैसा दर्ज है वैसा ही दिखाया गया है; इसका अनुवाद नहीं किया गया है।",
      "detail.fullRecordTitle": "पूर्ण परियोजना रिकॉर्ड",
      "yesNo.yes": "हाँ",
      "yesNo.no": "नहीं",
      "unit.months": "महीने",
      "unit.hectares": "हेक्टेयर",

      "driver.compensation_disputed": "भूस्वामियों द्वारा क्षतिपूर्ति विवादित है",
      "driver.stay_order": "वर्तमान में न्यायालय का स्थगन आदेश प्रभावी है",
      "driver.sentiment": "स्थानीय समुदाय की भावना इस अधिग्रहण के विरुद्ध है",
      "driver.consent": "भूस्वामी सहमति आवश्यक सीमा से कम है",
      "driver.rehab": "प्रभावित परिवारों की संख्या के अनुरूप पुनर्वास स्थल तैयार नहीं है",
      "driver.district": "इस ज़िले में परियोजनाओं में विलंब का इतिहास रहा है",
      "driver.digitize": "भूमि अभिलेख अभी डिजिटल नहीं किए गए हैं",
      "driver.sia": "सामाजिक प्रभाव आकलन (SIA) नहीं किया गया है",
      "rec.compensation_disputed": "ज़िलाधिकारी के साथ क्षतिपूर्ति समीक्षा बैठक करें; वर्तमान सर्किल दरों तथा RFCTLARR अधिनियम, 2013 के मुआवज़ा व गुणक प्रावधानों के अनुरूप अवार्ड की पुनः जांच करें।",
      "rec.stay_order": "स्थगन आदेश की शीघ्र समाप्ति हेतु मामला सरकारी अधिवक्ता को भेजें; न्यायालय का निर्देश प्राप्त होने तक कब्ज़ा रोकें।",
      "rec.consent": "प्रभावित परिवारों के साथ सहमति-निर्माण परामर्श पुनः आरंभ करें; आपत्तियां दर्ज करें और आकलन करें कि इस श्रेणी की परियोजना हेतु सहमति सीमा पूरी की जा सकती है या नहीं।",
      "rec.digitize": "अवार्ड चरण से पहले संबंधित भूमि अभिलेखों के डिजिटलीकरण व मिलान हेतु DILRMP प्रकोष्ठ / तहसीलदार से समन्वय करें।",
      "rec.sia": "RFCTLARR अधिनियम, 2013 के अनुसार आगे की अधिसूचनाएं जारी करने से पूर्व नियुक्त एजेंसी के माध्यम से सामाजिक प्रभाव आकलन (SIA) करवाएं।",
      "rec.sentiment": "शिकायतें दर्ज व निवारण हेतु सार्वजनिक सुनवाई / ग्राम सभा परामर्श आयोजित करें, और परियोजना प्राधिकरण को स्थानीय विरोध के स्तर से अवगत कराएं।",
      "rec.rehab": "पुनर्वास एवं पुनर्स्थापन प्रशासक के साथ पुनर्वास स्थल विकास को गति दें; कब्ज़ा लेने से पूर्व स्थल अवसंरचना व आवंटन योजना की पुष्टि करें।",
      "rec.district": "इस परियोजना को घनिष्ठ निगरानी हेतु ज़िला समीक्षा समिति के अधीन रखें, और पाक्षिक प्रगति समीक्षा निर्धारित करें।",

      "concern.siaNotConducted": "SIA नहीं किया गया",
      "concern.consentBelow": "सहमति सीमा से कम ({{pct}}%)",
      "concern.sentimentLow": "सामुदायिक भावना निम्न ({{score}})",
      "concern.compDisputed": "क्षतिपूर्ति विवादित",
      "concern.recordsNotDigitised": "भूमि अभिलेख डिजिटल नहीं हुए",
      "concern.surveyPending": "सर्वेक्षण / निपटान लंबित",
      "concern.stayOrder": "स्थगन आदेश प्रभावी",
      "concern.casePending": "न्यायालय में मामला लंबित",
      "concern.litigation": "वाद: {{type}}",
      "concern.rrPlanNotPrepared": "पुनर्वास एवं पुनर्स्थापन योजना तैयार नहीं",
      "concern.siteNotReady": "{{n}} परिवारों हेतु स्थल तैयार नहीं",
      "concern.livelihoodNotProvided": "आजीविका पुनर्स्थापन प्रदान नहीं किया गया",
      "concern.noOfficer": "कोई अवार्ड अधिकारी नियुक्त नहीं",
      "concern.districtHigh": "ज़िले में विलंब का इतिहास अधिक ({{pct}}%)",
      "concern.possessionNotStarted": "कब्ज़ा आरंभ नहीं हुआ",
      "concern.responsivenessLow": "हितधारक प्रतिक्रिया निम्न ({{score}})",

      "logs.betaBanner": "<strong>बीटा चरण।</strong> यहां की प्रविष्टियां केवल <strong>इस ब्राउज़र</strong> में सहेजी जाती हैं और सर्वर पर नहीं भेजी जातीं। ये अवलोकन डैशबोर्ड में मिला दी जाती हैं ताकि आप अपने इनपुट का प्रभाव देख सकें। उत्पादन में यह परियोजना डेटाबेस में लिखा जाएगा और मॉडल पुनः चलेगा।",
      "logs.heading.default": "परियोजना डेटा प्रविष्टि",
      "logs.description": "एक नई परियोजना दर्ज करें, या किसी मौजूदा परियोजना को अद्यतन करने हेतु चुनें। फ़ील्ड अवलोकन डैशबोर्ड के \"पूर्ण परियोजना रिकॉर्ड\" से मेल खाते हैं। परियोजना क्रमांक स्वतः निर्धारित होता है।",
      "logs.project": "परियोजना",
      "logs.selectProject": "— एक परियोजना चुनें —",
      "logs.newProject": "+ नई परियोजना",
      "logs.unnamed": "(नामरहित)",
      "logs.newTag": "[नई]",
      "logs.save": "सहेजें",
      "logs.discard": "स्थानीय परिवर्तन हटाएं",
      "logs.heading.new": "नई परियोजना",
      "logs.numberAssignedOnSave": "सहेजने पर परियोजना क्रमांक {{id}} निर्धारित किया जाएगा।",
      "logs.heading.editing": "{{id}} संपादित की जा रही है",
      "logs.heading.editingNew": "{{id}} ({{name}}, यहां बनाई गई) संपादित की जा रही है",
      "logs.lastSaved": "अंतिम बार सहेजा गया {{date}}",
      "logs.noEditsYet": "अभी तक कोई स्थानीय परिवर्तन नहीं - दिखाए गए मान मूल हैं।",
      "logs.enterNameFirst": "सहेजने से पहले परियोजना का नाम दर्ज करें।",
      "logs.created": "{{id}} बनाई गई। ",
      "logs.saved": "{{id}} सहेजी गई। ",
      "logs.openInViewing": "अवलोकन डैशबोर्ड में खोलें",
      "logs.newDiscarded": "नई परियोजना हटा दी गई।",
      "logs.editsDiscarded": "स्थानीय परिवर्तन हटा दिए गए।",
      "logs.selectPlaceholder": "— चुनें —",
      "logs.readonlyEmpty": "—",

      "login.title": "साइन इन करें",
      "login.yourName": "आपका नाम",
      "login.namePlaceholder": "उदा. ए. देशमुख",
      "login.role": "भूमिका",
      "login.role.viewing": "जोखिम-अवलोकन — विलंब-जोखिम पूर्वानुमान की समीक्षा करें",
      "login.role.logs": "लॉग्स — ज़मीनी अपडेट व मानव इनपुट दर्ज करें (जल्द आ रहा है)",
      "login.role.admin": "प्रशासनिक — अंतर-विभागीय समन्वय व कार्य निष्पादन (जल्द आ रहा है)",
      "login.continue": "जारी रखें",
      "login.enterName": "जारी रखने के लिए कृपया अपना नाम दर्ज करें।",
      "login.notice": "<strong>प्रारंभिक (प्रोटोटाइप) साइन-इन।</strong> यह SIH बीटा हेतु एक प्रदर्शन द्वार है - यह किसी वास्तविक प्रमाणीकरण सेवा से जुड़ा नहीं है और पहचान सत्यापित नहीं करता। लॉग्स व प्रशासनिक डैशबोर्ड की योजना है; फ़िलहाल हर भूमिका जोखिम-अवलोकन डैशबोर्ड खोलती है।",

      "analytics.title": "जिला / राज्य विश्लेषण",
      "analytics.body": "यह टैब (राज्य तुलना, परियोजना-प्रकार अनुसार विलंब दर, ज़िले का ऐतिहासिक प्रदर्शन) अगले निर्माण चरण हेतु नियोजित है। नेविगेशन पूर्ण दिखाने हेतु इसे यहां सूचीबद्ध किया गया है; यह पृष्ठ अभी नहीं बना है।",
      "analytics.backToOverview": "अवलोकन पर वापस जाएं"
    }
  };

  /* ========================================================================
     DATA VALUE translations (for DISPLAY only - the underlying data/labels
     used for filtering, storage, and comparisons never change).
     ======================================================================== */
  var ENUM_HI = {
    // project_type
    "Highway": "राजमार्ग", "Railway": "रेलवे", "Irrigation": "सिंचाई",
    "Industrial Corridor": "औद्योगिक गलियारा", "Urban Housing": "शहरी आवास",
    "Mining": "खनन", "Power Plant": "ऊर्जा संयंत्र",
    // land_type
    "Agricultural": "कृषि भूमि", "Forest": "वन भूमि",
    "Tribal/Scheduled Area": "आदिवासी/अनुसूचित क्षेत्र",
    "Urban/Residential": "शहरी/आवासीय", "Wasteland": "बंजर भूमि",
    // acquiring_authority
    "State PWD": "राज्य लोक निर्माण विभाग", "NHAI": "भारतीय राष्ट्रीय राजमार्ग प्राधिकरण (NHAI)",
    "Indian Railways": "भारतीय रेल", "State Industrial Dev. Corp": "राज्य औद्योगिक विकास निगम",
    "Municipal Corporation": "नगर निगम", "Irrigation Dept": "सिंचाई विभाग",
    "State Power Corp": "राज्य विद्युत निगम",
    // litigation_type
    "None": "कोई नहीं", "Compensation Dispute": "क्षतिपूर्ति विवाद",
    "Title Dispute": "स्वामित्व विवाद", "Public Purpose Challenge": "सार्वजनिक प्रयोजन चुनौती",
    // possession_status
    "Not Started": "आरंभ नहीं हुआ", "Partial": "आंशिक", "Full": "पूर्ण",
    // stage_of_process
    "Notification": "अधिसूचना", "SIA": "सामाजिक प्रभाव आकलन (SIA)",
    "Award Declared": "अवार्ड घोषित", "Possession Taken": "कब्ज़ा लिया गया",
    "Compensation Disbursed": "क्षतिपूर्ति वितरित", "Closed": "बंद",
    // states
    "Maharashtra": "महाराष्ट्र", "Uttar Pradesh": "उत्तर प्रदेश", "Madhya Pradesh": "मध्य प्रदेश",
    "Odisha": "ओडिशा", "Bihar": "बिहार", "Gujarat": "गुजरात", "Punjab": "पंजाब",
    "West Bengal": "पश्चिम बंगाल", "Rajasthan": "राजस्थान", "Karnataka": "कर्नाटक"
  };

  // Group / fieldset titles used by detail.js (full record) and logs.js
  // (form legends) - keyed by the literal English title already in schema.js,
  // so schema.js stays the single source of truth for the titles themselves.
  var GROUP_TITLE_HI = {
    "Identification": "पहचान",
    "Status": "स्थिति",
    "Project scale": "परियोजना पैमाना",
    "1. Acquisition process health": "1. अधिग्रहण प्रक्रिया स्वास्थ्य",
    "2. Legal disputes": "2. कानूनी विवाद",
    "3. Rehabilitation readiness": "3. पुनर्वास तत्परता",
    "4. Administrative efficiency": "4. प्रशासनिक दक्षता",
    "Model output": "मॉडल परिणाम"
  };

  // Hindi field labels, only where they differ from PROJECT_SCHEMA.labels'
  // English text (fieldLabel() falls back to that English text otherwise).
  var FIELD_LABEL_HI = {
    case_id: "परियोजना क्रमांक", project_name: "परियोजना का नाम",
    state: "राज्य", district: "ज़िला", project_type: "परियोजना प्रकार",
    acquiring_authority: "अर्जनकर्ता प्राधिकरण (विभाग)", land_area_hectares: "भूमि क्षेत्रफल",
    land_type: "भूमि प्रकार", num_affected_families: "प्रभावित परिवार",
    sia_conducted: "SIA किया गया", consent_percentage: "भूस्वामी सहमति",
    community_sentiment_score: "सामुदायिक भावना (0–1)",
    compensation_offered_per_hectare: "प्रस्तावित क्षतिपूर्ति",
    compensation_disputed: "क्षतिपूर्ति विवादित",
    land_records_digitized: "भूमि अभिलेख डिजिटल",
    survey_settlement_pending: "सर्वेक्षण / निपटान लंबित",
    approval_timeline_days: "अनुमोदन समयसीमा (दिन)",
    court_case_filed: "न्यायालय मामला दर्ज",
    litigation_type: "वाद प्रकार", case_pending_court: "न्यायालय में मामला लंबित",
    stay_order_issued: "स्थगन आदेश जारी",
    case_pendency_duration_months: "मामला लंबन अवधि (महीने)",
    r_and_r_plan_prepared: "पुनर्वास एवं पुनर्स्थापन योजना तैयार",
    families_to_be_resettled: "पुनर्स्थापित होने वाले परिवार",
    rehabilitation_site_ready: "पुनर्वास स्थल तैयार",
    livelihood_restoration_provided: "आजीविका पुनर्स्थापन प्रदान",
    possession_status: "कब्ज़ा स्थिति",
    stakeholder_responsiveness_score: "हितधारक प्रतिक्रिया (0–1)",
    awarding_officer_assigned: "अवार्ड अधिकारी नियुक्त",
    district_historical_delay_rate: "ज़िले की ऐतिहासिक विलंब दर",
    days_since_notification: "अधिसूचना के बाद के दिन",
    stage_of_process: "प्रक्रिया चरण",
    risk_score: "मॉडल जोखिम स्कोर", delayed: "विलंबित होने की संभावना चिन्हित",
    delay_duration_months: "मॉडल-अनुमानित विलंब (यदि हो)"
  };


  /* ========================================================================
     Engine
     ======================================================================== */

  function getLanguage() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      return saved === "hi" ? "hi" : "en";
    } catch (e) {
      return "en";
    }
  }

  function setLanguage(lang) {
    try { localStorage.setItem(LANG_KEY, lang === "hi" ? "hi" : "en"); } catch (e) { /* ignore */ }
  }

  function isHindi() { return getLanguage() === "hi"; }

  // Look up one UI string, with optional {{placeholder}} substitution.
  function t(key, vars) {
    var dict = DICT[getLanguage()] || DICT.en;
    var s = (Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : null) ||
            DICT.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        s = s.split("{{" + name + "}}").join(vars[name]);
      });
    }
    return s;
  }

  // Translate a fixed DATA VALUE (state name, "Highway", "Not Started", ...)
  // for display. The value itself - what's filtered on and saved - is untouched.
  function tv(value) {
    if (!isHindi()) { return value; }
    return Object.prototype.hasOwnProperty.call(ENUM_HI, value) ? ENUM_HI[value] : value;
  }

  // Translate a group/fieldset title (schema.js group.title strings).
  function groupTitle(englishTitle) {
    if (!isHindi()) { return englishTitle; }
    return GROUP_TITLE_HI[englishTitle] || englishTitle;
  }

  // Translate a schema field label. Falls back to PROJECT_SCHEMA's own English
  // label so this file doesn't need to duplicate every field name.
  function fieldLabel(key) {
    var english = (window.PROJECT_SCHEMA && window.PROJECT_SCHEMA.labels[key]) || key;
    if (!isHindi()) { return english; }
    return FIELD_LABEL_HI[key] || english;
  }

  // Fill every [data-i18n] element's text (and [data-i18n-html]'s markup) from
  // the dictionary. Called once from app.js, after the whole page - shell
  // included - is in the DOM.
  function applyStatic(root) {
    (root || document).querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    (root || document).querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    (root || document).querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    (root || document).querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
  }

  return {
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    isHindi: isHindi,
    t: t,
    tv: tv,
    groupTitle: groupTitle,
    fieldLabel: fieldLabel,
    applyStatic: applyStatic
  };
})();
