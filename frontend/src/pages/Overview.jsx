// src/pages/Overview.jsx
import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import { Card, StatCard, Grid, SectionTitle, Spinner, ErrorBox, Alert, C, ProgressBar } from '../components/UI.jsx'

const RCOLORS = [C.teal, C.sky, C.gold, C.rose, '#8b5cf6']

export default function Overview({ year, month }) {
  const { data: kpis, loading, error } = useApi(() => api.kpis(year, month), [year, month])
  const { data: journey } = useApi(() => api.patientJourney(year, month), [year, month])

  if (loading) return <Spinner />
  if (error)   return <ErrorBox msg={error} />

  const revenueData = [
    { name: 'Room Admissions',  value: kpis.revenue_rooms },
    { name: 'Bed Admissions',   value: kpis.revenue_beds },
    { name: 'Appointments',     value: kpis.revenue_appointments },
  ]

  return (
    <div>
      <SectionTitle sub="Key performance indicators across all 14 data tables">
        Hospital at a Glance
      </SectionTitle>

      {/* KPI row 1 */}
      <Grid cols={4} gap={14} style={{ marginBottom:14 }}>
        <StatCard label="Total Patients"     value={fmt.num(kpis.total_patients)}
          sub="Registered in system" accent={C.teal} icon="👥" />
        <StatCard label="Total Revenue"      value={fmt.currency(kpis.total_revenue, true)}
          sub="Rooms + Beds + Appointments" accent={C.gold} icon="💰" />
        <StatCard label="Total Appointments" value={fmt.num(kpis.total_appointments)}
          sub={`${fmt.pct(kpis.completion_rate)} completion`} accent={C.sky} icon="📅" />
        <StatCard label="Surgeries"          value={fmt.num(kpis.total_surgeries)}
          sub="Across 38 specialties" accent={C.rose} icon="🔬" />
      </Grid>

      {/* KPI row 2 */}
      <Grid cols={4} gap={14} style={{ marginBottom:14 }}>
        <StatCard label="Medical Staff"  value={fmt.num(kpis.total_staff)}
          sub={`${kpis.total_doctors} doctors · ${kpis.total_nurses} nurses`} accent="#8b5cf6" icon="👨‍⚕️" />
        <StatCard label="Departments"    value={kpis.total_departments}
          sub={`${kpis.total_wards} wards · ${kpis.total_beds} beds`} accent={C.teal} icon="🏥" />
        <StatCard label="30-Day Readmissions" value={fmt.pct(kpis.readmission_rate)}
          sub={`${fmt.num(kpis.readmission_count)} patients · WHO target: 15%`}
          accent={kpis.readmission_rate > 15 ? C.rose : C.teal} icon="🔄" />
        <StatCard label="At-Risk Revenue" value={fmt.currency(kpis.at_risk_revenue, true)}
          sub={`${kpis.at_risk_count} overdue appointments`} accent={C.gold} icon="⚠️" />
      </Grid>

      {/* Alerts */}
      {kpis.readmission_rate > 15 && (
        <Alert type="danger" style={{ marginBottom:14 }}>
          ⚠️ 30-day readmission rate ({fmt.pct(kpis.readmission_rate)}) exceeds
          the WHO benchmark of 15%. Investigate discharge protocols.
        </Alert>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        {/* Revenue donut */}
        <Card accent={C.gold}>
          <h3 style={{ fontSize:14, fontWeight:600, color: C.navy, marginBottom:16 }}>
            Revenue Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={revenueData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={3}>
                {revenueData.map((_, i) => (
                  <Cell key={i} fill={RCOLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={v => fmt.currency(v, true)} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:8 }}>
            {revenueData.map((d, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:700, color: RCOLORS[i] }}>
                  {fmt.currency(d.value, true)}
                </div>
                <div style={{ fontSize:11, color: C.muted }}>{d.name}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Patient journey funnel */}
        <Card accent={C.sky}>
          <h3 style={{ fontSize:14, fontWeight:600, color: C.navy, marginBottom:16 }}>
            Patient Care Journey
          </h3>
          {journey ? journey.map((stage, i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, color:'#374151' }}>{stage.stage}</span>
                <span style={{ fontSize:13, fontWeight:600, color: C.navy }}>
                  {fmt.num(stage.count)} <span style={{ color: C.muted, fontWeight:400 }}>
                    ({fmt.pct(stage.pct)})
                  </span>
                </span>
              </div>
              <ProgressBar
                value={stage.pct} max={100}
                color={[C.teal, C.sky, C.gold, C.rose, '#8b5cf6', C.teal][i]}
              />
            </div>
          )) : <Spinner size={24} />}
        </Card>

      </div>
    </div>
  )
}
