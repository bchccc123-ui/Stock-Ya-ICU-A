import React, { useState, useMemo } from 'react'

// กราฟอุณหภูมิตู้เย็นรายเดือน (SVG ล้วน ไม่ต้องติดตั้ง library เพิ่ม)
// ใช้ state `logMonth` ตัวเดียวกับการ์ด "ประวัติเช็คยารายวัน" ในหน้า Export
const LO = 2, HI = 8
const W = 340, H = 190, PL = 28, PR = 10, PT = 12, PB = 24
const toDate = ts => (ts?.toDate ? ts.toDate() : new Date(ts))
const navBtn = (disabled) => ({
  background: 'none', border: '0.5px solid #C8DDD4', borderRadius: 6, padding: '4px 10px',
  cursor: disabled ? 'default' : 'pointer', fontSize: 13, color: disabled ? '#C8DDD4' : '#0F6E56',
})

export default function FridgeTempChart({ checks, logMonth, setLogMonth, onExportCSV }) {
  const [y, m] = logMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const [sel, setSel] = useState(null)
  const now = new Date()
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1
  const mName = new Date(y, m - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
  const go = (delta) => {
    const d = new Date(y, m - 1 + delta, 1)
    if (delta > 0 && d > now) return
    setLogMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    setSel(null)
  }

  const pts = useMemo(() => checks
    .filter(c => c.fridgeTemp != null)
    .map(c => ({ c, ts: toDate(c.ts) }))
    .filter(({ ts }) => ts.getFullYear() === y && ts.getMonth() + 1 === m)
    .sort((a, b) => a.ts - b.ts)
    .map(({ c, ts }) => {
      const t = Number(c.fridgeTemp)
      return {
        t, ts, shift: c.shift || '', nurse: c.nurse || '',
        isDay: (c.shift || '').includes('Day'),
        out: t < LO || t > HI,
        d: ts.getDate() - 1 + (ts.getHours() * 60 + ts.getMinutes()) / 1440,
      }
    }), [checks, y, m])

  const temps = pts.map(p => p.t)
  const avg = temps.length ? Math.round(temps.reduce((s, t) => s + t, 0) / temps.length * 10) / 10 : null
  const minT = temps.length ? Math.min(...temps) : null
  const maxT = temps.length ? Math.max(...temps) : null
  const outCount = pts.filter(p => p.out).length

  const yMin = Math.min(0, Math.floor(minT ?? 0) - 1)
  const yMax = Math.max(10, Math.ceil(maxT ?? 10) + 1)
  const X = d => PL + (d / daysInMonth) * (W - PL - PR)
  const Y = t => PT + (1 - (t - yMin) / (yMax - yMin)) * (H - PT - PB)
  const xTicks = [1, ...Array.from({ length: Math.floor(daysInMonth / 5) }, (_, i) => (i + 1) * 5)].filter(d => d <= daysInMonth)
  const yTicks = []
  for (let t = Math.ceil(yMin / 2) * 2; t <= yMax; t += 2) yTicks.push(t)
  const selPt = sel != null ? pts[sel] : null

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '0.5px solid #EEF4F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>🌡️ กราฟอุณหภูมิตู้เย็น</div>
          <button onClick={onExportCSV}
            style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#0F6E56', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
            ↓ CSV
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => go(-1)} style={navBtn(false)}>‹</button>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{mName}</div>
          <button onClick={() => go(1)} disabled={isCurrentMonth} style={navBtn(isCurrentMonth)}>›</button>
        </div>
      </div>

      {pts.length === 0 ? (
        <div style={{ padding: '28px 14px', textAlign: 'center', fontSize: 12, color: '#8BA898' }}>ไม่มีข้อมูลอุณหภูมิในเดือนนี้</div>
      ) : (
        <div style={{ padding: '10px 10px 4px' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img" aria-label={`กราฟอุณหภูมิตู้เย็น ${mName}`}>
            {/* โซนปกติ 2–8°C */}
            <rect x={PL} y={Y(HI)} width={W - PL - PR} height={Y(LO) - Y(HI)} fill="#E1F5EE" />
            {yTicks.map(t => (
              <g key={t}>
                <line x1={PL} x2={W - PR} y1={Y(t)} y2={Y(t)} stroke="#EEF4F0" strokeWidth="0.5" />
                <text x={PL - 4} y={Y(t) + 3} fontSize="9" fill="#8BA898" textAnchor="end">{t}</text>
              </g>
            ))}
            <line x1={PL} x2={W - PR} y1={Y(HI)} y2={Y(HI)} stroke="#5DCAA5" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1={PL} x2={W - PR} y1={Y(LO)} y2={Y(LO)} stroke="#5DCAA5" strokeWidth="0.8" strokeDasharray="3 3" />
            {xTicks.map(d => (
              <text key={d} x={X(d - 1)} y={H - 8} fontSize="9" fill="#8BA898" textAnchor="middle">{d}</text>
            ))}
            <polyline fill="none" stroke="#B4C9BD" strokeWidth="1" strokeLinejoin="round"
              points={pts.map(p => `${X(p.d).toFixed(1)},${Y(p.t).toFixed(1)}`).join(' ')} />
            {pts.map((p, i) => (
              <circle key={i} cx={X(p.d)} cy={Y(p.t)} r={sel === i ? 6 : 4}
                fill={p.out ? '#E24B4A' : p.isDay ? '#D4872A' : '#185FA5'}
                stroke={sel === i ? '#1A2E25' : '#fff'} strokeWidth={sel === i ? 1.5 : 1}
                style={{ cursor: 'pointer' }} onClick={() => setSel(sel === i ? null : i)} />
            ))}
          </svg>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', fontSize: 10, color: '#5F7A6A', flexWrap: 'wrap', margin: '4px 0 8px' }}>
            <span style={{ color: '#D4872A' }}>● Day</span>
            <span style={{ color: '#185FA5' }}>● Night</span>
            <span style={{ color: '#E24B4A' }}>● นอกเกณฑ์</span>
            <span>▭ โซนปกติ 2–8°C</span>
          </div>

          {selPt && (
            <div style={{ background: selPt.out ? '#FCEBEB' : '#F4F7F5', border: `0.5px solid ${selPt.out ? '#F7C1C1' : '#D8EAE0'}`,
              borderRadius: 8, padding: '8px 10px', marginBottom: 8, fontSize: 11, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span>
                {selPt.ts.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}{' '}
                {selPt.ts.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} · {selPt.shift} · {selPt.nurse}
              </span>
              <b style={{ fontFamily: 'monospace', color: selPt.out ? '#A32D2D' : '#0F6E56' }}>{selPt.t}°C</b>
            </div>
          )}
        </div>
      )}

      {pts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '4px 14px 12px' }}>
          {[
            { l: 'เฉลี่ย', v: `${avg}°`, c: '#0F6E56' },
            { l: 'ต่ำสุด', v: `${minT}°`, c: minT < LO ? '#A32D2D' : '#185FA5' },
            { l: 'สูงสุด', v: `${maxT}°`, c: maxT > HI ? '#A32D2D' : '#854F0B' },
            { l: 'นอกเกณฑ์', v: `${outCount}/${pts.length}`, c: outCount ? '#A32D2D' : '#0F6E56' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center', background: '#F4F7F5', borderRadius: 8, padding: '6px 2px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: '#8BA898' }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
