// src/utils/format.js
export const fmt = {
  currency: (v, short = false) => {
    if (v == null) return '—'
    if (short) {
      if (v >= 1_000_000) return `£${(v/1_000_000).toFixed(1)}M`
      if (v >= 1_000)     return `£${(v/1_000).toFixed(0)}K`
    }
    return `£${Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
  },
  pct:    (v) => v == null ? '—' : `${Number(v).toFixed(1)}%`,
  num:    (v) => v == null ? '—' : Number(v).toLocaleString(),
  days:   (v) => v == null ? '—' : `${Number(v).toFixed(1)} days`,
  round:  (v, d=1) => v == null ? '—' : Number(v).toFixed(d),
}
