// src/pages/Financial.jsx
import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import { Card, StatCard, Grid, SectionTitle, Spinner, ErrorBox, DataTable, Alert, C } from '../components/UI.jsx'

const PIE_COLORS = [C.teal, C.gold, C.sky, C.rose, '#8b5cf6']

export default function Financial({ year, month }) {
  const { data: kpis,      loading: l1 } = useApi(() => api.kpis(year, month),           [year, month])
  const { data: deptRev,   loading: l2 } = useApi(() => api.revByDept(year, month),      [year, month])
  const { data: paySum,    loading: l3 } = useApi(() => api.payModeSummary(year, month),  [year, month])
  const { data: atRisk,    loading: l4 } = useApi(() => api.atRisk(year, month),          [year, month])
  const { data: topPats,   loading: l5 } = useApi(() => api.topPatients(10, year, month), [year, month])
  const { data: revPerDay, loading: l6 } = useApi(() => api.revPerDay(year, month),       [year, month])

  if (l1||l2||l3||l4||l5||l6) return <Spinner />

  const top8dept = (deptRev || []).slice(0, 8).map(d => ({
    ...d,
    short: d.dept_name?.length > 14 ? d.dept_name.slice(0,14)+'…' : d.dept_name,
  }))

  const roomPerDay = [
    { type: 'Bed (avg)',        value: revPerDay?.avg_bed_per_day || 0 },
    ...(revPerDay?.room_types || []).map(r => ({
      type: r.room_type, value: r.mean,
    })),
  ]

  return (
    <div>
      <SectionTitle sub="Revenue analysis, payment insights, and at-risk tracking">
        Financial Performance
      </SectionTitle>

      {/* Top KPIs */}
      <Grid cols={4} gap={14} style={{ marginBottom:16 }}>
        <StatCard label="Total Revenue"       value={fmt.currency(kpis?.total_revenue,true)}
          accent={C.gold} icon="💰" sub="All streams combined" />
        <StatCard label="Room Revenue"        value={fmt.currency(kpis?.revenue_rooms,true)}
          accent={C.teal} icon="🛏️" sub={`${fmt.pct(kpis?.revenue_rooms/kpis?.total_revenue*100)} of total`} />
        <StatCard label="Bed Revenue"         value={fmt.currency(kpis?.revenue_beds,true)}
          accent={C.sky}  icon="🏥" sub={`${fmt.pct(kpis?.revenue_beds/kpis?.total_revenue*100)} of total`} />
        <StatCard label="At-Risk Revenue"     value={fmt.currency(atRisk?.total_at_risk,true)}
          accent={C.rose} icon="⚠️" sub={`${atRisk?.total_count} overdue appointments`} />
      </Grid>

      {atRisk?.total_at_risk > 100000 && (
        <Alert type="warning" style={{ marginBottom:16 }}>
          💡 {fmt.currency(atRisk?.noshow_revenue,true)} is from no-shows (likely unrecoverable).
          {' '}{fmt.currency(atRisk?.scheduled_revenue,true)} from overdue scheduled appointments may still be recovered.
        </Alert>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, marginBottom:16 }}>

        {/* Revenue by department */}
        <Card accent={C.teal}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Revenue by Department (Top 8)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top8dept} margin={{ left:0, right:10, top:4, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="short" tick={{ fontSize:10, fill:C.muted }}
                interval={0} angle={-18} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize:10, fill:C.muted }}
                tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={v => fmt.currency(v,true)} />
              <Bar dataKey="total_revenue" name="Revenue" fill={C.teal} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Payment mode pie */}
        <Card accent={C.gold}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Payment Mode Split
          </h3>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={paySum||[]} dataKey="total_revenue" nameKey="mode"
                cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                {(paySum||[]).map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => fmt.currency(v,true)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:4 }}>
            {(paySum||[]).map((p,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ display:'flex', alignItems:'center', gap:6, color:'#374151' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%',
                    background:PIE_COLORS[i], display:'inline-block' }} />
                  {p.mode}
                </span>
                <span style={{ fontWeight:600, color:C.navy }}>{fmt.pct(p.pct)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Revenue per day by room type */}
        <Card accent={C.sky}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Revenue per Patient-Day
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={roomPerDay} layout="vertical" margin={{ left:10, right:30 }}>
              <XAxis type="number" tick={{ fontSize:10, fill:C.muted }}
                tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="type" tick={{ fontSize:11, fill:C.muted }} width={100} />
              <Tooltip formatter={v => fmt.currency(v)} />
              <Bar dataKey="value" name="Avg £/day" fill={C.sky} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>
            Rooms generate ~2× more per day than bed admissions
          </p>
        </Card>

        {/* At-risk breakdown */}
        <Card accent={C.rose}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            At-Risk Revenue Breakdown
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            <div style={{ background:'#fff5f5', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>From No-Shows</div>
              <div style={{ fontSize:18, fontWeight:700, color:C.rose }}>
                {fmt.currency(atRisk?.noshow_revenue,true)}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>Likely unrecoverable</div>
            </div>
            <div style={{ background:'#fffbeb', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Overdue Scheduled</div>
              <div style={{ fontSize:18, fontWeight:700, color:C.gold }}>
                {fmt.currency(atRisk?.scheduled_revenue,true)}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>May be recovered</div>
            </div>
          </div>
          <DataTable
            columns={[
              { key:'risk_category', label:'Age' },
              { key:'appointment_status', label:'Status' },
              { key:'count', label:'Count' },
              { key:'revenue', label:'Revenue',
                render: v => fmt.currency(v,true) },
            ]}
            rows={(atRisk?.breakdown||[]).slice(0,6)}
          />
        </Card>
      </div>

      {/* Top revenue patients */}
      <Card accent={C.teal}>
        <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
          Top 10 Highest-Revenue Patients
        </h3>
        <DataTable
          columns={[
            { key:'name',     label:'Patient' },
            { key:'gender',   label:'Gender' },
            { key:'appt_rev', label:'Appointments', render: v => fmt.currency(v,true) },
            { key:'bed_rev',  label:'Bed',          render: v => fmt.currency(v,true) },
            { key:'room_rev', label:'Room',         render: v => fmt.currency(v,true) },
            { key:'total',    label:'Total',
              render: v => (
                <strong style={{ color:C.teal }}>{fmt.currency(v,true)}</strong>
              )},
          ]}
          rows={topPats||[]}
          maxHeight={280}
        />
      </Card>
    </div>
  )
}
