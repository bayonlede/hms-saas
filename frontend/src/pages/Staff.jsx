// src/pages/Staff.jsx
import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import { Card, StatCard, Grid, SectionTitle, Spinner, DataTable, Alert, C, ProgressBar } from '../components/UI.jsx'

export default function Staff({ year, month }) {
  const { data: hc,    loading: l1 } = useApi(() => api.staffHeadcount(year, month), [year, month])
  const { data: surg,  loading: l2 } = useApi(() => api.surgeonUtil(year, month), [year, month])
  const { data: nurse, loading: l3 } = useApi(() => api.nurseContinuity(year, month), [year, month])
  const { data: kpis,  loading: l4 } = useApi(() => api.kpis(year, month), [year, month])
  const { data: shifts,loading: l5 } = useApi(() => api.shiftCoverage(year, month), [year, month])

  if (l1||l2||l3||l4||l5) return <Spinner />

  const top10dept = (hc||[]).slice(0,10).map(d => ({
    ...d,
    short: d.dept_name?.length > 16 ? d.dept_name.slice(0,16)+'…' : d.dept_name,
  }))

  const compData = [
    { name:'Doctors',       value: kpis?.total_doctors  || 0, fill: C.teal },
    { name:'Nurses',        value: kpis?.total_nurses   || 0, fill: C.sky  },
    { name:'Support Staff', value: kpis?.total_helpers  || 0, fill: C.gold },
  ]

  const ptPerDoc   = kpis ? (kpis.total_patients / kpis.total_doctors).toFixed(1) : '—'
  const ptPerNurse = kpis ? (kpis.total_patients / kpis.total_nurses).toFixed(1)  : '—'

  return (
    <div>
      <SectionTitle sub="Workforce composition · Staffing ratios · Care continuity · Surgeon utilisation">
        Staff & HR Analytics
      </SectionTitle>

      <Grid cols={4} gap={14} style={{ marginBottom:16 }}>
        <StatCard label="Total Staff"       value={fmt.num(kpis?.total_staff)}
          sub={`${kpis?.total_doctors} doctors · ${kpis?.total_nurses} nurses`}
          accent={C.teal} icon="👥" />
        <StatCard label="Patients per Doctor" value={ptPerDoc}
          sub="Target: ≤ 5.0" accent={ptPerDoc <= 5 ? C.teal : C.rose} icon="👨‍⚕️" />
        <StatCard label="Patients per Nurse"  value={ptPerNurse}
          sub="Target: ≤ 6.0" accent={ptPerNurse <= 6 ? C.teal : C.rose} icon="👩‍⚕️" />
        <StatCard label="Nurse Continuity"
          value={`${nurse?.high_continuity_patients}`}
          sub={`avg ${nurse?.avg_unique_nurses_per_patient} nurses/patient`}
          accent={C.sky} icon="🤝" />
      </Grid>

      {shifts?.gap_days > 0 && (
        <Alert type="danger" style={{ marginBottom:16 }}>
          🔴 {shifts.gap_days} shift day(s) with incomplete coverage detected.
          Review scheduling immediately.
        </Alert>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Staff composition donut */}
        <Card accent={C.teal}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Staff Composition
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={compData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {compData.map((d,i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v,n) => [fmt.num(v), n]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', justifyContent:'space-around', marginTop:10 }}>
            {compData.map((d,i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:700, color:d.fill }}>{fmt.num(d.value)}</div>
                <div style={{ fontSize:11, color:C.muted }}>{d.name}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Headcount by department */}
        <Card accent={C.sky}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Headcount by Department (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10dept} layout="vertical" margin={{ left:10, right:30 }}>
              <XAxis type="number" tick={{ fontSize:10, fill:C.muted }} />
              <YAxis type="category" dataKey="short" tick={{ fontSize:10, fill:'#374151' }} width={110} />
              <Tooltip />
              <Bar dataKey="doctors" stackId="a" name="Doctors" fill={C.teal} />
              <Bar dataKey="nurses"  stackId="a" name="Nurses"  fill={C.sky} />
              <Bar dataKey="helpers" stackId="a" name="Helpers" fill={C.gold} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Surgeon utilisation table */}
      <Card accent={C.rose}>
        <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
          Surgeon Utilisation (Top 20 by Volume)
        </h3>
        <DataTable
          columns={[
            { key:'name',             label:'Surgeon' },
            { key:'surgeon_type',     label:'Specialty' },
            { key:'total_surgeries',  label:'Surgeries',
              render: v => <strong style={{ color:C.teal }}>{v}</strong> },
            { key:'avg_duration_min', label:'Avg Duration',
              render: v => v ? `${Math.round(v)} min` : '—' },
          ]}
          rows={surg||[]}
          maxHeight={320}
        />
      </Card>
    </div>
  )
}
