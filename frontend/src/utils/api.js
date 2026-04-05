// src/utils/api.js
const BASE = import.meta.env.VITE_API_URL || ''

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

/** Build a query string from non-null entries: qs({year:2024,month:null}) → '?year=2024' */
function qs(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null)
  return entries.length ? '?' + entries.map(([k, v]) => `${k}=${v}`).join('&') : ''
}

export const api = {
  // Overview
  kpis:               (y, m) => get(`/api/overview/kpis${qs({year:y,month:m})}`),
  // Financial
  revByDept:          (y, m) => get(`/api/financial/revenue-by-department${qs({year:y,month:m})}`),
  payModeSummary:     (y, m) => get(`/api/financial/payment-mode-summary${qs({year:y,month:m})}`),
  payModeTrend:       (y, m) => get(`/api/financial/payment-mode-trend${qs({year:y,month:m})}`),
  revPerDay:          (y, m) => get(`/api/financial/revenue-per-day${qs({year:y,month:m})}`),
  atRisk:             (y, m) => get(`/api/financial/at-risk-revenue${qs({year:y,month:m})}`),
  topPatients:        (n=10, y, m) => get(`/api/financial/top-patients${qs({n,year:y,month:m})}`),
  // Operational
  occupancy:          (s, e, y, m) => get(`/api/operational/occupancy${qs({start:s,end:e,year:y,month:m})}`),
  alos:               (y, m) => get(`/api/operational/alos${qs({year:y,month:m})}`),
  readmission:        (y, m) => get(`/api/operational/readmission${qs({year:y,month:m})}`),
  peakPatterns:       (y, m) => get(`/api/operational/peak-patterns${qs({year:y,month:m})}`),
  shiftCoverage:      (y, m) => get(`/api/operational/shift-coverage${qs({year:y,month:m})}`),
  // Clinical
  diagnoses:          (y, m) => get(`/api/clinical/diagnoses${qs({year:y,month:m})}`),
  diagsBySeason:      (y, m) => get(`/api/clinical/diagnoses-by-season${qs({year:y,month:m})}`),
  patientJourney:     (y, m) => get(`/api/clinical/patient-journey${qs({year:y,month:m})}`),
  referralNetwork:    (y, m) => get(`/api/clinical/referral-network${qs({year:y,month:m})}`),
  chronicCohort:      (y, m) => get(`/api/clinical/chronic-cohort${qs({year:y,month:m})}`),
  docGap:             (y, m) => get(`/api/clinical/documentation-gap${qs({year:y,month:m})}`),
  // Appointments
  apptStatus:         (y, m) => get(`/api/appointments/status-summary${qs({year:y,month:m})}`),
  noshowByMode:       (y, m) => get(`/api/appointments/noshow-by-mode${qs({year:y,month:m})}`),
  // Staff
  staffHeadcount:     (y, m) => get(`/api/staff/headcount${qs({year:y,month:m})}`),
  surgeonUtil:        (y, m) => get(`/api/staff/surgeon-utilisation${qs({year:y,month:m})}`),
  nurseContinuity:    (y, m) => get(`/api/staff/nurse-continuity${qs({year:y,month:m})}`),
  // Surgery
  surgicalOutcomes:   (y, m) => get(`/api/surgery/outcomes${qs({year:y,month:m})}`),
  outcomeSummary:     (y, m) => get(`/api/surgery/outcome-summary${qs({year:y,month:m})}`),
  // Explorer — no period filter (raw table browser)
  tables:             () => get('/api/explorer/tables'),
  tableData:          (t, p=1, ps=50) => get(`/api/explorer/table/${t}?page=${p}&page_size=${ps}`),
  // ML Prediction — no period filter (scores full dataset)
  riskScores:         () => get('/api/predict/risk-scores'),
  predictNoShow:      (body) => fetch(`${BASE}/api/predict/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async r => {
    if (!r.ok) throw new Error(`API error ${r.status}: /api/predict/predict`)
    return r.json()
  }),
}
