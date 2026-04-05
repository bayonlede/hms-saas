// src/pages/Surgery.jsx
import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import { Card, StatCard, Grid, SectionTitle, Spinner, DataTable, Alert, C, ProgressBar } from '../components/UI.jsx'

const OUTCOME_COLORS = {
  'Recovered':          C.teal,
  'Stable':             '#10b981',
  'Transfer to icu':    C.rose,
  'Need special care':  C.gold,
  'Visit Next Month':   C.sky,
}

export default function Surgery() {
  const { data: summary, loading: l1 } = useApi(api.outcomeSummary)
  const { data: byType,  loading: l2 } = useApi(api.surgicalOutcomes)
  const { data: kpis,    loading: l3 } = useApi(api.kpis)
  const { data: surgeons,loading: l4 } = useApi(api.surgeonUtil)

  if (l1||l2||l3||l4) return <Spinner />

  const positive = (summary||[]).filter(s =>
    ['Recovered','Stable'].includes(s.notes))
  const negative = (summary||[]).filter(s =>
    ['Transfer to icu','Need special care'].includes(s.notes))

  const posCount = positive.reduce((a,b)=>a+(b.count||0),0)
  const negCount = negative.reduce((a,b)=>a+(b.count||0),0)
  const total    = kpis?.total_surgeries || 1

  const top8types = (byType||[]).slice(0,8).map(r=>({
    ...r,
    short: r.surgery_type?.length>16 ? r.surgery_type.slice(0,16)+'…' : r.surgery_type,
  }))

  return (
    <div>
      <SectionTitle sub="Surgical outcomes · Surgery types · ICU transfer rates">
        Surgical Performance
      </SectionTitle>

      <Grid cols={4} gap={14} style={{ marginBottom:16 }}>
        <StatCard label="Total Surgeries"   value={fmt.num(kpis?.total_surgeries)}
          sub="Across 38 surgery types" accent={C.teal} icon="🔬" />
        <StatCard label="Positive Outcomes" value={fmt.pct(posCount/total*100)}
          sub={`${fmt.num(posCount)} recovered or stable`}
          accent={C.teal} icon="✅" />
        <StatCard label="ICU Transfers"
          value={fmt.pct((summary?.find(s=>s.notes==='Transfer to icu')?.count||0)/total*100)}
          sub="Post-surgical ICU transfers"
          accent={C.rose} icon="🚨" />
        <StatCard label="Need Special Care"
          value={fmt.pct((summary?.find(s=>s.notes==='Need special care')?.count||0)/total*100)}
          sub="Post-op special care required"
          accent={C.gold} icon="⚕️" />
      </Grid>

      {(summary?.find(s=>s.notes==='Transfer to icu')?.count||0)/total > 0.2 && (
        <Alert type="danger" style={{ marginBottom:16 }}>
          🔴 ICU transfer rate exceeds 20%. Review pre-operative risk assessment
          protocols and expand ICU capacity planning for peak surgical months.
        </Alert>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:16, marginBottom:16 }}>

        {/* Outcome pie */}
        <Card accent={C.teal}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Post-Surgical Outcome Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={summary||[]} dataKey="count" nameKey="notes"
                cx="50%" cy="50%" outerRadius={85} paddingAngle={2}>
                {(summary||[]).map((s,i)=>(
                  <Cell key={i} fill={OUTCOME_COLORS[s.notes]||'#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v,n)=>[fmt.num(v), n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
            {(summary||[]).map((s,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', fontSize:12 }}>
                <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                    background:OUTCOME_COLORS[s.notes]||'#94a3b8' }} />
                  <span style={{ color:'#374151' }}>{s.notes}</span>
                </span>
                <span style={{ fontWeight:700, color:C.navy }}>
                  {fmt.num(s.count)}
                  <span style={{ fontWeight:400, color:C.muted, marginLeft:4 }}>
                    ({fmt.pct(s.pct)})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top surgery types bar */}
        <Card accent={C.sky}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
            Top 8 Surgery Types by Volume
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top8types} layout="vertical" margin={{ left:10, right:40 }}>
              <XAxis type="number" tick={{ fontSize:10, fill:C.muted }} />
              <YAxis type="category" dataKey="short"
                tick={{ fontSize:10.5, fill:'#374151' }} width={120} />
              <Tooltip />
              <Bar dataKey="total" name="Surgeries" fill={C.sky} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Positive / negative summary strips */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card accent={C.teal}>
          <h3 style={{ fontSize:13, fontWeight:600, color:C.navy, marginBottom:12 }}>
            ✅ Positive Outcomes
          </h3>
          {positive.map((s,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:13 }}>{s.notes}</span>
                <strong>{fmt.num(s.count)} ({fmt.pct(s.pct)})</strong>
              </div>
              <ProgressBar value={s.pct} max={100} color={C.teal} />
            </div>
          ))}
        </Card>
        <Card accent={C.rose}>
          <h3 style={{ fontSize:13, fontWeight:600, color:C.navy, marginBottom:12 }}>
            🔴 Critical Outcomes
          </h3>
          {negative.map((s,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:13 }}>{s.notes}</span>
                <strong>{fmt.num(s.count)} ({fmt.pct(s.pct)})</strong>
              </div>
              <ProgressBar value={s.pct} max={100} color={i===0?C.rose:C.gold} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
