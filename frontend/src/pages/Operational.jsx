// src/pages/Operational.jsx
import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import { Card, StatCard, Grid, SectionTitle, Spinner, Alert, DataTable, C, ProgressBar } from '../components/UI.jsx'

const DOW_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function Operational() {
  const [occStart, setOccStart] = useState('2024-11-01')
  const [occEnd,   setOccEnd]   = useState('2025-05-31')

  const { data: occ,  loading: l1, reload: reloadOcc } = useApi(
    () => api.occupancy(occStart, occEnd), [occStart, occEnd]
  )
  const { data: alos,    loading: l2 } = useApi(api.alos)
  const { data: readm,   loading: l3 } = useApi(api.readmission)
  const { data: peak,    loading: l4 } = useApi(api.peakPatterns)
  const { data: shifts,  loading: l5 } = useApi(api.shiftCoverage)

  const isLoading = l1||l2||l3||l4||l5
  if (isLoading && !occ) return <Spinner />

  const dowData = peak?.by_dow
    ? DOW_ORDER.map(d => ({ dow: d.slice(0,3), count: peak.by_dow.find(r=>r.dow===d)?.count||0 }))
    : []

  const monthData = (peak?.by_month || []).map(m => ({
    ...m, short: m.month?.slice(0,3),
  }))

  return (
    <div>
      <SectionTitle sub="Admissions · Occupancy · Length of Stay · Staffing Patterns">
        Operational Performance
      </SectionTitle>

      {/* Readmission + ALOS + Shifts KPIs */}
      <Grid cols={4} gap={14} style={{ marginBottom:16 }}>
        <StatCard
          label="30-Day Readmission Rate"
          value={fmt.pct(readm?.rate_pct)}
          sub={`WHO benchmark: ${readm?.who_benchmark_pct}%`}
          accent={readm?.rate_pct > 15 ? C.rose : C.teal}
          icon="🔄"
        />
        <StatCard label="Avg Bed Stay (ALOS)" value={fmt.days(alos?.avg_bed_los)}
          sub="1,000 bed admissions" accent={C.teal} icon="🛏️" />
        <StatCard label="Avg Room Stay (ALOS)" value={fmt.days(alos?.avg_room_los)}
          sub="1,000 room admissions" accent={C.sky} icon="🚪" />
        <StatCard label="Shift Coverage"
          value={`${shifts?.coverage_pct ?? '—'}%`}
          sub={`${shifts?.gap_days ?? 0} gap days detected`}
          accent={shifts?.gap_days > 0 ? C.rose : C.teal} icon="🗓️" />
      </Grid>

      {readm?.rate_pct > 15 && (
        <Alert type="danger" style={{ marginBottom:16 }}>
          🔴 Readmission rate {fmt.pct(readm?.rate_pct)} exceeds the WHO target of 15%.
          Implement structured discharge planning and 48-hour post-discharge follow-up calls.
        </Alert>
      )}

      {/* ALOS by room type */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card accent={C.sky}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Average Length of Stay by Room Type
          </h3>
          {(alos?.by_room_type||[]).map((r,i) => (
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, color:'#374151' }}>{r.room_type}</span>
                <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>
                  {fmt.days(r.avg_los)}
                </span>
              </div>
              <ProgressBar value={r.avg_los} max={7}
                color={[C.teal, C.sky, C.gold][i % 3]} />
              <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>
                Median: {fmt.days(r.median_los)} · {fmt.num(r.admissions)} admissions
              </div>
            </div>
          ))}
        </Card>

        {/* Peak day chart */}
        <Card accent={C.gold}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Admissions by Day of Week
          </h3>
          <div style={{ marginBottom:8 }}>
            <span style={{ fontSize:12, color:C.muted }}>Peak: </span>
            <strong style={{ color:C.gold }}>{peak?.peak_day}</strong>
            <span style={{ fontSize:12, color:C.muted, marginLeft:12 }}>Peak month: </span>
            <strong style={{ color:C.gold }}>{peak?.peak_month}</strong>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dow" tick={{ fontSize:11, fill:C.muted }} />
              <YAxis tick={{ fontSize:10, fill:C.muted }} />
              <Tooltip />
              <Bar dataKey="count" name="Admissions" fill={C.gold} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Monthly admissions */}
      <Card accent={C.teal} style={{ marginBottom:16 }}>
        <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
          Monthly Admission Volume
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="short" tick={{ fontSize:11, fill:C.muted }} />
            <YAxis tick={{ fontSize:10, fill:C.muted }} />
            <Tooltip />
            <Bar dataKey="count" name="Admissions" fill={C.teal} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Occupancy by ward */}
      <Card accent={C.rose}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy }}>
            Bed Occupancy by Ward
          </h3>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <label style={{ fontSize:12, color:C.muted }}>From</label>
            <input type="date" value={occStart} onChange={e=>setOccStart(e.target.value)}
              style={{ border:`1px solid ${C.border}`, borderRadius:6, padding:'4px 8px', fontSize:12 }} />
            <label style={{ fontSize:12, color:C.muted }}>To</label>
            <input type="date" value={occEnd} onChange={e=>setOccEnd(e.target.value)}
              style={{ border:`1px solid ${C.border}`, borderRadius:6, padding:'4px 8px', fontSize:12 }} />
          </div>
        </div>
        <DataTable
          columns={[
            { key:'ward_name', label:'Ward' },
            { key:'capacity',  label:'Beds' },
            { key:'occupied_bed_days', label:'Occupied Days' },
            { key:'occupancy_pct', label:'Occupancy',
              render: v => (
                <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:120 }}>
                  <ProgressBar value={v||0} max={100}
                    color={v>85?C.rose:v>60?C.gold:C.sky} height={6} />
                  <span style={{ fontSize:12, fontWeight:600,
                    color:v>85?C.rose:v>60?C.gold:'#374151', minWidth:36 }}>
                    {fmt.pct(v)}
                  </span>
                </div>
              )},
          ]}
          rows={(occ||[]).sort((a,b)=>(b.occupancy_pct||0)-(a.occupancy_pct||0))}
          maxHeight={320}
        />
        <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>
          🟥 &gt;85% over-stretched · 🟡 60–85% healthy · 🔵 &lt;60% under-utilised
        </p>
      </Card>
    </div>
  )
}
