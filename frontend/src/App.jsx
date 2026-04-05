// src/App.jsx
import React, { useState } from 'react'
import Sidebar      from './components/Sidebar.jsx'
import Overview     from './pages/Overview.jsx'
import Financial    from './pages/Financial.jsx'
import Operational  from './pages/Operational.jsx'
import Clinical     from './pages/Clinical.jsx'
import Appointments from './pages/Appointments.jsx'
import Staff        from './pages/Staff.jsx'
import Surgery      from './pages/Surgery.jsx'
import Explorer     from './pages/Explorer.jsx'
import Predict      from './pages/Predict.jsx'
import { C } from './components/UI.jsx'
import Logo from './components/Logo.jsx'

const PAGE_COMPONENTS = {
  overview:     Overview,
  financial:    Financial,
  operational:  Operational,
  clinical:     Clinical,
  appointments: Appointments,
  staff:        Staff,
  surgery:      Surgery,
  explorer:     Explorer,
  predict:      Predict,
}

const PAGE_TITLES = {
  overview:     'Overview',
  financial:    'Financial Performance',
  operational:  'Operational Performance',
  clinical:     'Clinical Insights',
  appointments: 'Appointment Analytics',
  staff:        'Staff & HR',
  surgery:      'Surgical Performance',
  explorer:     'Data Explorer',
  predict:      'No-Show Predictor',
}

const YEARS = [
  { label: 'All Years', value: null },
  { label: '2022',      value: 2022 },
  { label: '2023',      value: 2023 },
  { label: '2024',      value: 2024 },
  { label: '2025',      value: 2025 },
]

const MONTHS = [
  { label: 'All Months', value: null },
  { label: 'January',   value: 1  },
  { label: 'February',  value: 2  },
  { label: 'March',     value: 3  },
  { label: 'April',     value: 4  },
  { label: 'May',       value: 5  },
  { label: 'June',      value: 6  },
  { label: 'July',      value: 7  },
  { label: 'August',    value: 8  },
  { label: 'September', value: 9  },
  { label: 'October',   value: 10 },
  { label: 'November',  value: 11 },
  { label: 'December',  value: 12 },
]

const SIDEBAR_W = 220

// Pages that show time-filtered analytics (Explorer + Predict skip it)
const FILTERABLE = new Set(['overview','financial','operational','clinical','appointments','staff','surgery'])

export default function App() {
  const [page,        setPage]        = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [year,        setYear]        = useState(null)
  const [month,       setMonth]       = useState(null)

  const filtered    = year != null || month != null
  const showFilters = FILTERABLE.has(page)

  const PageComponent = PAGE_COMPONENTS[page]

  const selectStyle = {
    border: `1px solid ${filtered ? C.teal : C.border}`,
    borderRadius: 7,
    padding: '5px 8px',
    fontSize: 12,
    color: filtered ? C.teal : '#374151',
    fontWeight: filtered ? 600 : 400,
    background: filtered ? C.teal + '0d' : C.white,
    cursor: 'pointer',
    outline: 'none',
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont,
               'Segoe UI', sans-serif; background: #ffffff; color: #111827; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .sidebar-transition { transition: transform 0.25s ease; }
        .main-transition    { transition: margin-left 0.25s ease; }
        .hamburger-btn:hover { background: #f3f4f6 !important; }
        .filter-select:focus { outline: none; box-shadow: 0 0 0 2px ${C.teal}33; }
        .reset-btn:hover { background: ${C.rose}18 !important; color: ${C.rose} !important; }
      `}</style>

      <div style={{
        display:'flex', minHeight:'100vh',
        backgroundImage: 'url(https://media.istockphoto.com/id/2099370050/vector/health-care-and-abstract-geometric-medical-background-with-icons-concept-and-idea-for.jpg?s=612x612&w=0&k=20&c=1DtMRN0keWpygxoo7IvrHUnipxqsRkSpKpg0wKLj75M=)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: '#f9fafb',
      }}>

        {/* Sidebar */}
        <div className="sidebar-transition" style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: SIDEBAR_W,
          transform: sidebarOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
          zIndex: 100,
          willChange: 'transform',
        }}>
          <Sidebar active={page} onSelect={setPage} />
        </div>

        {/* Main */}
        <main className="main-transition" style={{
          marginLeft: sidebarOpen ? SIDEBAR_W : 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'rgba(249,250,251,0.82)',
        }}>

          {/* Header */}
          <header style={{
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            padding: '0 20px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            gap: 12,
          }}>

            {/* Left: hamburger + title */}
            <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
              <button
                className="hamburger-btn"
                onClick={() => setSidebarOpen(o => !o)}
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                style={{
                  display:'flex', flexDirection:'column', justifyContent:'center',
                  alignItems:'center', gap:5,
                  width:36, height:36, flexShrink:0,
                  border:'none', borderRadius:8, cursor:'pointer',
                  background:'transparent', padding:0,
                }}
              >
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    display:'block',
                    width: i === 1 ? 16 : 20,
                    height: 2, borderRadius: 2,
                    background: C.navy,
                    transition: 'width 0.2s ease',
                  }} />
                ))}
              </button>

              <div style={{ minWidth:0 }}>
                <h1 style={{ fontSize:15, fontWeight:700, color: C.navy, margin:0, whiteSpace:'nowrap' }}>
                  {PAGE_TITLES[page]}
                </h1>
                <p style={{ fontSize:10, color: C.muted, margin:0 }}>
                  Hospital Management System · Jan 2022 – Dec 2025
                </p>
              </div>
            </div>

            {/* Centre: period filters (only on filterable pages) */}
            {showFilters && (
              <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:600, color: C.muted,
                  textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                  Period:
                </span>

                <select
                  className="filter-select"
                  value={year ?? ''}
                  onChange={e => setYear(e.target.value === '' ? null : Number(e.target.value))}
                  style={selectStyle}
                >
                  {YEARS.map(y => (
                    <option key={y.label} value={y.value ?? ''}>{y.label}</option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={month ?? ''}
                  onChange={e => setMonth(e.target.value === '' ? null : Number(e.target.value))}
                  style={selectStyle}
                >
                  {MONTHS.map(m => (
                    <option key={m.label} value={m.value ?? ''}>{m.label}</option>
                  ))}
                </select>

                {filtered && (
                  <button
                    className="reset-btn"
                    onClick={() => { setYear(null); setMonth(null) }}
                    title="Clear period filter"
                    style={{
                      border: `1px solid ${C.border}`, borderRadius:7,
                      padding:'5px 9px', fontSize:11, fontWeight:600,
                      color: C.muted, background: 'transparent',
                      cursor:'pointer', whiteSpace:'nowrap',
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            )}

            {/* Right: live badge + logo */}
            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <div style={{
                padding:'4px 10px',
                background: filtered ? C.gold + '18' : C.teal + '14',
                border: `1px solid ${filtered ? C.gold + '50' : C.teal + '30'}`,
                borderRadius:99,
                fontSize:11, fontWeight:600,
                color: filtered ? C.gold : C.teal,
                whiteSpace:'nowrap',
              }}>
                {filtered
                  ? `● ${YEARS.find(y=>y.value===year)?.label ?? 'All'} · ${MONTHS.find(m=>m.value===month)?.label ?? 'All'}`
                  : '● Live Data'
                }
              </div>
              <Logo size={32} animated />
            </div>
          </header>

          {/* Page */}
          <div style={{ padding:'28px 32px', flex:1, animation:'fadeInUp 0.25s ease' }}>
            <PageComponent year={year} month={month} />
          </div>

          {/* Footer */}
          <footer style={{
            borderTop: `1px solid ${C.border}`,
            padding: '12px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: C.white,
            fontSize: 11,
            color: C.muted,
          }}>
            <span>HMS Analytics Platform · Hospital Intelligence System</span>
            <span>Powered by FastAPI + React · Railway.com deployment</span>
          </footer>
        </main>
      </div>
    </>
  )
}
