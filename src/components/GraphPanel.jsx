import { useState, useRef, useEffect, useCallback } from 'react'
import { compileFn } from '../engine/numeric'

const CURVE_COLORS = ['#2CC7A0', '#E06C75', '#E5C07B', '#61AFEF', '#C678DD']

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

  // background
  ctx.fillStyle = '#0F1117'
  ctx.fillRect(0, 0, W, H)

  // grid lines
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

  // axes
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

  // tick marks and labels
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

  // curves
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
      if (!isFinite(mathY) || isNaN(mathY)) {
        penDown = false
        prevPixY = null
        continue
      }
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
  const [fExprs, setFExprs] = useState(['sin(x)'])
  const [winStr, setWinStr] = useState({
    xmin: '-10', xmax: '10', ymin: '-6.2', ymax: '6.2', xscl: '1', yscl: '1',
  })
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  const plot = useCallback(() => {
    setError(null)
    const win = parseWin(winStr)
    if (!win) { setError('Invalid window settings'); return }
    const canvas = canvasRef.current
    if (!canvas) return
    const fns = []
    for (let i = 0; i < fExprs.length; i++) {
      const expr = fExprs[i].trim()
      if (!expr) continue
      try {
        fns.push({ fn: compileFn(expr, 'x', angleMode), color: CURVE_COLORS[i % CURVE_COLORS.length] })
      } catch {
        setError(`f${i + 1}(x): invalid expression`)
        return
      }
    }
    if (fns.length === 0) { setError('Enter at least one function'); return }
    drawGraph(canvas, fns, win)
  }, [fExprs, winStr, angleMode])

  useEffect(() => { plot() }, [plot])

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
        {fExprs.map((expr, i) => (
          <div key={i} className="graph-fn-row">
            <span className="graph-fn-label" style={{ color: CURVE_COLORS[i % CURVE_COLORS.length] }}>
              f{i + 1}(x)
            </span>
            <input
              className="graph-fn-input"
              value={expr}
              onChange={e => setFExprs(prev => prev.map((f, j) => j === i ? e.target.value : f))}
              onKeyDown={e => e.key === 'Enter' && plot()}
            />
            {fExprs.length > 1 && (
              <button
                className="graph-fn-remove"
                onClick={() => setFExprs(prev => prev.filter((_, j) => j !== i))}
                aria-label="Remove function"
              >×</button>
            )}
          </div>
        ))}
        {fExprs.length < CURVE_COLORS.length && (
          <button
            className="graph-fn-add"
            onClick={() => setFExprs(prev => [...prev, ''])}
          >+ add function</button>
        )}
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
        <button className="ov-close tbl-go" onClick={plot}>plot</button>
      </div>

      {error && <div className="ov-note tbl-error">{error}</div>}

      <canvas ref={canvasRef} className="graph-canvas" />
    </div>
  )
}
