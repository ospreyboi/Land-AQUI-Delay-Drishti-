/*
 * TEMPORARY STATIC DATA SNAPSHOT  --  pre-integration scaffolding.
 *
 * Every number below is a REAL aggregate computed from
 * data/land_acquisition_synthetic.csv (the same synthetic dataset the model will
 * train on). It is embedded here so the Overview page can be built and reviewed
 * before the backend exists.
 *
 * AT BACKEND INTEGRATION:
 *   1. delete this file and its <script> tag in index.html
 *   2. overview.js -> getOverviewData() switches to fetch('/analytics/overview')
 *      (it already returns a Promise today, so the calling code will not change)
 *
 * Definitions used on this page:
 *   high-priority / high-risk case  =  project where  delayed = true
 *   legal case pending             =  project where  case_pending_court = true
 *                                     (team lead to confirm the final rule)
 *   department                     =  acquiring_authority column
 *   model risk score (per project) =  risk_score column (0-1), shown as context only
 *
 * The source dataset is SYNTHETIC, calibrated to published patterns (NJDG, DoLR/
 * LACRRIS, DILRMP). It is not real case data.
 */

window.OVERVIEW_SNAPSHOT = {
  "generated_from": "land_acquisition_synthetic.csv (5000 rows)",
  "national": {"total_cases": 5000, "high_priority_cases": 1488, "legal_cases_pending": 964},
  "states": {
    "Bihar": {
      "total_cases": 500,
      "high_priority_cases": 155,
      "legal_cases_pending": 90,
      "flagged_projects_total": 155,
      "departments": [
        {"department": "Municipal Corporation", "high_priority_count": 25},
        {"department": "State Power Corp", "high_priority_count": 25},
        {"department": "NHAI", "high_priority_count": 24},
        {"department": "Indian Railways", "high_priority_count": 22},
        {"department": "State PWD", "high_priority_count": 21},
        {"department": "Irrigation Dept", "high_priority_count": 20},
        {"department": "State Industrial Dev. Corp", "high_priority_count": 18}
      ],
      "flagged_projects_top": [
        {"case_id": "LA02000", "district": "Bihar_District_4", "project_type": "Railway", "department": "State Power Corp", "risk_score": 1.0, "case_pending_court": true},
        {"case_id": "LA01373", "district": "Bihar_District_1", "project_type": "Urban Housing", "department": "Indian Railways", "risk_score": 0.899, "case_pending_court": true},
        {"case_id": "LA00233", "district": "Bihar_District_1", "project_type": "Highway", "department": "State PWD", "risk_score": 0.846, "case_pending_court": true},
        {"case_id": "LA04267", "district": "Bihar_District_3", "project_type": "Mining", "department": "State Industrial Dev. Corp", "risk_score": 0.841, "case_pending_court": true},
        {"case_id": "LA01232", "district": "Bihar_District_3", "project_type": "Irrigation", "department": "Municipal Corporation", "risk_score": 0.814, "case_pending_court": false},
        {"case_id": "LA00634", "district": "Bihar_District_3", "project_type": "Power Plant", "department": "State Power Corp", "risk_score": 0.799, "case_pending_court": true},
        {"case_id": "LA00383", "district": "Bihar_District_1", "project_type": "Railway", "department": "Irrigation Dept", "risk_score": 0.798, "case_pending_court": true},
        {"case_id": "LA04933", "district": "Bihar_District_3", "project_type": "Industrial Corridor", "department": "State Power Corp", "risk_score": 0.796, "case_pending_court": true},
        {"case_id": "LA02741", "district": "Bihar_District_2", "project_type": "Railway", "department": "Municipal Corporation", "risk_score": 0.794, "case_pending_court": false},
        {"case_id": "LA03078", "district": "Bihar_District_3", "project_type": "Urban Housing", "department": "State Industrial Dev. Corp", "risk_score": 0.789, "case_pending_court": true}
      ]
    },
    "Gujarat": {
      "total_cases": 489,
      "high_priority_cases": 153,
      "legal_cases_pending": 101,
      "flagged_projects_total": 153,
      "departments": [
        {"department": "Municipal Corporation", "high_priority_count": 28},
        {"department": "State PWD", "high_priority_count": 25},
        {"department": "Irrigation Dept", "high_priority_count": 24},
        {"department": "State Power Corp", "high_priority_count": 23},
        {"department": "NHAI", "high_priority_count": 21},
        {"department": "Indian Railways", "high_priority_count": 17},
        {"department": "State Industrial Dev. Corp", "high_priority_count": 15}
      ],
      "flagged_projects_top": [
        {"case_id": "LA03774", "district": "Gujarat_District_2", "project_type": "Irrigation", "department": "State Power Corp", "risk_score": 0.937, "case_pending_court": true},
        {"case_id": "LA04506", "district": "Gujarat_District_4", "project_type": "Power Plant", "department": "State Power Corp", "risk_score": 0.908, "case_pending_court": true},
        {"case_id": "LA03645", "district": "Gujarat_District_2", "project_type": "Power Plant", "department": "NHAI", "risk_score": 0.906, "case_pending_court": true},
        {"case_id": "LA02088", "district": "Gujarat_District_3", "project_type": "Highway", "department": "State PWD", "risk_score": 0.854, "case_pending_court": true},
        {"case_id": "LA03823", "district": "Gujarat_District_4", "project_type": "Highway", "department": "Irrigation Dept", "risk_score": 0.85, "case_pending_court": true},
        {"case_id": "LA04461", "district": "Gujarat_District_4", "project_type": "Railway", "department": "State Power Corp", "risk_score": 0.804, "case_pending_court": true},
        {"case_id": "LA01865", "district": "Gujarat_District_4", "project_type": "Power Plant", "department": "Municipal Corporation", "risk_score": 0.79, "case_pending_court": true},
        {"case_id": "LA01990", "district": "Gujarat_District_2", "project_type": "Urban Housing", "department": "Irrigation Dept", "risk_score": 0.789, "case_pending_court": true},
        {"case_id": "LA00262", "district": "Gujarat_District_1", "project_type": "Urban Housing", "department": "State Industrial Dev. Corp", "risk_score": 0.771, "case_pending_court": false},
        {"case_id": "LA01980", "district": "Gujarat_District_1", "project_type": "Mining", "department": "State Power Corp", "risk_score": 0.768, "case_pending_court": true}
      ]
    },
    "Karnataka": {
      "total_cases": 490,
      "high_priority_cases": 142,
      "legal_cases_pending": 85,
      "flagged_projects_total": 142,
      "departments": [
        {"department": "State Industrial Dev. Corp", "high_priority_count": 25},
        {"department": "Municipal Corporation", "high_priority_count": 24},
        {"department": "NHAI", "high_priority_count": 24},
        {"department": "State Power Corp", "high_priority_count": 23},
        {"department": "Indian Railways", "high_priority_count": 22},
        {"department": "Irrigation Dept", "high_priority_count": 16},
        {"department": "State PWD", "high_priority_count": 8}
      ],
      "flagged_projects_top": [
        {"case_id": "LA04182", "district": "Karnataka_District_4", "project_type": "Railway", "department": "Irrigation Dept", "risk_score": 1.0, "case_pending_court": true},
        {"case_id": "LA00524", "district": "Karnataka_District_1", "project_type": "Industrial Corridor", "department": "State Power Corp", "risk_score": 0.837, "case_pending_court": true},
        {"case_id": "LA02016", "district": "Karnataka_District_1", "project_type": "Mining", "department": "Municipal Corporation", "risk_score": 0.812, "case_pending_court": false},
        {"case_id": "LA00525", "district": "Karnataka_District_1", "project_type": "Urban Housing", "department": "NHAI", "risk_score": 0.803, "case_pending_court": true},
        {"case_id": "LA03614", "district": "Karnataka_District_1", "project_type": "Mining", "department": "NHAI", "risk_score": 0.789, "case_pending_court": true},
        {"case_id": "LA03659", "district": "Karnataka_District_2", "project_type": "Power Plant", "department": "Irrigation Dept", "risk_score": 0.778, "case_pending_court": true},
        {"case_id": "LA02669", "district": "Karnataka_District_1", "project_type": "Mining", "department": "Municipal Corporation", "risk_score": 0.77, "case_pending_court": true},
        {"case_id": "LA02046", "district": "Karnataka_District_3", "project_type": "Railway", "department": "State Industrial Dev. Corp", "risk_score": 0.763, "case_pending_court": true},
        {"case_id": "LA00998", "district": "Karnataka_District_1", "project_type": "Highway", "department": "Indian Railways", "risk_score": 0.76, "case_pending_court": true},
        {"case_id": "LA01192", "district": "Karnataka_District_4", "project_type": "Irrigation", "department": "Municipal Corporation", "risk_score": 0.757, "case_pending_court": true}
      ]
    },
    "Madhya Pradesh": {
      "total_cases": 521,
      "high_priority_cases": 167,
      "legal_cases_pending": 108,
      "flagged_projects_total": 167,
      "departments": [
        {"department": "State Industrial Dev. Corp", "high_priority_count": 30},
        {"department": "State PWD", "high_priority_count": 28},
        {"department": "Municipal Corporation", "high_priority_count": 25},
        {"department": "State Power Corp", "high_priority_count": 24},
        {"department": "Indian Railways", "high_priority_count": 22},
        {"department": "Irrigation Dept", "high_priority_count": 20},
        {"department": "NHAI", "high_priority_count": 18}
      ],
      "flagged_projects_top": [
        {"case_id": "LA04633", "district": "Madhya Pradesh_District_2", "project_type": "Highway", "department": "State PWD", "risk_score": 0.997, "case_pending_court": true},
        {"case_id": "LA01680", "district": "Madhya Pradesh_District_3", "project_type": "Urban Housing", "department": "State PWD", "risk_score": 0.947, "case_pending_court": true},
        {"case_id": "LA01230", "district": "Madhya Pradesh_District_4", "project_type": "Irrigation", "department": "State Industrial Dev. Corp", "risk_score": 0.897, "case_pending_court": true},
        {"case_id": "LA00476", "district": "Madhya Pradesh_District_3", "project_type": "Irrigation", "department": "Indian Railways", "risk_score": 0.887, "case_pending_court": true},
        {"case_id": "LA03923", "district": "Madhya Pradesh_District_1", "project_type": "Urban Housing", "department": "State PWD", "risk_score": 0.833, "case_pending_court": true},
        {"case_id": "LA03427", "district": "Madhya Pradesh_District_2", "project_type": "Irrigation", "department": "State Industrial Dev. Corp", "risk_score": 0.809, "case_pending_court": true},
        {"case_id": "LA04966", "district": "Madhya Pradesh_District_2", "project_type": "Urban Housing", "department": "State PWD", "risk_score": 0.798, "case_pending_court": true},
        {"case_id": "LA01786", "district": "Madhya Pradesh_District_2", "project_type": "Mining", "department": "State PWD", "risk_score": 0.788, "case_pending_court": false},
        {"case_id": "LA00750", "district": "Madhya Pradesh_District_3", "project_type": "Industrial Corridor", "department": "State Power Corp", "risk_score": 0.764, "case_pending_court": true},
        {"case_id": "LA04343", "district": "Madhya Pradesh_District_2", "project_type": "Railway", "department": "Irrigation Dept", "risk_score": 0.755, "case_pending_court": true}
      ]
    },
    "Maharashtra": {
      "total_cases": 512,
      "high_priority_cases": 138,
      "legal_cases_pending": 97,
      "flagged_projects_total": 138,
      "departments": [
        {"department": "State Power Corp", "high_priority_count": 28},
        {"department": "State PWD", "high_priority_count": 23},
        {"department": "Municipal Corporation", "high_priority_count": 21},
        {"department": "Irrigation Dept", "high_priority_count": 19},
        {"department": "NHAI", "high_priority_count": 17},
        {"department": "Indian Railways", "high_priority_count": 16},
        {"department": "State Industrial Dev. Corp", "high_priority_count": 14}
      ],
      "flagged_projects_top": [
        {"case_id": "LA04911", "district": "Maharashtra_District_1", "project_type": "Railway", "department": "Municipal Corporation", "risk_score": 1.0, "case_pending_court": true},
        {"case_id": "LA02312", "district": "Maharashtra_District_2", "project_type": "Irrigation", "department": "State Power Corp", "risk_score": 0.907, "case_pending_court": true},
        {"case_id": "LA03261", "district": "Maharashtra_District_3", "project_type": "Irrigation", "department": "State PWD", "risk_score": 0.867, "case_pending_court": true},
        {"case_id": "LA01544", "district": "Maharashtra_District_4", "project_type": "Industrial Corridor", "department": "Indian Railways", "risk_score": 0.855, "case_pending_court": true},
        {"case_id": "LA01375", "district": "Maharashtra_District_3", "project_type": "Urban Housing", "department": "State Power Corp", "risk_score": 0.801, "case_pending_court": true},
        {"case_id": "LA01367", "district": "Maharashtra_District_4", "project_type": "Mining", "department": "State PWD", "risk_score": 0.799, "case_pending_court": true},
        {"case_id": "LA00359", "district": "Maharashtra_District_3", "project_type": "Power Plant", "department": "State Power Corp", "risk_score": 0.796, "case_pending_court": true},
        {"case_id": "LA03388", "district": "Maharashtra_District_3", "project_type": "Urban Housing", "department": "NHAI", "risk_score": 0.768, "case_pending_court": true},
        {"case_id": "LA03495", "district": "Maharashtra_District_2", "project_type": "Highway", "department": "Municipal Corporation", "risk_score": 0.755, "case_pending_court": true},
        {"case_id": "LA00663", "district": "Maharashtra_District_3", "project_type": "Irrigation", "department": "State Industrial Dev. Corp", "risk_score": 0.755, "case_pending_court": false}
      ]
    },
    "Odisha": {
      "total_cases": 485,
      "high_priority_cases": 131,
      "legal_cases_pending": 87,
      "flagged_projects_total": 131,
      "departments": [
        {"department": "Irrigation Dept", "high_priority_count": 26},
        {"department": "State Industrial Dev. Corp", "high_priority_count": 21},
        {"department": "State PWD", "high_priority_count": 20},
        {"department": "Indian Railways", "high_priority_count": 17},
        {"department": "State Power Corp", "high_priority_count": 17},
        {"department": "Municipal Corporation", "high_priority_count": 15},
        {"department": "NHAI", "high_priority_count": 15}
      ],
      "flagged_projects_top": [
        {"case_id": "LA03732", "district": "Odisha_District_1", "project_type": "Highway", "department": "State Power Corp", "risk_score": 0.897, "case_pending_court": true},
        {"case_id": "LA04441", "district": "Odisha_District_4", "project_type": "Irrigation", "department": "State Industrial Dev. Corp", "risk_score": 0.851, "case_pending_court": true},
        {"case_id": "LA01702", "district": "Odisha_District_1", "project_type": "Railway", "department": "NHAI", "risk_score": 0.833, "case_pending_court": true},
        {"case_id": "LA01518", "district": "Odisha_District_4", "project_type": "Mining", "department": "Irrigation Dept", "risk_score": 0.811, "case_pending_court": true},
        {"case_id": "LA01008", "district": "Odisha_District_4", "project_type": "Mining", "department": "Indian Railways", "risk_score": 0.802, "case_pending_court": true},
        {"case_id": "LA01713", "district": "Odisha_District_2", "project_type": "Urban Housing", "department": "State PWD", "risk_score": 0.798, "case_pending_court": true},
        {"case_id": "LA02316", "district": "Odisha_District_4", "project_type": "Irrigation", "department": "State Industrial Dev. Corp", "risk_score": 0.79, "case_pending_court": true},
        {"case_id": "LA00774", "district": "Odisha_District_3", "project_type": "Highway", "department": "Municipal Corporation", "risk_score": 0.779, "case_pending_court": true},
        {"case_id": "LA04322", "district": "Odisha_District_3", "project_type": "Industrial Corridor", "department": "NHAI", "risk_score": 0.775, "case_pending_court": true},
        {"case_id": "LA02697", "district": "Odisha_District_1", "project_type": "Railway", "department": "State Industrial Dev. Corp", "risk_score": 0.768, "case_pending_court": false}
      ]
    },
    "Punjab": {
      "total_cases": 516,
      "high_priority_cases": 164,
      "legal_cases_pending": 103,
      "flagged_projects_total": 164,
      "departments": [
        {"department": "Irrigation Dept", "high_priority_count": 27},
        {"department": "State Industrial Dev. Corp", "high_priority_count": 26},
        {"department": "State PWD", "high_priority_count": 26},
        {"department": "Indian Railways", "high_priority_count": 23},
        {"department": "Municipal Corporation", "high_priority_count": 22},
        {"department": "NHAI", "high_priority_count": 21},
        {"department": "State Power Corp", "high_priority_count": 19}
      ],
      "flagged_projects_top": [
        {"case_id": "LA02811", "district": "Punjab_District_3", "project_type": "Highway", "department": "Municipal Corporation", "risk_score": 0.964, "case_pending_court": true},
        {"case_id": "LA01258", "district": "Punjab_District_2", "project_type": "Industrial Corridor", "department": "State Industrial Dev. Corp", "risk_score": 0.88, "case_pending_court": false},
        {"case_id": "LA00997", "district": "Punjab_District_1", "project_type": "Railway", "department": "Irrigation Dept", "risk_score": 0.868, "case_pending_court": false},
        {"case_id": "LA00692", "district": "Punjab_District_4", "project_type": "Power Plant", "department": "Irrigation Dept", "risk_score": 0.86, "case_pending_court": true},
        {"case_id": "LA02321", "district": "Punjab_District_3", "project_type": "Highway", "department": "Municipal Corporation", "risk_score": 0.839, "case_pending_court": true},
        {"case_id": "LA01588", "district": "Punjab_District_3", "project_type": "Industrial Corridor", "department": "State PWD", "risk_score": 0.829, "case_pending_court": true},
        {"case_id": "LA03619", "district": "Punjab_District_1", "project_type": "Industrial Corridor", "department": "State Power Corp", "risk_score": 0.821, "case_pending_court": true},
        {"case_id": "LA02601", "district": "Punjab_District_4", "project_type": "Highway", "department": "Irrigation Dept", "risk_score": 0.816, "case_pending_court": true},
        {"case_id": "LA02619", "district": "Punjab_District_2", "project_type": "Railway", "department": "Indian Railways", "risk_score": 0.796, "case_pending_court": false},
        {"case_id": "LA02112", "district": "Punjab_District_2", "project_type": "Urban Housing", "department": "State PWD", "risk_score": 0.795, "case_pending_court": true}
      ]
    },
    "Rajasthan": {
      "total_cases": 511,
      "high_priority_cases": 153,
      "legal_cases_pending": 108,
      "flagged_projects_total": 153,
      "departments": [
        {"department": "Irrigation Dept", "high_priority_count": 28},
        {"department": "State PWD", "high_priority_count": 26},
        {"department": "NHAI", "high_priority_count": 24},
        {"department": "State Industrial Dev. Corp", "high_priority_count": 22},
        {"department": "State Power Corp", "high_priority_count": 21},
        {"department": "Indian Railways", "high_priority_count": 16},
        {"department": "Municipal Corporation", "high_priority_count": 16}
      ],
      "flagged_projects_top": [
        {"case_id": "LA00044", "district": "Rajasthan_District_2", "project_type": "Irrigation", "department": "State Power Corp", "risk_score": 0.892, "case_pending_court": true},
        {"case_id": "LA00251", "district": "Rajasthan_District_4", "project_type": "Railway", "department": "Irrigation Dept", "risk_score": 0.862, "case_pending_court": true},
        {"case_id": "LA01811", "district": "Rajasthan_District_1", "project_type": "Irrigation", "department": "State PWD", "risk_score": 0.831, "case_pending_court": true},
        {"case_id": "LA00569", "district": "Rajasthan_District_1", "project_type": "Urban Housing", "department": "State PWD", "risk_score": 0.827, "case_pending_court": false},
        {"case_id": "LA01918", "district": "Rajasthan_District_2", "project_type": "Irrigation", "department": "State Industrial Dev. Corp", "risk_score": 0.791, "case_pending_court": false},
        {"case_id": "LA02459", "district": "Rajasthan_District_3", "project_type": "Irrigation", "department": "NHAI", "risk_score": 0.779, "case_pending_court": false},
        {"case_id": "LA02533", "district": "Rajasthan_District_4", "project_type": "Industrial Corridor", "department": "State Industrial Dev. Corp", "risk_score": 0.747, "case_pending_court": true},
        {"case_id": "LA04792", "district": "Rajasthan_District_2", "project_type": "Railway", "department": "Irrigation Dept", "risk_score": 0.741, "case_pending_court": false},
        {"case_id": "LA04232", "district": "Rajasthan_District_4", "project_type": "Highway", "department": "State Power Corp", "risk_score": 0.734, "case_pending_court": false},
        {"case_id": "LA00337", "district": "Rajasthan_District_3", "project_type": "Power Plant", "department": "Irrigation Dept", "risk_score": 0.729, "case_pending_court": true}
      ]
    },
    "Uttar Pradesh": {
      "total_cases": 488,
      "high_priority_cases": 151,
      "legal_cases_pending": 93,
      "flagged_projects_total": 151,
      "departments": [
        {"department": "Irrigation Dept", "high_priority_count": 28},
        {"department": "State Power Corp", "high_priority_count": 24},
        {"department": "NHAI", "high_priority_count": 23},
        {"department": "State Industrial Dev. Corp", "high_priority_count": 21},
        {"department": "State PWD", "high_priority_count": 21},
        {"department": "Indian Railways", "high_priority_count": 19},
        {"department": "Municipal Corporation", "high_priority_count": 15}
      ],
      "flagged_projects_top": [
        {"case_id": "LA01248", "district": "Uttar Pradesh_District_1", "project_type": "Industrial Corridor", "department": "Irrigation Dept", "risk_score": 0.838, "case_pending_court": true},
        {"case_id": "LA00517", "district": "Uttar Pradesh_District_3", "project_type": "Industrial Corridor", "department": "State PWD", "risk_score": 0.816, "case_pending_court": true},
        {"case_id": "LA04730", "district": "Uttar Pradesh_District_1", "project_type": "Power Plant", "department": "State Power Corp", "risk_score": 0.807, "case_pending_court": true},
        {"case_id": "LA02827", "district": "Uttar Pradesh_District_3", "project_type": "Industrial Corridor", "department": "State Industrial Dev. Corp", "risk_score": 0.806, "case_pending_court": true},
        {"case_id": "LA02174", "district": "Uttar Pradesh_District_1", "project_type": "Urban Housing", "department": "State Industrial Dev. Corp", "risk_score": 0.792, "case_pending_court": true},
        {"case_id": "LA04466", "district": "Uttar Pradesh_District_1", "project_type": "Power Plant", "department": "State PWD", "risk_score": 0.785, "case_pending_court": true},
        {"case_id": "LA03667", "district": "Uttar Pradesh_District_1", "project_type": "Railway", "department": "Indian Railways", "risk_score": 0.78, "case_pending_court": true},
        {"case_id": "LA04266", "district": "Uttar Pradesh_District_3", "project_type": "Industrial Corridor", "department": "State Power Corp", "risk_score": 0.768, "case_pending_court": true},
        {"case_id": "LA02660", "district": "Uttar Pradesh_District_1", "project_type": "Mining", "department": "State Industrial Dev. Corp", "risk_score": 0.764, "case_pending_court": false},
        {"case_id": "LA01897", "district": "Uttar Pradesh_District_1", "project_type": "Urban Housing", "department": "NHAI", "risk_score": 0.76, "case_pending_court": false}
      ]
    },
    "West Bengal": {
      "total_cases": 488,
      "high_priority_cases": 134,
      "legal_cases_pending": 92,
      "flagged_projects_total": 134,
      "departments": [
        {"department": "Municipal Corporation", "high_priority_count": 29},
        {"department": "Indian Railways", "high_priority_count": 19},
        {"department": "State Power Corp", "high_priority_count": 19},
        {"department": "State Industrial Dev. Corp", "high_priority_count": 18},
        {"department": "State PWD", "high_priority_count": 18},
        {"department": "Irrigation Dept", "high_priority_count": 17},
        {"department": "NHAI", "high_priority_count": 14}
      ],
      "flagged_projects_top": [
        {"case_id": "LA03483", "district": "West Bengal_District_2", "project_type": "Highway", "department": "NHAI", "risk_score": 0.963, "case_pending_court": true},
        {"case_id": "LA00244", "district": "West Bengal_District_2", "project_type": "Irrigation", "department": "Indian Railways", "risk_score": 0.896, "case_pending_court": true},
        {"case_id": "LA00323", "district": "West Bengal_District_4", "project_type": "Industrial Corridor", "department": "NHAI", "risk_score": 0.861, "case_pending_court": true},
        {"case_id": "LA00681", "district": "West Bengal_District_2", "project_type": "Railway", "department": "State Power Corp", "risk_score": 0.818, "case_pending_court": true},
        {"case_id": "LA00144", "district": "West Bengal_District_2", "project_type": "Railway", "department": "State Power Corp", "risk_score": 0.817, "case_pending_court": true},
        {"case_id": "LA04891", "district": "West Bengal_District_1", "project_type": "Highway", "department": "Municipal Corporation", "risk_score": 0.81, "case_pending_court": true},
        {"case_id": "LA03246", "district": "West Bengal_District_1", "project_type": "Railway", "department": "Irrigation Dept", "risk_score": 0.807, "case_pending_court": true},
        {"case_id": "LA00051", "district": "West Bengal_District_4", "project_type": "Railway", "department": "Irrigation Dept", "risk_score": 0.802, "case_pending_court": true},
        {"case_id": "LA02824", "district": "West Bengal_District_3", "project_type": "Highway", "department": "State Industrial Dev. Corp", "risk_score": 0.78, "case_pending_court": true},
        {"case_id": "LA03840", "district": "West Bengal_District_2", "project_type": "Irrigation", "department": "Municipal Corporation", "risk_score": 0.755, "case_pending_court": false}
      ]
    }
  }
};
