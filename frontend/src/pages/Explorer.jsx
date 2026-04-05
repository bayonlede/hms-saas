// src/pages/Explorer.jsx
import React, { useState, useEffect } from 'react'
import { api } from '../utils/api.js'
import { fmt } from '../utils/format.js'
import { Card, SectionTitle, Spinner, ErrorBox, C, DataTable } from '../components/UI.jsx'

const TABLE_META = {
  patients:     { label:'Patients',         icon:'👤', color: C.teal },
  appointments: { label:'Appointments',     icon:'📅', color: C.sky  },
  medical:      { label:'Medical Records',  icon:'🩺', color: C.rose },
  bed_records:  { label:'Bed Records',      icon:'🛏️', color: C.gold },
  room_records: { label:'Room Records',     icon:'🚪', color: '#8b5cf6' },
  surgery:      { label:'Surgery Records',  icon:'🔬', color: C.rose },
  doctors:      { label:'Doctors',          icon:'👨‍⚕️', color: C.teal },
  nurses:       { label:'Nurses',           icon:'👩‍⚕️', color: C.sky  },
  helpers:      { label:'Support Staff',    icon:'🙋', color: C.gold },
  beds:         { label:'Beds',             icon:'🛏️', color: '#6b7280' },
  rooms:        { label:'Rooms',            icon:'🏠', color: '#6b7280' },
  wards:        { label:'Wards',            icon:'🏥', color: C.teal },
  departments:  { label:'Departments',      icon:'🏢', color: C.sky  },
  shifts:       { label:'Staff Shifts',     icon:'🕐', color: C.gold },
}

export default function Explorer() {
  const [active,   setActive]   = useState('patients')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const PAGE_SIZE = 50

  useEffect(() => {
    setPage(1)
    setSearch('')
    setData(null)
  }, [active])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.tableData(active, page, PAGE_SIZE)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [active, page])

  // Client-side search filter on current page
  const filteredRows = data?.rows?.filter(row => {
    if (!search) return true
    return Object.values(row).some(v =>
      String(v ?? '').toLowerCase().includes(search.toLowerCase())
    )
  }) || []

  const columns = (data?.columns || []).map(col => ({
    key: col, label: col.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
  }))

  const meta = TABLE_META[active] || { label: active, icon:'📄', color: C.teal }

  return (
    <div>
      <SectionTitle sub="Browse, search, and inspect all 14 raw data tables">
        Data Explorer
      </SectionTitle>

      {/* Table selector */}
      <div style={{
        display:'flex', flexWrap:'wrap', gap:8, marginBottom:20,
        padding:'14px 16px', background:'#f9fafb',
        border:`1px solid ${C.border}`, borderRadius:12,
      }}>
        {Object.entries(TABLE_META).map(([key, meta]) => {
          const isActive = active === key
          return (
            <button key={key} onClick={() => setActive(key)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:20,
                border:`1px solid ${isActive ? meta.color : C.border}`,
                background: isActive ? meta.color + '14' : C.white,
                color: isActive ? meta.color : '#374151',
                fontSize:12.5, fontWeight: isActive ? 600 : 400,
                cursor:'pointer', transition:'all 0.15s',
              }}>
              <span>{meta.icon}</span>
              {meta.label}
            </button>
          )
        })}
      </div>

      <Card accent={meta.color}>
        {/* Table header */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700, color:C.navy, margin:0 }}>
              {meta.icon} {meta.label}
            </h3>
            {data && (
              <p style={{ fontSize:12, color:C.muted, margin:'3px 0 0' }}>
                {fmt.num(data.total)} total records ·
                Page {data.page} of {data.pages}
              </p>
            )}
          </div>

          {/* Search */}
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input
              type="text"
              placeholder="Filter current page…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border:`1px solid ${C.border}`, borderRadius:8,
                padding:'7px 12px', fontSize:12.5, width:220,
                outline:'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ border:'none', background:'none', cursor:'pointer',
                  color:C.muted, fontSize:16 }}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Table content */}
        {loading && <Spinner />}
        {error   && <ErrorBox msg={error} />}
        {!loading && !error && data && (
          <>
            <DataTable columns={columns} rows={filteredRows} maxHeight={420} />

            {/* Pagination */}
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginTop:14, flexWrap:'wrap', gap:8 }}>
              <span style={{ fontSize:12, color:C.muted }}>
                Showing {((page-1)*PAGE_SIZE)+1}–
                {Math.min(page*PAGE_SIZE, data.total)} of {fmt.num(data.total)} rows
                {search && ` · ${filteredRows.length} matching filter`}
              </span>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setPage(1)} disabled={page===1}
                  style={pageBtnStyle(page===1)}>«</button>
                <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={pageBtnStyle(page===1)}>‹ Prev</button>
                {Array.from({length: Math.min(5, data.pages)}, (_,i) => {
                  const p = Math.max(1, Math.min(data.pages-4, page-2)) + i
                  if (p > data.pages) return null
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={pageBtnStyle(false, page===p, meta.color)}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p=>Math.min(data.pages,p+1))}
                  disabled={page>=data.pages} style={pageBtnStyle(page>=data.pages)}>
                  Next ›
                </button>
                <button onClick={() => setPage(data.pages)} disabled={page>=data.pages}
                  style={pageBtnStyle(page>=data.pages)}>»</button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function pageBtnStyle(disabled, active=false, activeColor=C.teal) {
  return {
    padding:'5px 10px', borderRadius:6, fontSize:12, cursor: disabled?'default':'pointer',
    border:`1px solid ${active ? activeColor : C.border}`,
    background: active ? activeColor : C.white,
    color: active ? C.white : disabled ? C.muted : '#374151',
    fontWeight: active ? 700 : 400,
    opacity: disabled ? 0.5 : 1,
    transition:'all 0.15s',
  }
}
