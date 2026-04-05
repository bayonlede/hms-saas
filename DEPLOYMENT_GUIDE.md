# HMS Analytics Platform — Complete Deployment Guide
## FastAPI Backend + React Frontend on Railway.com

---

## PROJECT STRUCTURE

```
hms-saas/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   ← FastAPI entry point
│   │   ├── core/
│   │   │   └── config.py             ← Environment config
│   │   ├── services/
│   │   │   ├── data_loader.py        ← Loads all 14 Excel sheets once at startup
│   │   │   └── analytics.py         ← All 22 analysis functions (from notebook)
│   │   └── api/
│   │       └── routes/
│   │           ├── overview.py       ← GET /api/overview/kpis
│   │           ├── financial.py      ← Revenue, payment modes, at-risk, top patients
│   │           ├── operational.py    ← Occupancy, ALOS, readmissions, peak patterns
│   │           ├── clinical.py       ← Diagnoses, seasonal, referrals, chronic
│   │           ├── appointments.py   ← Status summary, no-show by mode
│   │           ├── staff.py          ← Headcount, surgeon utilisation, nurse continuity
│   │           ├── surgery.py        ← Outcomes by type and surgeon
│   │           └── explorer.py       ← Raw table browser (all 14 tables)
│   ├── Hospital_Management_System.xlsx
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── railway.toml
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                  ← React entry point
│   │   ├── App.jsx                   ← Root layout: sidebar + routing
│   │   ├── components/
│   │   │   ├── Logo.jsx              ← Animated SVG hospital logo
│   │   │   ├── Sidebar.jsx           ← Fixed left navigation
│   │   │   └── UI.jsx                ← Shared primitives (Card, StatCard, DataTable…)
│   │   ├── pages/
│   │   │   ├── Overview.jsx          ← KPI cards + revenue donut + journey funnel
│   │   │   ├── Financial.jsx         ← Revenue charts + payment modes + at-risk
│   │   │   ├── Operational.jsx       ← Occupancy + ALOS + peak patterns
│   │   │   ├── Clinical.jsx          ← Diagnoses + seasonal + referrals + chronic
│   │   │   ├── Appointments.jsx      ← Status breakdown + mode performance
│   │   │   ├── Staff.jsx             ← Headcount + surgeon util + continuity
│   │   │   ├── Surgery.jsx           ← Outcomes + surgery types
│   │   │   └── Explorer.jsx          ← Raw data browser: all 14 tables, paginated
│   │   ├── hooks/
│   │   │   └── useApi.js             ← useFetch hook with loading/error states
│   │   └── utils/
│   │       ├── api.js                ← All API call functions
│   │       └── format.js             ← Currency / percent / number formatters
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile                    ← Multi-stage: Node build → Nginx serve
│   ├── nginx.conf                    ← SPA fallback config
│   └── railway.toml
│
├── docker-compose.yml                ← Local development
└── DEPLOYMENT_GUIDE.md               ← This file
```

---

## API ENDPOINTS REFERENCE

| Method | Path                              | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | /health                           | Health check                       |
| GET    | /api/overview/kpis                | All top-level KPIs (24 metrics)    |
| GET    | /api/financial/revenue-by-department | Revenue & patients per dept      |
| GET    | /api/financial/payment-mode-summary  | Insurance/Cash/Card/Wallet totals|
| GET    | /api/financial/payment-mode-trend    | Monthly payment mode trends      |
| GET    | /api/financial/revenue-per-day       | PKR per day: beds vs room types  |
| GET    | /api/financial/at-risk-revenue       | Overdue + no-show revenue        |
| GET    | /api/financial/top-patients?n=10     | Highest-revenue patients         |
| GET    | /api/operational/occupancy           | Ward occupancy rates             |
| GET    | /api/operational/alos                | Average length of stay           |
| GET    | /api/operational/readmission         | 30-day readmission rate          |
| GET    | /api/operational/peak-patterns       | Admission by DOW and month       |
| GET    | /api/operational/shift-coverage      | Staff shift coverage gaps        |
| GET    | /api/clinical/diagnoses              | Top 20 diagnoses                 |
| GET    | /api/clinical/diagnoses-by-season    | Seasonal disease breakdown       |
| GET    | /api/clinical/patient-journey        | Patient funnel: registered→disch |
| GET    | /api/clinical/referral-network       | Dept-to-dept transitions         |
| GET    | /api/clinical/chronic-cohort         | Chronic disease patient cohort   |
| GET    | /api/clinical/documentation-gap      | Appt→record creation lag         |
| GET    | /api/appointments/status-summary     | Completed/NoShow/Cancelled       |
| GET    | /api/appointments/noshow-by-mode     | Problem rate per booking channel |
| GET    | /api/staff/headcount                 | Staff by department              |
| GET    | /api/staff/surgeon-utilisation       | Surgeries + duration per surgeon |
| GET    | /api/staff/nurse-continuity          | Unique nurses per patient        |
| GET    | /api/surgery/outcomes                | Outcomes by surgery type         |
| GET    | /api/surgery/outcome-summary         | Overall outcome distribution     |
| GET    | /api/explorer/tables                 | List of all 14 tables            |
| GET    | /api/explorer/table/{name}?page=1    | Paginated raw table data         |

---

## LOCAL DEVELOPMENT SETUP

### Option A — Docker Compose (recommended)

```bash
# 1. Clone / download the project
cd hms-saas

# 2. Start both services
docker compose up --build

# Backend:  http://localhost:8000
# Frontend: http://localhost:5173
# API docs: http://localhost:8000/docs
```

### Option B — Run directly

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`
so no CORS issues during local development.

---

## RAILWAY DEPLOYMENT — STEP BY STEP

### Prerequisites
- A GitHub account
- A Railway account (railway.app) — free tier is sufficient to start
- Railway CLI installed: `npm install -g @railway/cli`

---

### Step 1 — Push to GitHub

```bash
cd hms-saas
git init
git add .
git commit -m "Initial HMS Analytics Platform"
gh repo create hms-analytics --public --push --source=.
# Or: git remote add origin https://github.com/YOUR_USER/hms-analytics.git
#     git push -u origin main
```

---

### Step 2 — Create Railway Project

```bash
railway login
railway init
# Choose: Empty project
# Name it: hms-analytics
```

---

### Step 3 — Deploy the Backend Service

```bash
cd backend
railway service create --name hms-backend
railway link          # link to the project created above
railway up            # deploys the backend Dockerfile
```

After deployment, Railway gives you a public URL like:
`https://hms-backend-production-xxxx.up.railway.app`

**Set backend environment variables in Railway dashboard:**

| Variable      | Value                                    |
|---------------|------------------------------------------|
| DATA_FILE     | /app/Hospital_Management_System.xlsx     |
| PORT          | 8000  (Railway sets this automatically)  |

Or via CLI:
```bash
railway variables set DATA_FILE=/app/Hospital_Management_System.xlsx
```

**Verify the backend is running:**
```bash
curl https://hms-backend-production-xxxx.up.railway.app/health
# Expected: {"status":"ok","version":"1.0.0"}

curl https://hms-backend-production-xxxx.up.railway.app/api/overview/kpis
# Expected: JSON with 24 KPI fields
```

---

### Step 4 — Deploy the Frontend Service

```bash
cd ../frontend
railway service create --name hms-frontend
railway link
```

**Set frontend environment variables in Railway dashboard:**

| Variable      | Value                                                     |
|---------------|-----------------------------------------------------------|
| VITE_API_URL  | https://hms-backend-production-xxxx.up.railway.app        |

```bash
railway variables set VITE_API_URL=https://hms-backend-production-xxxx.up.railway.app
railway up
```

Railway gives you the frontend URL:
`https://hms-frontend-production-xxxx.up.railway.app`

Open it in your browser — the full dashboard is live.

---

### Step 5 — Verify Everything Works

Open the frontend URL. You should see:

1. ✅ Animated HMS logo in the sidebar
2. ✅ Overview page loads with 8 KPI cards in < 3 seconds
3. ✅ All 8 sidebar tabs navigate without errors
4. ✅ Data Explorer shows all 14 tables with pagination
5. ✅ Charts render with real data from the Excel file

Check the backend Swagger docs at:
`https://hms-backend-production-xxxx.up.railway.app/docs`

---

### Step 6 — Connect GitHub for Auto-Deploy (recommended)

In Railway dashboard:
1. Open hms-backend service → Settings → Source
2. Connect GitHub repo → select `hms-analytics` → branch `main`
3. Repeat for hms-frontend

Every `git push` to `main` now automatically redeploys both services.

---

## UPDATING THE DATA

When you have a new version of the Excel file:

```bash
# 1. Replace the file in backend/
cp /path/to/new/Hospital_Management_System.xlsx backend/

# 2. Commit and push
git add backend/Hospital_Management_System.xlsx
git commit -m "Update HMS data"
git push origin main

# Railway auto-redeploys — new data is live in ~2 minutes
```

---

## PERFORMANCE NOTES

**Data loading:** The Excel file is loaded once at application startup using a
singleton `DataStore`. All 14 sheets are parsed, dates are converted, and derived
columns (LOS, revenue per day, combined admissions) are computed at boot time.
Subsequent API calls read from in-memory DataFrames — typical response time
under 50ms per endpoint.

**Scaling:** For a hospital with < 100,000 records, in-memory DataFrames are
fast enough. When data grows beyond this, replace the Excel loader with a
PostgreSQL database (add asyncpg + SQLAlchemy) and add Redis caching with
a 1-hour TTL. Railway offers both as one-click add-ons.

**Cold starts:** Railway free tier may spin down idle services. The backend
takes ~5 seconds to restart and reload the Excel file. Upgrade to Railway
Hobby ($5/month) for always-on deployment.

---

## ENVIRONMENT VARIABLES SUMMARY

### Backend (.env)
```
DATA_FILE=Hospital_Management_System.xlsx
ALLOWED_ORIGINS=https://your-frontend.up.railway.app
PORT=8000
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.up.railway.app
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Backend 500 on startup | Check DATA_FILE path is correct |
| Frontend shows "API error" | Verify VITE_API_URL points to backend |
| CORS errors in browser | Add frontend URL to ALLOWED_ORIGINS in backend |
| Charts show no data | Open browser console, check network tab for API errors |
| Railway build fails | Check Dockerfile paths match project structure |
| Excel file too large | Railway has a 1GB limit — file is ~750KB, well within limit |

---

## WHAT THE NOTEBOOK ANALYSES MAP TO IN THE APP

| Jupyter Notebook Analysis         | API Endpoint                          | Frontend Page     |
|-----------------------------------|---------------------------------------|-------------------|
| Bed & Room Occupancy Rate         | /api/operational/occupancy            | Operational       |
| Average Length of Stay (ALOS)     | /api/operational/alos                 | Operational       |
| 30-Day Readmission Rate           | /api/operational/readmission          | Operational       |
| Peak Admission Patterns           | /api/operational/peak-patterns        | Operational       |
| Shift Coverage Gaps               | /api/operational/shift-coverage       | Operational       |
| Revenue per Patient by Dept       | /api/financial/revenue-by-department  | Financial         |
| Payment Mode Trend Over Time      | /api/financial/payment-mode-trend     | Financial         |
| Revenue per Bed/Room Day          | /api/financial/revenue-per-day        | Financial         |
| Outstanding/At-Risk Revenue       | /api/financial/at-risk-revenue        | Financial         |
| Top 10 Highest-Revenue Patients   | /api/financial/top-patients           | Financial         |
| Diagnosis Freq by Dept & Season   | /api/clinical/diagnoses-by-season     | Clinical          |
| Doctor Caseload & Patient Volume  | /api/staff/surgeon-utilisation        | Staff             |
| No-Show Rate by Appointment Mode  | /api/appointments/noshow-by-mode      | Appointments      |
| Appt-to-Record Documentation Gap  | /api/clinical/documentation-gap       | Clinical          |
| Chronic Disease Patient Cohort    | /api/clinical/chronic-cohort          | Clinical          |
| Staff-to-Patient Ratio by Dept    | /api/staff/headcount                  | Staff             |
| Surgeon Utilisation Rate          | /api/staff/surgeon-utilisation        | Staff             |
| Nurse & Helper Concentration      | /api/staff/nurse-continuity           | Staff             |
| Dept Headcount vs Revenue         | /api/financial/revenue-by-department  | Financial         |
| Post-Surgical Outcome by Type     | /api/surgery/outcomes                 | Surgery           |
| Patient Journey Funnel            | /api/clinical/patient-journey         | Overview          |
| Department Referral Network       | /api/clinical/referral-network        | Clinical          |
