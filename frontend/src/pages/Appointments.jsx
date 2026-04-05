// src/pages/Appointments.jsx
import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import { Card, StatCard, Grid, SectionTitle, Spinner, Alert, DataTable, C, Badge } from '../components/UI.jsx'

const STATUS_COLORS = { Completed: C.teal, 'No-Show': C.rose, Scheduled: C.sky, Cancelled: C.gold }

export default function Appointments({ year, month }) {
  const { data: status, loading: l1 } = useApi(() => api.apptStatus(year, month), [year, month])
  const { data: modes,  loading: l2 } = useApi(() => api.noshowByMode(year, month), [year, month])
  const { data: kpis,   loading: l3 } = useApi(() => api.kpis(year, month), [year, month])

  if (l1||l2||l3) return <Spinner />

  const completed = status?.find(s=>s.status==='Completed')
  const noshow    = status?.find(s=>s.status==='No-Show')
  const cancelled = status?.find(s=>s.status==='Cancelled')

  const modeChart = (modes||[]).map(m=>({
    mode: m.mode_of_appointment,
    'Problem Rate': m.problem_rate,
    'Completion Rate': m.completed_rate,
    total: m.total,
  }))

  return (
    <div>
      <SectionTitle sub="No-show rates · Booking mode performance · Documentation efficiency">
        Appointment Analytics
      </SectionTitle>

      <Grid cols={4} gap={14} style={{ marginBottom:16 }}>
        <StatCard label="Completion Rate"  value={fmt.pct(kpis?.completion_rate)}
          sub={`${fmt.num(kpis?.completed_appointments)} completed`}
          accent={C.teal} icon="✅" />
        <StatCard label="No-Show Rate"     value={fmt.pct(kpis?.noshow_rate)}
          sub={`${fmt.num(kpis?.noshow_appointments)} appointments`}
          accent={C.rose} icon="❌" />
        <StatCard label="At-Risk Revenue"  value={fmt.currency(kpis?.at_risk_revenue,true)}
          sub={`${kpis?.at_risk_count} overdue`}
          accent={C.gold} icon="⚠️" />
        <StatCard label="Total Appointments" value={fmt.num(kpis?.total_appointments)}
          sub="All statuses" accent={C.sky} icon="📅" />
      </Grid>

      {kpis?.noshow_rate > 10 && (
        <Alert type="warning" style={{ marginBottom:16 }}>
          💡 Online bookings have the highest problem rate. Implement 24-hour
          confirmation SMS and reply-YES confirmation for all online appointments.
        </Alert>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:16, marginBottom:16 }}>

        {/* Status donut */}
        <Card accent={C.teal}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Appointment Status Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={status||[]} dataKey="count" nameKey="status"
                cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {(status||[]).map((s,i) => (
                  <Cell key={i} fill={STATUS_COLORS[s.status] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v,n) => [fmt.num(v), n]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
            {(status||[]).map((s,i) => (
              <div key={i} style={{
                background:'#f9fafb', borderRadius:8, padding:'8px 12px',
                borderLeft:`3px solid ${STATUS_COLORS[s.status]||'#94a3b8'}`,
              }}>
                <div style={{ fontSize:11, color:C.muted }}>{s.status}</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.navy }}>{fmt.num(s.count)}</div>
                <div style={{ fontSize:11, color:C.muted }}>{fmt.pct(s.pct)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* No-show by mode */}
        <Card accent={C.rose}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:4 }}>
            Problem Rate by Booking Mode
          </h3>
          <p style={{ fontSize:11, color:C.muted, marginBottom:14 }}>
            No-Show + Cancellation rate per booking channel
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={modeChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mode" tick={{ fontSize:11, fill:C.muted }} />
              <YAxis tick={{ fontSize:10, fill:C.muted }} unit="%" domain={[0,25]} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="Problem Rate" fill={C.rose} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop:14 }}>
            <DataTable
              columns={[
                { key:'mode_of_appointment', label:'Mode' },
                { key:'total', label:'Total' },
                { key:'completed_rate', label:'✅ Complete',
                  render: v => <span style={{ color:C.teal, fontWeight:600 }}>{fmt.pct(v)}</span> },
                { key:'no_show_rate', label:'❌ No-Show',
                  render: v => <span style={{ color:C.rose, fontWeight:600 }}>{fmt.pct(v)}</span> },
                { key:'problem_rate', label:'⚠️ Problem',
                  render: v => <span style={{ color:C.gold, fontWeight:700 }}>{fmt.pct(v)}</span> },
              ]}
              rows={modes||[]}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
