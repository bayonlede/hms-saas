// src/components/Logo.jsx
import React from 'react'

export default function Logo({ size = 36, animated = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={animated ? { animation: 'logoPulse 3s ease-in-out infinite' } : {}}
    >
      <style>{`
        @keyframes logoPulse {
          0%,100% { filter: drop-shadow(0 0 4px rgba(26,156,138,0.4)); }
          50%      { filter: drop-shadow(0 0 10px rgba(26,156,138,0.8)); }
        }
        @keyframes crossDraw {
          from { stroke-dashoffset: 120; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Outer circle */}
      <circle cx="24" cy="24" r="22" fill="#f0faf8" stroke="#1a9c8a" strokeWidth="2" />

      {/* Building base */}
      <rect x="12" y="18" width="24" height="18" rx="1.5" fill="#ffffff" stroke="#1a9c8a" strokeWidth="1.5" />

      {/* Cross — vertical bar */}
      <rect x="21.5" y="10" width="5" height="14" rx="1" fill="#1a9c8a"
        style={{ animation: animated ? 'logoPulse 3s ease-in-out infinite' : 'none' }}
      />
      {/* Cross — horizontal bar */}
      <rect x="17" y="14.5" width="14" height="5" rx="1" fill="#1a9c8a" />

      {/* Windows on building */}
      <rect x="15" y="22" width="4" height="4" rx="0.5" fill="#c8ece8" />
      <rect x="22" y="22" width="4" height="4" rx="0.5" fill="#c8ece8" />
      <rect x="29" y="22" width="4" height="4" rx="0.5" fill="#c8ece8" />

      {/* Door */}
      <rect x="20" y="28" width="8" height="8" rx="1" fill="#1a9c8a" opacity="0.7" />
    </svg>
  )
}
