// src/components/Sidebar.jsx
import React from 'react'
import Logo from './Logo.jsx'
import { C } from './UI.jsx'

const NAV = [
  { id:'overview',     label:'Overview',     icon:'📊' },
  { id:'financial',    label:'Financial',    icon:'💰' },
  { id:'operational',  label:'Operational',  icon:'🏥' },
  { id:'clinical',     label:'Clinical',     icon:'🩺' },
  { id:'appointments', label:'Appointments', icon:'📅' },
  { id:'staff',        label:'Staff & HR',   icon:'👥' },
  { id:'surgery',      label:'Surgery',      icon:'🔬' },
  { id:'explorer',     label:'Data Explorer',icon:'🗄️' },
  { id:'predict',      label:'No-Show Predictor', icon:'🔮' },
]

export default function Sidebar({ active, onSelect }) {
  return (
    <aside style={{
      width: '100%',
      height: '100%',
      background: C.white,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Logo size={36} animated />
        <div>
          <div style={{ fontSize:14, fontWeight:700, color: C.navy, lineHeight:1.2 }}>
            HMS Analytics
          </div>
          <div style={{ fontSize:10, color: C.muted, marginTop:2 }}>
            Hospital Intelligence
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div style={{
        padding:'14px 18px 6px',
        fontSize:10, fontWeight:700, color: C.muted,
        textTransform:'uppercase', letterSpacing:'0.1em',
      }}>
        Navigation
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, overflowY:'auto', padding:'0 10px' }}>
        {NAV.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', marginBottom: 2,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isActive ? C.teal + '14' : 'transparent',
                color: isActive ? C.teal : '#374151',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13.5,
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f3f4f6' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
              {item.label}
              {isActive && (
                <div style={{
                  marginLeft:'auto', width:3, height:16,
                  background: C.teal, borderRadius:99,
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding:'14px 18px',
        borderTop:`1px solid ${C.border}`,
        fontSize:11, color: C.muted,
      }}>
        <div>Jan 2022 – Dec 2025</div>
        <div>14 tables · 14,058 records</div>
      </div>
    </aside>
  )
}
