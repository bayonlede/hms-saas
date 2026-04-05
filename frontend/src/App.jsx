// src/App.jsx
import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
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

const PAGES = {
  overview:     <Overview />,
  financial:    <Financial />,
  operational:  <Operational />,
  clinical:     <Clinical />,
  appointments: <Appointments />,
  staff:        <Staff />,
  surgery:      <Surgery />,
  explorer:     <Explorer />,
  predict:      <Predict />,
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

const SIDEBAR_W = 220

export default function App() {
  const [page,        setPage]        = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <>
      {/* Global styles */}
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
        .sidebar-transition {
          transition: transform 0.25s ease, width 0.25s ease;
        }
        .main-transition {
          transition: margin-left 0.25s ease;
        }
        .hamburger-btn:hover {
          background: #f3f4f6 !important;
        }
      `}</style>

      <div style={{
        display:'flex', minHeight:'100vh',
        backgroundImage: 'url(https://media.istockphoto.com/id/2099370050/vector/health-care-and-abstract-geometric-medical-background-with-icons-concept-and-idea-for.jpg?s=612x612&w=0&k=20&c=1DtMRN0keWpygxoo7IvrHUnipxqsRkSpKpg0wKLj75M=)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: '#f9fafb',
      }}>

        {/* Sidebar — slides off-screen when hidden */}
        <div className="sidebar-transition" style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: SIDEBAR_W,
          transform: sidebarOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
          zIndex: 100,
          willChange: 'transform',
        }}>
          <Sidebar active={page} onSelect={setPage} />
        </div>

        {/* Main content area */}
        <main className="main-transition" style={{
          marginLeft: sidebarOpen ? SIDEBAR_W : 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'rgba(249,250,251,0.82)',
        }}>

          {/* Top header bar */}
          <header style={{
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            padding: '0 24px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            gap: 16,
          }}>

            {/* Left: hamburger + page title */}
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {/* Hamburger toggle */}
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
                {/* Three lines */}
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    display:'block',
                    width: i === 1 ? 16 : 20,   /* middle line slightly shorter */
                    height: 2,
                    borderRadius: 2,
                    background: C.navy,
                    transition: 'width 0.2s ease',
                  }} />
                ))}
              </button>

              <div>
                <h1 style={{ fontSize:16, fontWeight:700, color: C.navy, margin:0 }}>
                  {PAGE_TITLES[page]}
                </h1>
                <p style={{ fontSize:11, color: C.muted, margin:0 }}>
                  Hospital Management System · Jan 2022 – Dec 2025
                </p>
              </div>
            </div>

            {/* Right: live badge + logo */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                padding:'4px 12px', background: C.teal + '14',
                border: `1px solid ${C.teal}30`, borderRadius:99,
                fontSize:11, fontWeight:600, color: C.teal,
              }}>
                ● Live Data
              </div>
              <Logo size={32} animated />
            </div>
          </header>

          {/* Page content */}
          <div style={{
            padding: '28px 32px',
            flex: 1,
            animation: 'fadeInUp 0.25s ease',
          }}>
            {PAGES[page]}
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
