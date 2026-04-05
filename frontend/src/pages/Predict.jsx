// src/pages/Predict.jsx
import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import {
  Card, StatCard, Grid, SectionTitle, Spinner, ErrorBox,
  Alert, DataTable, C, Badge,
} from '../components/UI.jsx'

// ── Constants ─────────────────────────────────────────────────────────────────
const APPT_MODES    = ['Call', 'In Person', 'Online']
const PAYMENT_MODES = ['Card', 'Cash', 'Digital Wallet', 'Insurance']
const VISIT_REASONS = [
  'Asthma', 'Back Pain', 'Chest Pain', 'Diabetes',
  'Fever', 'General Checkup', 'Headache', 'Hypertension', 'Migraine',
]
const GENDERS = ['F', 'M']
const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TIER_COLOR  = { HIGH: C.rose, MEDIUM: C.gold, LOW: C.teal }
const TIER_BG     = { HIGH: '#fff5f5', MEDIUM: '#fffbeb', LOW: '#f0fdf4' }
const TIER_ICON   = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }
const PIE_COLORS  = [C.rose, C.gold, C.teal]

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, fontWeight:600, color:C.muted,
        textTransform:'uppercase', letterSpacing:'0.07em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        border:`1px solid ${C.border}`, borderRadius:8,
        padding:'8px 10px', fontSize:13, color:'#374151',
        background:C.white, cursor:'pointer',
      }}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

function NumInput({ value, onChange, min=0, max, step=1 }) {
  return (
    <input
      type="number" value={value} min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        border:`1px solid ${C.border}`, borderRadius:8,
        padding:'8px 10px', fontSize:13, color:'#374151',
        background:C.white, width:'100%',
      }}
    />
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Predict() {
  const { data: bulk, loading: bLoading, error: bError } = useApi(api.riskScores)

  // Prediction form state
  const [form, setForm] = useState({
    appt_mode:         'Call',
    payment_mode:      'Card',
    visit_reason:      'General Checkup',
    gender:            'F',
    age:               35,
    dow:               0,
    month:             1,
    is_weekend:        0,
    appt_sequence:     1,
    prior_noshow:      0,
    prior_noshow_rate: 0.0,
  })
  const [result,   setResult]   = useState(null)
  const [predLoad, setPredLoad] = useState(false)
  const [predErr,  setPredErr]  = useState(null)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Auto-compute is_weekend from dow
  const handleDow = val => {
    const dow = Number(val)
    set('dow', dow)
    set('is_weekend', dow >= 5 ? 1 : 0)
  }

  async function handlePredict() {
    setPredLoad(true)
    setPredErr(null)
    setResult(null)
    try {
      const res = await api.predictNoShow(form)
      setResult(res)
    } catch(e) {
      setPredErr(e.message)
    } finally {
      setPredLoad(false)
    }
  }

  // Pie data for bulk distribution
  const pieData = bulk ? [
    { name:'High Risk',   value: bulk.high_risk_count   },
    { name:'Medium Risk', value: bulk.medium_risk_count },
    { name:'Low Risk',    value: bulk.low_risk_count    },
  ] : []

  return (
    <div>
      <SectionTitle sub="Logistic Regression model · Trained on historical appointment outcomes">
        No-Show Risk Prediction
      </SectionTitle>

      {/* ── Bulk summary KPIs ── */}
      {bLoading && <Spinner />}
      {bError   && <ErrorBox msg={bError} />}
      {bulk && (
        <>
          <Grid cols={4} gap={14} style={{ marginBottom:16 }}>
            <StatCard label="Appointments Scored" value={fmt.num(bulk.total_scored)}
              sub="Known-outcome appointments" accent={C.teal} icon="📊" />
            <StatCard label="High Risk"
              value={fmt.num(bulk.high_risk_count)}
              sub={`${fmt.pct(bulk.high_risk_pct)} of scored`}
              accent={C.rose} icon="🔴" />
            <StatCard label="Medium Risk"
              value={fmt.num(bulk.medium_risk_count)}
              sub="Need SMS confirmation" accent={C.gold} icon="🟡" />
            <StatCard label="Avg No-Show Risk"
              value={fmt.pct(bulk.avg_risk_pct)}
              sub="Across all scored appointments" accent={C.sky} icon="📈" />
          </Grid>

          {bulk.high_risk_pct > 20 && (
            <Alert type="danger" style={{ marginBottom:16 }}>
              🔴 {fmt.pct(bulk.high_risk_pct)} of appointments are HIGH risk —
              initiate phone call campaigns for {fmt.num(bulk.high_risk_count)} patients immediately.
            </Alert>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:16, marginBottom:16 }}>

            {/* Risk pie */}
            <Card accent={C.rose}>
              <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
                Risk Tier Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [fmt.num(v), n]} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', justifyContent:'space-around', marginTop:10 }}>
                {['HIGH','MEDIUM','LOW'].map((tier, i) => (
                  <div key={tier} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:700, color:PIE_COLORS[i] }}>
                      {fmt.num(bulk.risk_distribution[tier])}
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>{tier}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Risk histogram */}
            <Card accent={C.gold}>
              <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
                No-Show Probability Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bulk.risk_histogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bucket" tick={{ fontSize:10, fill:C.muted }} angle={-25}
                    textAnchor="end" height={45} interval={0} />
                  <YAxis tick={{ fontSize:10, fill:C.muted }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Appointments" fill={C.gold} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* High-risk table */}
          <Card accent={C.rose} style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:14 }}>
              Top 20 Highest-Risk Appointments
            </h3>
            <DataTable
              columns={[
                { key:'appointment_id',   label:'Appt ID' },
                { key:'patient_id',       label:'Patient ID' },
                { key:'appointment_date', label:'Date' },
                { key:'status',           label:'Status' },
                { key:'risk_pct',         label:'Risk %',
                  render: v => (
                    <span style={{ fontWeight:700, color: v >= 70 ? C.rose : C.gold }}>
                      {fmt.pct(v)}
                    </span>
                  )},
                { key:'risk_tier',        label:'Tier',
                  render: v => (
                    <span style={{
                      fontWeight:600,
                      color: TIER_COLOR[v] || C.muted,
                      background: TIER_BG[v] || '#f9fafb',
                      padding:'2px 8px', borderRadius:99, fontSize:12,
                    }}>
                      {TIER_ICON[v]} {v}
                    </span>
                  )},
                { key:'action',  label:'Recommended Action' },
              ]}
              rows={bulk.high_risk_appointments || []}
              maxHeight={320}
            />
          </Card>
        </>
      )}

      {/* ── Single Appointment Predictor ── */}
      <Card accent={C.teal}>
        <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:4 }}>
          Predict a Single Appointment
        </h3>
        <p style={{ fontSize:12, color:C.muted, marginBottom:18 }}>
          Fill in appointment details to get an instant no-show risk prediction.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
          <Field label="Appointment Mode">
            <Select value={form.appt_mode} onChange={v => set('appt_mode', v)} options={APPT_MODES} />
          </Field>
          <Field label="Payment Mode">
            <Select value={form.payment_mode} onChange={v => set('payment_mode', v)} options={PAYMENT_MODES} />
          </Field>
          <Field label="Visit Reason">
            <Select value={form.visit_reason} onChange={v => set('visit_reason', v)} options={VISIT_REASONS} />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={v => set('gender', v)}
              options={[{ value:'F', label:'Female' }, { value:'M', label:'Male' }]} />
          </Field>
          <Field label="Patient Age">
            <NumInput value={form.age} min={0} max={120} onChange={v => set('age', v)} />
          </Field>
          <Field label="Appointment Month">
            <Select value={form.month} onChange={v => set('month', Number(v))}
              options={MONTHS.map((m,i) => ({ value: i+1, label: m }))} />
          </Field>
          <Field label="Day of Week">
            <Select value={form.dow} onChange={handleDow}
              options={DAYS.map((d,i) => ({ value: i, label: d }))} />
          </Field>
          <Field label="Appointment # for Patient">
            <NumInput value={form.appt_sequence} min={1} onChange={v => set('appt_sequence', v)} />
          </Field>
          <Field label="Prior No-Shows (count)">
            <NumInput value={form.prior_noshow} min={0} onChange={v => set('prior_noshow', v)} />
          </Field>
          <Field label="Prior No-Show Rate (0–1)">
            <NumInput value={form.prior_noshow_rate} min={0} max={1} step={0.01}
              onChange={v => set('prior_noshow_rate', Math.min(1, Math.max(0, v)))} />
          </Field>
          <Field label="Weekend?">
            <div style={{
              padding:'8px 12px', background:'#f3f4f6', borderRadius:8,
              fontSize:13, color:'#374151',
            }}>
              {form.is_weekend ? '✅ Yes (auto-detected)' : '❌ No (auto-detected)'}
            </div>
          </Field>
        </div>

        <button
          onClick={handlePredict}
          disabled={predLoad}
          style={{
            background: predLoad ? C.muted : C.teal,
            color: C.white, border:'none', borderRadius:8,
            padding:'10px 24px', fontSize:14, fontWeight:600,
            cursor: predLoad ? 'not-allowed' : 'pointer',
            transition:'background 0.15s',
          }}
        >
          {predLoad ? 'Predicting…' : '🔮 Predict No-Show Risk'}
        </button>

        {predErr && (
          <div style={{ marginTop:14 }}>
            <ErrorBox msg={predErr} />
          </div>
        )}

        {result && (
          <div style={{
            marginTop:20, padding:'20px 24px',
            background: TIER_BG[result.risk_tier] || '#f9fafb',
            border:`2px solid ${TIER_COLOR[result.risk_tier] || C.border}`,
            borderRadius:12,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>No-Show Risk</div>
                <div style={{ fontSize:42, fontWeight:800,
                  color: TIER_COLOR[result.risk_tier] }}>
                  {fmt.pct(result.noshow_risk_pct)}
                </div>
              </div>
              <div style={{
                fontSize:22, fontWeight:700, padding:'6px 18px',
                background: TIER_COLOR[result.risk_tier] + '20',
                border:`1px solid ${TIER_COLOR[result.risk_tier]}40`,
                borderRadius:99, color: TIER_COLOR[result.risk_tier],
              }}>
                {TIER_ICON[result.risk_tier]} {result.risk_tier} RISK
              </div>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Recommended Action</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#374151' }}>
                  {result.recommended_action}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
