// src/pages/Clinical.jsx
import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import { Card, StatCard, Grid, SectionTitle, Spinner, Alert, DataTable, C, ProgressBar, Badge } from '../components/UI.jsx'

const SEASONS = ['Winter','Spring','Summer','Autumn']
const SCOLS   = [C.sky, C.teal, C.gold, C.rose]

export default function Clinical({ year, month }) {
  const { data: diags,   loading: l1 } = useApi(() => api.diagnoses(year, month), [year, month])
  const { data: seasonal,loading: l2 } = useApi(() => api.diagsBySeason(year, month), [year, month])
  const { data: referral,loading: l3 } = useApi(() => api.referralNetwork(year, month), [year, month])
  const { data: chronic, loading: l4 } = useApi(() => api.chronicCohort(year, month), [year, month])
  const { data: docGap,  loading: l5 } = useApi(() => api.docGap(year, month), [year, month])

  if (l1||l2||l3||l4||l5) return <Spinner />

  const top10Diag = (diags||[]).slice(0,10).map(d => ({
    ...d,
    short: d.diagnosis?.length > 18 ? d.diagnosis.slice(0,18)+'…' : d.diagnosis,
  }))

  return (
    <div>
      <SectionTitle sub="Diagnosis patterns · Seasonal disease burden · Referral pathways">
        Clinical Insights
      </SectionTitle>

      <Grid cols={3} gap={14} style={{ marginBottom:16 }}>
        <StatCard label="Avg Doc Gap"
          value={`${docGap?.mean_gap_days} days`}
          sub={`Median ${docGap?.median_gap_days} days`}
          accent={docGap?.mean_gap_days > 30 ? C.rose : C.teal} icon="📋" />
        <StatCard label="Same-Day Records"
          value={fmt.num(docGap?.same_day_records)}
          sub={`of ${fmt.num(docGap?.total_matched)} matched records`}
          accent={C.gold} icon="⚡" />
        <StatCard label="Chronic Patients"
          value={fmt.num(chronic?.total_chronic_patients)}
          sub={`${chronic?.multi_condition_patients} with 2+ conditions`}
          accent={C.rose} icon="💊" />
      </Grid>

      {docGap?.mean_gap_days > 30 && (
        <Alert type="danger" style={{ marginBottom:16 }}>
          🔴 Average documentation lag is {docGap?.mean_gap_days} days —
          only {docGap?.same_day_records} same-day records logged.
          Mandate documentation within 48 hours of every clinical encounter.
        </Alert>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16, marginBottom:16 }}>

        {/* Top diagnoses */}
        <Card accent={C.teal}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Top 10 Diagnoses (3,000 Medical Records)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={top10Diag} layout="vertical" margin={{ left:10, right:40 }}>
              <XAxis type="number" tick={{ fontSize:10, fill:C.muted }} />
              <YAxis type="category" dataKey="short" tick={{ fontSize:10.5, fill:'#374151' }} width={130} />
              <Tooltip formatter={(v,n,p) => [v, p.payload.diagnosis]} />
              <Bar dataKey="count" name="Cases" radius={[0,4,4,0]}>
                {top10Diag.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? C.teal : i < 3 ? C.sky : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Seasonal table */}
        <Card accent={C.gold}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:4 }}>
            Seasonal Disease Patterns
          </h3>
          <p style={{ fontSize:11, color:C.muted, marginBottom:12 }}>
            Winter drives 80%+ of chronic disease visits
          </p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#f9fafb' }}>
                  <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:600,
                    color:C.navy, borderBottom:`1px solid ${C.border}`, fontSize:11 }}>
                    Diagnosis
                  </th>
                  {SEASONS.map((s,i) => (
                    <th key={s} style={{ padding:'8px 8px', textAlign:'center',
                      fontWeight:600, color:SCOLS[i],
                      borderBottom:`1px solid ${C.border}`, fontSize:11 }}>
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(seasonal||[]).map((row, ri) => (
                  <tr key={ri} style={{ background: ri%2===0?'#fff':'#fafafa' }}>
                    <td style={{ padding:'7px 10px', color:'#374151',
                      borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>
                      {row.diagnosis}
                    </td>
                    {SEASONS.map(s => {
                      const v = row[s] || 0
                      return (
                        <td key={s} style={{ padding:'7px 8px', textAlign:'center',
                          borderBottom:`1px solid ${C.border}`,
                          fontWeight: v > 50 ? 700 : 400,
                          color: v > 50 ? C.rose : v > 10 ? C.gold : '#374151' }}>
                          {v}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Referral network */}
        <Card accent={C.sky}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Top Department Referral Pathways
          </h3>
          <DataTable
            columns={[
              { key:'dept_name',  label:'From' },
              { key:'next_dept',  label:'→ To' },
              { key:'transitions',label:'Count',
                render: v => <strong style={{ color:C.sky }}>{v}</strong> },
            ]}
            rows={referral||[]}
            maxHeight={260}
          />
          <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>
            💡 General Medicine is the central referral hub of this hospital.
          </p>
        </Card>

        {/* Chronic cohort */}
        <Card accent={C.rose}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:4 }}>
            Chronic Disease Cohort
          </h3>
          <p style={{ fontSize:11, color:C.muted, marginBottom:12 }}>
            Patients with 2+ visits for the same chronic condition
          </p>
          <div style={{ display:'flex', gap:12, marginBottom:14 }}>
            <div style={{ flex:1, background:'#fff5f5', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:C.muted }}>Total Chronic</div>
              <div style={{ fontSize:20, fontWeight:700, color:C.rose }}>
                {fmt.num(chronic?.total_chronic_patients)}
              </div>
            </div>
            <div style={{ flex:1, background:'#fffbeb', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:C.muted }}>Multi-Condition</div>
              <div style={{ fontSize:20, fontWeight:700, color:C.gold }}>
                {fmt.num(chronic?.multi_condition_patients)}
              </div>
            </div>
          </div>
          {(chronic?.by_diagnosis||[]).map((d,i) => (
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:12, color:'#374151' }}>{d.diagnosis}</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.navy }}>
                  {d.patients} pts · {d.total_visits} visits
                </span>
              </div>
              <ProgressBar value={d.patients} max={chronic?.total_chronic_patients||1}
                color={[C.rose,C.gold,C.sky,C.teal,'#8b5cf6'][i%5]} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
