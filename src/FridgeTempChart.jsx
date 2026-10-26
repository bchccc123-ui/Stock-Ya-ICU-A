import React, { useState, useMemo, useRef, useEffect } from 'react'

// กราฟอุณหภูมิตู้เย็นรายเดือน (SVG ล้วน ไม่ต้องติดตั้ง library เพิ่ม)
// ใช้ state `logMonth` ตัวเดียวกับการ์ด "ประวัติเช็คยารายวัน" ในหน้า Export
const LO = 2, HI = 8
// กราฟปรับความกว้างตามหน้าจออัตโนมัติ (พอดีจอ ไม่ต้องเลื่อน) — ความกว้างต่อวัน = พื้นที่กราฟ / จำนวนวัน
const H = 250, PL = 26, PR = 6, PT = 28, PB = 34
const toDate = ts => (ts?.toDate ? ts.toDate() : new Date(ts))
const navBtn = (disabled) => ({
  background: 'none', border: '0.5px solid #C8DDD4', borderRadius: 6, padding: '4px 10px',
  cursor: disabled ? 'default' : 'pointer', fontSize: 13, color: disabled ? '#C8DDD4' : '#0F6E56',
})

export default function FridgeTempChart({ checks, logMonth, setLogMonth, onExportCSV }) {
  const [y, m] = logMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const [sel, setSel] = useState(null) // วันที่ที่เลือก (1-31)
  const [showTable, setShowTable] = useState(false)
  const boxRef = useRef(null)
  const [boxW, setBoxW] = useState(340)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const upd = () => setBoxW(Math.max(250, Math.floor(el.clientWidth) - 20))
    upd()
    const ro = new ResizeObserver(upd)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
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
        d: ts.getDate() - 1,
        day: ts.getDate(),
      }
    }), [checks, y, m])

  const temps = pts.map(p => p.t)
  const avg = temps.length ? Math.round(temps.reduce((s, t) => s + t, 0) / temps.length * 10) / 10 : null
  const minT = temps.length ? Math.min(...temps) : null
  const maxT = temps.length ? Math.max(...temps) : null
  const outCount = pts.filter(p => p.out).length

  const yMin = Math.min(1, Math.floor(minT ?? 1) - 1)
  const yMax = Math.max(9, Math.ceil(maxT ?? 9) + 1)
  const plotW = boxW - PL
  const DAY_W = (plotW - PR) / daysInMonth
  const wide = DAY_W >= 22            // จอกว้าง: ตัวเลขแนวนอน / จอแคบ: ตัวเลขแนวตั้ง
  const lblSize = wide ? 10 : Math.min(9, Math.max(7, DAY_W - 2.5))
  const stagger = DAY_W < 14           // จอแคบ: ป้ายวันที่สลับ 2 บรรทัด เพื่อให้แสดงครบทุกวันโดยไม่ทับกัน
  const tickSize = Math.min(10, Math.max(7, DAY_W * 0.72))
  const X = d => (d + 0.5) * DAY_W   // d = ลำดับวัน (0 = วันที่ 1) ศูนย์กลางคอลัมน์
  const off = p => (p.isDay ? -1 : 1) * DAY_W * 0.18   // แยก Day/Night ซ้าย-ขวาเล็กน้อย
  const Y = t => PT + (1 - (t - yMin) / (yMax - yMin)) * (H - PT - PB)
  const yTicks = []
  for (let t = Math.ceil(yMin / 2) * 2; t <= yMax; t += 2) yTicks.push(t)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const isWeekend = day => { const w = new Date(y, m - 1, day).getDay(); return w === 0 || w === 6 }
  const todayDay = isCurrentMonth ? now.getDate() : null

  // รวมค่าตามวัน (ใช้ในตารางรายวัน)
  const byDay = useMemo(() => {
    const map = {}
    pts.forEach(p => { (map[p.ts.getDate()] ||= []).push(p) })
    return map
  }, [pts])

  const selPts = sel != null ? (byDay[sel] || []) : []

  return (
    <div className="card" ref={boxRef} style={{ padding: 0 }}>
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
          <div style={{ display: 'flex' }}>
            {/* แกน Y */}
            <svg width={PL} height={H} style={{ flexShrink: 0 }} aria-hidden="true">
              {yTicks.map(t => (
                <text key={t} x={PL - 4} y={Y(t) + 3} fontSize="9" fill="#8BA898" textAnchor="end">{t}</text>
              ))}
            </svg>
            <svg width={plotW} height={H} style={{ display: 'block' }}
              role="img" aria-label={`กราฟอุณหภูมิตู้เย็น ${mName} แสดงรายวัน`}>
              {/* โซนปกติ 2–8°C */}
              <rect x={0} y={Y(HI)} width={plotW - PR} height={Y(LO) - Y(HI)} fill="#E1F5EE" />
              {/* คอลัมน์รายวัน: เสาร์-อาทิตย์ / วันนี้ / วันที่เลือก */}
              {days.map(d => (isWeekend(d) || d === todayDay || d === sel) && (
                <rect key={'bg' + d} x={(d - 1) * DAY_W} y={PT - 6} width={DAY_W} height={H - PT - PB + 6}
                  fill={d === sel ? '#DDEFE6' : d === todayDay ? '#FFF4DC' : '#F4F7F5'} opacity={0.85} />
              ))}
              {yTicks.map(t => (
                <line key={t} x1={0} x2={plotW - PR} y1={Y(t)} y2={Y(t)} stroke="#EEF4F0" strokeWidth="0.5" />
              ))}
              <line x1={0} x2={plotW - PR} y1={Y(HI)} y2={Y(HI)} stroke="#5DCAA5" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1={0} x2={plotW - PR} y1={Y(LO)} y2={Y(LO)} stroke="#5DCAA5" strokeWidth="0.8" strokeDasharray="3 3" />
              {/* ป้ายวันที่ */}
              {days.map(d => (
                <text key={'x' + d} x={(d - 0.5) * DAY_W} y={stagger && d % 2 === 0 ? H - 4 : stagger ? H - 16 : H - 9} fontSize={tickSize} textAnchor="middle"
                  fill={d === todayDay ? '#D4872A' : byDay[d] ? '#3D5A4A' : '#B4C9BD'}
                  fontWeight={d === todayDay ? 700 : 400}>{d}</text>
              ))}
              <polyline fill="none" stroke="#B4C9BD" strokeWidth="1" strokeLinejoin="round"
                points={pts.map(p => `${(X(p.d) + off(p)).toFixed(1)},${Y(p.t).toFixed(1)}`).join(' ')} />
              {pts.map((p, i) => {
                const cx = X(p.d) + off(p), cy = Y(p.t)
                const fill = p.out ? '#A32D2D' : p.isDay ? '#854F0B' : '#185FA5'
                const common = { fontSize: lblSize, fontWeight: p.out ? 700 : 500, fill, stroke: '#fff', strokeWidth: 2.5, paintOrder: 'stroke' }
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r={sel === p.day ? 3.6 : Math.min(3.5, Math.max(2.2, DAY_W / 3))}
                      fill={p.out ? '#E24B4A' : p.isDay ? '#D4872A' : '#185FA5'} stroke="#fff" strokeWidth="1" />
                    {/* ตัวเลขอุณหภูมิ: Day อยู่เหนือจุด / Night อยู่ใต้จุด */}
                    {wide ? (
                      <text x={cx} y={p.isDay ? cy - 7 : cy + lblSize + 4} textAnchor="middle" {...common}>{p.t}</text>
                    ) : (
                      <text transform={`translate(${cx + lblSize / 3},${p.isDay ? cy - 6 : cy + 6}) rotate(-90)`}
                        textAnchor={p.isDay ? 'start' : 'end'} {...common}>{p.t}</text>
                    )}
                  </g>
                )
              })}
              {/* แตะที่คอลัมน์ของวันเพื่อดูรายละเอียด */}
              {days.map(d => (
                <rect key={'hit' + d} x={(d - 1) * DAY_W} y={0} width={DAY_W} height={H - PB / 2} fill="transparent"
                  style={{ cursor: 'pointer' }} onClick={() => setSel(sel === d ? null : d)} />
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', fontSize: 10, color: '#5F7A6A', flexWrap: 'wrap', margin: '4px 0 8px' }}>
            <span style={{ color: '#D4872A' }}>● Day</span>
            <span style={{ color: '#185FA5' }}>● Night</span>
            <span style={{ color: '#E24B4A' }}>● นอกเกณฑ์</span>
            <span>▭ โซนปกติ 2–8°C</span>
          </div>

          {sel != null && (
            <div style={{ background: selPts.some(p => p.out) ? '#FCEBEB' : '#F4F7F5',
              border: `0.5px solid ${selPts.some(p => p.out) ? '#F7C1C1' : '#D8EAE0'}`,
              borderRadius: 8, padding: '8px 10px', marginBottom: 8, fontSize: 11 }}>
              <div style={{ fontWeight: 600, marginBottom: selPts.length ? 4 : 0 }}>
                {new Date(y, m - 1, sel).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                {!selPts.length && <span style={{ fontWeight: 400, color: '#8BA898' }}> · ไม่มีบันทึก</span>}
              </div>
              {selPts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}>
                  <span>
                    {p.ts.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} · {p.shift} · {p.nurse}
                  </span>
                  <b style={{ fontFamily: 'monospace', color: p.out ? '#A32D2D' : '#0F6E56' }}>{p.t}°C</b>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowTable(v => !v)}
            style={{ width: '100%', background: '#F4F7F5', border: '0.5px solid #D8EAE0', borderRadius: 8, padding: '6px 0',
              fontSize: 11, color: '#0F6E56', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
            {showTable ? '▲ ซ่อนตารางรายวัน' : '▼ ดูตารางรายวัน'}
          </button>
          {showTable && (
            <div style={{ border: '0.5px solid #EEF4F0', borderRadius: 8, overflow: 'hidden', marginBottom: 8, fontSize: 11 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr', background: '#F4F7F5', padding: '5px 8px', color: '#5F7A6A', fontWeight: 600 }}>
                <span>วันที่</span><span style={{ color: '#D4872A' }}>Day</span><span style={{ color: '#185FA5' }}>Night</span>
              </div>
              {days.map(d => {
                const rows = byDay[d] || []
                const cell = isDay => {
                  const r = rows.filter(p => p.isDay === isDay)
                  return r.length
                    ? r.map((p, k) => <b key={k} style={{ fontFamily: 'monospace', color: p.out ? '#A32D2D' : '#1A2E25', marginRight: 6 }}>{p.t}°</b>)
                    : <span style={{ color: '#C8DDD4' }}>–</span>
                }
                return (
                  <div key={d} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr', padding: '4px 8px', borderTop: '0.5px solid #EEF4F0',
                    background: d === todayDay ? '#FFF9EA' : isWeekend(d) ? '#FAFCFB' : '#fff' }}>
                    <span style={{ color: '#5F7A6A' }}>{d}</span>{cell(true)}{cell(false)}
                  </div>
                )
              })}
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
