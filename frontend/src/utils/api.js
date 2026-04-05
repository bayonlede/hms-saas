// src/utils/api.js
const BASE = import.meta.env.VITE_API_URL || ''

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  // Overview
  kpis:               () => get('/api/overview/kpis'),
  // Financial
  revByDept:          () => get('/api/financial/revenue-by-department'),
  payModeSummary:     () => get('/api/financial/payment-mode-summary'),
  payModeTrend:       () => get('/api/financial/payment-mode-trend'),
  revPerDay:          () => get('/api/financial/revenue-per-day'),
  atRisk:             () => get('/api/financial/at-risk-revenue'),
  topPatients:        (n=10) => get(`/api/financial/top-patients?n=${n}`),
  // Operational
  occupancy:          (s,e) => get(`/api/operational/occupancy?start=${s}&end=${e}`),
  alos:               () => get('/api/operational/alos'),
  readmission:        () => get('/api/operational/readmission'),
  peakPatterns:       () => get('/api/operational/peak-patterns'),
  shiftCoverage:      () => get('/api/operational/shift-coverage'),
  // Clinical
  diagnoses:          () => get('/api/clinical/diagnoses'),
  diagsBySeason:      () => get('/api/clinical/diagnoses-by-season'),
  patientJourney:     () => get('/api/clinical/patient-journey'),
  referralNetwork:    () => get('/api/clinical/referral-network'),
  chronicCohort:      () => get('/api/clinical/chronic-cohort'),
  docGap:             () => get('/api/clinical/documentation-gap'),
  // Appointments
  apptStatus:         () => get('/api/appointments/status-summary'),
  noshowByMode:       () => get('/api/appointments/noshow-by-mode'),
  // Staff
  staffHeadcount:     () => get('/api/staff/headcount'),
  surgeonUtil:        () => get('/api/staff/surgeon-utilisation'),
  nurseContinuity:    () => get('/api/staff/nurse-continuity'),
  // Surgery
  surgicalOutcomes:   () => get('/api/surgery/outcomes'),
  outcomeSummary:     () => get('/api/surgery/outcome-summary'),
  // Explorer
  tables:             () => get('/api/explorer/tables'),
  tableData:          (t, p=1, ps=50) => get(`/api/explorer/table/${t}?page=${p}&page_size=${ps}`),
}
