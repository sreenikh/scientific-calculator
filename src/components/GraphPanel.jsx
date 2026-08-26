import { useState, useRef, useEffect, useCallback } from 'react'
import { compileFn } from '../engine/numeric'

export const CURVE_COLORS = [
  '#2CC7A0', '#E06C75', '#E5C07B', '#61AFEF', '#C678DD',
  '#56B6C2', '#D19A66', '#98C379', '#BE5046', '#528BFF',
]

export function toPixelX(mathX, xmin, xmax, W) {
  return (mathX - xmin) / (xmax - xmin) * W
}
export function toPixelY(mathY, ymin, ymax, H) {
  return (ymax - mathY) / (ymax - ymin) * H
}

function drawGraph(canvas, fns, win) {
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  if (W === 0 || H === 0) return
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const px = (x) => toPixelX(x, win.xmin, win.xmax, W)
  const py = (y) => toPixelY(y, win.ymin, win.ymax, H)

  ctx.fillStyle = '#0F1117'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#1C2030'
  ctx.lineWidth = 1
  const xGridStart = Math.ceil(win.xmin / win.xscl) * win.xscl
  for (let x = xGridStart; x <= win.xmax + win.xscl * 0.01; x = Math.round((x + win.xscl) * 1e10) / 1e10) {
    const gx = px(x)
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
  }
  const yGridStart = Math.ceil(win.ymin / win.yscl) * win.yscl
  for (let y = yGridStart; y <= win.ymax + win.yscl * 0.01; y = Math.round((y + win.yscl) * 1e10) / 1e10) {
    const gy = py(y)
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
  }

  ctx.strokeStyle = '#3A3F52'
  ctx.lineWidth = 1.5
  if (win.ymin <= 0 && win.ymax >= 0) {
    const ay = py(0)
    ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.stroke()
  }
  if (win.xmin <= 0 && win.xmax >= 0) {
    const ax = px(0)
    ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, H); ctx.stroke()
  }

  const fontSize = Math.max(9, Math.round(W * 0.022))
  ctx.font = `${fontSize}px "JetBrains Mono", monospace`
  ctx.fillStyle = '#555B6E'
  ctx.strokeStyle = '#3A3F52'
  ctx.lineWidth = 1
  const axisY = win.ymin <= 0 && win.ymax >= 0 ? py(0) : H
  const axisX = win.xmin <= 0 && win.xmax >= 0 ? px(0) : 0

  ctx.textAlign = 'center'
  for (let x = xGridStart; x <= win.xmax + win.xscl * 0.01; x = Math.round((x + win.xscl) * 1e10) / 1e10) {
    if (Math.abs(x) < win.xscl * 0.01) continue
    const gx = px(x)
    ctx.beginPath(); ctx.moveTo(gx, axisY - 3); ctx.lineTo(gx, axisY + 3); ctx.stroke()
    const lbl = Number.isInteger(x) ? String(x) : x.toPrecision(3).replace(/\.?0+$/, '')
    ctx.fillText(lbl, gx, Math.min(axisY + fontSize + 4, H - 2))
  }

  ctx.textAlign = 'right'
  for (let y = yGridStart; y <= win.ymax + win.yscl * 0.01; y = Math.round((y + win.yscl) * 1e10) / 1e10) {
    if (Math.abs(y) < win.yscl * 0.01) continue
    const gy = py(y)
    ctx.beginPath(); ctx.moveTo(axisX - 3, gy); ctx.lineTo(axisX + 3, gy); ctx.stroke()
    const lbl = Number.isInteger(y) ? String(y) : y.toPrecision(3).replace(/\.?0+$/, '')
    ctx.fillText(lbl, Math.max(axisX - 5, fontSize * 2), gy + fontSize * 0.35)
  }

  const SAMPLES = W * 2
  const MAX_JUMP = H * 2
  fns.forEach(({ fn, color }) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    let penDown = false
    let prevPixY = null
    for (let i = 0; i <= SAMPLES; i++) {
      const mathX = win.xmin + (i / SAMPLES) * (win.xmax - win.xmin)
      let mathY
      try { mathY = fn(mathX) } catch { mathY = NaN }
      if (!isFinite(mathY) || isNaN(mathY)) { penDown = false; prevPixY = null; continue }
      const pixX = px(mathX)
      const pixY = py(mathY)
      if (!penDown || (prevPixY !== null && Math.abs(pixY - prevPixY) > MAX_JUMP)) {
        ctx.moveTo(pixX, pixY)
        penDown = true
      } else {
        ctx.lineTo(pixX, pixY)
      }
      prevPixY = pixY
    }
    ctx.stroke()
  })
}

function parseWin(s) {
  const keys = ['xmin', 'xmax', 'ymin', 'ymax', 'xscl', 'yscl']
  const w = {}
  for (const k of keys) {
    const v = parseFloat(s[k])
    if (isNaN(v)) return null
    w[k] = v
  }
  if (w.xmin >= w.xmax || w.ymin >= w.ymax || w.xscl <= 0 || w.yscl <= 0) return null
  return w
}

export default function GraphPanel({ onClose, angleMode = 'deg' }) {
  const [fns, setFns] = useState([{ expr: 'sin(x)', visible: true }])
  const [winStr, setWinStr] = useState({
    xmin: '-10', xmax: '10', ymin: '-6.2', ymax: '6.2', xscl: '1', yscl: '1',
  })
  const [splitMode, setSplitMode] = useState(false)
  const [error, setError] = useState(null)
  const canvasRefs = useRef([])

  // Visible, non-empty entries with their original index preserved for color/label
  const visibleFns = fns
    .map((f, i) => ({ ...f, idx: i }))
    .filter(f => f.visible && f.expr.trim())

  const plot = useCallback(() => {
    setError(null)
    const win = parseWin(winStr)
    if (!win) { setError('Invalid window settings'); return }

    const compiled = []
    for (const { expr, idx } of fns.map((f, i) => ({ ...f, idx: i })).filter(f => f.visible && f.expr.trim())) {
      try {
        compiled.push({
          fn: compileFn(expr.trim(), 'x', angleMode),
          color: CURVE_COLORS[idx % CURVE_COLORS.length],
        })
      } catch {
        setError(`f${idx + 1}(x): invalid expression`)
        return
      }
    }

    if (compiled.length === 0) { setError('No visible functions to plot'); return }

    if (splitMode) {
      compiled.forEach((entry, i) => {
        const canvas = canvasRefs.current[i]
        if (canvas) drawGraph(canvas, [entry], win)
      })
    } else {
      const canvas = canvasRefs.current[0]
      if (canvas) drawGraph(canvas, compiled, win)
    }
  }, [fns, winStr, angleMode, splitMode])

  useEffect(() => { plot() }, [plot])

  const updateFn = (i, patch) =>
    setFns(prev => prev.map((f, j) => j === i ? { ...f, ...patch } : f))

  const WIN_FIELDS = [
    ['xmin', 'Xmin'], ['xmax', 'Xmax'], ['ymin', 'Ymin'],
    ['ymax', 'Ymax'], ['xscl', 'Xscl'], ['yscl', 'Yscl'],
  ]

  return (
    <div className="overlay graph-overlay">
      <div className="ov-head">
        <h3>Graph</h3>
        <span className="tbl-mode-badge">{angleMode.toUpperCase()}</span>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      <div className="graph-fns">
        {fns.map(({ expr, visible }, i) => (
          <div key={i} className={`graph-fn-row${visible ? '' : ' graph-fn-hidden'}`}>
            <span
              className="graph-fn-label"
              style={{ color: visible ? CURVE_COLORS[i % CURVE_COLORS.length] : '#555B6E' }}
            >
              f{i + 1}(x)
            </span>
            <input
              className="graph-fn-input"
              value={expr}
              onChange={e => updateFn(i, { expr: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && plot()}
            />
            <button
              className={`graph-fn-eye${visible ? ' active' : ''}`}
              onClick={() => updateFn(i, { visible: !visible })}
              title={visible ? 'Hide' : 'Show'}
            >{visible ? '●' : '○'}</button>
            {fns.length > 1 && (
              <button
                className="graph-fn-remove"
                onClick={() => setFns(prev => prev.filter((_, j) => j !== i))}
                aria-label="Remove function"
              >×</button>
            )}
          </div>
        ))}
        <button
          className="graph-fn-add"
          onClick={() => setFns(prev => [...prev, { expr: '', visible: true }])}
        >+ add function</button>
      </div>

      <div className="graph-win">
        {WIN_FIELDS.map(([k, label]) => (
          <label key={k} className="graph-win-field">
            <span>{label}</span>
            <input
              className="tbl-num"
              value={winStr[k]}
              onChange={e => setWinStr(w => ({ ...w, [k]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && plot()}
            />
          </label>
        ))}
        <div className="graph-view-toggle">
          <button
            className={`graph-view-btn${!splitMode ? ' active' : ''}`}
            onClick={() => setSplitMode(false)}
          >combined</button>
          <button
            className={`graph-view-btn${splitMode ? ' active' : ''}`}
            onClick={() => setSplitMode(true)}
          >split</button>
        </div>
        <button className="ov-close tbl-go" onClick={plot}>plot</button>
      </div>

      {error && <div className="ov-note tbl-error">{error}</div>}

      {splitMode ? (
        <div
          className="graph-split-grid"
          style={{ gridTemplateColumns: visibleFns.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}
        >
          {visibleFns.map(({ idx }, i) => (
            <div key={idx} className="graph-subplot">
              <span
                className="graph-subplot-label"
                style={{ color: CURVE_COLORS[idx % CURVE_COLORS.length] }}
              >f{idx + 1}(x)</span>
              <canvas ref={el => { canvasRefs.current[i] = el }} className="graph-subplot-canvas" />
            </div>
          ))}
        </div>
      ) : (
        <canvas ref={el => { canvasRefs.current[0] = el }} className="graph-canvas" />
      )}
    </div>
  )
}
