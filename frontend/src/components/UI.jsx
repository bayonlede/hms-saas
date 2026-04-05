// src/components/UI.jsx
import React from 'react'

/* ── Colour tokens ──────────────────────────────────────────────────────────── */
export const C = {
  teal:   '#1a9c8a',
  teal2:  '#13b5a0',
  gold:   '#e8b84b',
  rose:   '#e05c6d',
  sky:    '#4ab3e8',
  navy:   '#0d1b2a',
  muted:  '#6b7280',
  border: '#e5e7eb',
  bg:     '#f9fafb',
  white:  '#ffffff',
}

/* ── Spinner ────────────────────────────────────────────────────────────────── */
export function Spinner({ size = 32 }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:24 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        style={{ animation:'spin 0.9s linear infinite' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <circle cx="12" cy="12" r="10" stroke={C.border} strokeWidth="3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke={C.teal} strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

/* ── Error box ──────────────────────────────────────────────────────────────── */
export function ErrorBox({ msg }) {
  return (
    <div style={{
      background:'#fff5f5', border:`1px solid ${C.rose}`, borderRadius:8,
      padding:'12px 16px', color: C.rose, fontSize:13
    }}>
      ⚠️ {msg}
    </div>
  )
}

/* ── Card ───────────────────────────────────────────────────────────────────── */
export function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      {accent && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:3,
          background: accent, borderRadius:'12px 12px 0 0',
        }} />
      )}
      {children}
    </div>
  )
}

/* ── Stat Card ──────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, accent = C.teal, icon }) {
  return (
    <Card accent={accent} style={{ minWidth: 0 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color: C.muted,
                        textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
            {label}
          </div>
          <div style={{ fontSize:26, fontWeight:700, color: C.navy, lineHeight:1 }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize:12, color: C.muted, marginTop:5 }}>{sub}</div>
          )}
        </div>
        {icon && (
          <div style={{
            width:40, height:40, borderRadius:10,
            background: accent + '18',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, flexShrink:0,
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

/* ── Section heading ────────────────────────────────────────────────────────── */
export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <h2 style={{ fontSize:18, fontWeight:700, color: C.navy, margin:0 }}>{children}</h2>
      {sub && <p style={{ fontSize:13, color: C.muted, marginTop:3 }}>{sub}</p>}
    </div>
  )
}

/* ── Grid ───────────────────────────────────────────────────────────────────── */
export function Grid({ cols = 4, gap = 16, children, style = {} }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
      gap,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────────────────────────── */
export function Badge({ children, color = C.teal }) {
  return (
    <span style={{
      background: color + '18', color, border:`1px solid ${color}40`,
      borderRadius:99, padding:'2px 10px', fontSize:11, fontWeight:600,
    }}>
      {children}
    </span>
  )
}

/* ── Progress bar ───────────────────────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, color = C.teal, height = 6 }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ background:'#f0f0f0', borderRadius:99, height, overflow:'hidden' }}>
      <div style={{
        width:`${pct}%`, height:'100%', background:color,
        borderRadius:99, transition:'width 0.6s ease',
      }} />
    </div>
  )
}

/* ── Data Table ─────────────────────────────────────────────────────────────── */
export function DataTable({ columns, rows, maxHeight }) {
  return (
    <div style={{
      overflowX:'auto', overflowY: maxHeight ? 'auto' : 'visible',
      maxHeight, borderRadius:8, border:`1px solid ${C.border}`,
    }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:'#f3f4f6', position:'sticky', top:0 }}>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding:'10px 14px', textAlign:'left', fontWeight:600,
                color: C.navy, whiteSpace:'nowrap', fontSize:12,
                textTransform:'uppercase', letterSpacing:'0.05em',
                borderBottom:`1px solid ${C.border}`,
              }}>
                {col.label ?? col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? C.white : '#fafafa' }}>
              {columns.map((col, ci) => {
                const key = col.key ?? col
                const val = row[key]
                return (
                  <td key={ci} style={{
                    padding:'9px 14px', color:'#374151',
                    borderBottom:`1px solid ${C.border}`,
                    whiteSpace:'nowrap',
                  }}>
                    {col.render ? col.render(val, row) : (val ?? '—')}
                  </td>
                )
              })}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{
                padding:24, textAlign:'center', color: C.muted, fontSize:13,
              }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ── Alert banner ───────────────────────────────────────────────────────────── */
export function Alert({ type = 'info', children }) {
  const colors = {
    info:    { bg:'#eff6ff', border:'#3b82f6', text:'#1d4ed8' },
    warning: { bg:'#fffbeb', border: C.gold,   text:'#92400e' },
    danger:  { bg:'#fff5f5', border: C.rose,   text:'#991b1b' },
    success: { bg:'#f0fdf4', border: C.teal,   text:'#065f46' },
  }
  const s = colors[type] || colors.info
  return (
    <div style={{
      background: s.bg, border:`1px solid ${s.border}`, borderRadius:8,
      padding:'10px 14px', color: s.text, fontSize:13, fontWeight:500,
    }}>
      {children}
    </div>
  )
}
