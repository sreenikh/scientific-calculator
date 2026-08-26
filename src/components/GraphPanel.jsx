import { useState, useRef, useEffect, useCallback } from 'react'
import { compileFn, compileImplicitFn } from '../engine/numeric'

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

// Detect if an expression is implicit (contains standalone y or = sign).
// "y = f(x)" where f(x) has no y is treated as explicit by parseExpr.
function parseExpr(rawExpr) {
  const expr = rawExpr.trim()
  if (!expr) return { implicit: false, expr }
  const yEqMatch = expr.match(/^y\s*=\s*(.+)$/i)
  if (yEqMatch) {
    const rhs = yEqMatch[1].trim()
    if (!/(?<![a-zA-Z])y(?![a-zA-Z])/.test(rhs)) {
      return { implicit: false, expr: rhs }
    }
  }
  if (expr.includes('=') || /(?<![a-zA-Z])y(?![a-zA-Z])/.test(expr)) {
    return { implicit: true, expr }
  }
  return { implicit: false, expr }
}

function formatNum(n) {
  if (!isFinite(n)) return '?'
  const abs = Math.abs(n)
  if (abs >= 1e4 || (abs < 1e-3 && abs > 0)) return n.toExponential(3)
  return parseFloat(n.toPrecision(5)).toString()
}

// Sweep y range to find where F(mathX, y) ≈ 0 (sign changes).
function findImplicitYs(fn, mathX, win, numSamples = 300) {
  const results = []
  const dy = (win.ymax - win.ymin) / numSamples
  let prevF = null, prevY = null
  for (let i = 0; i <= numSamples; i++) {
    const y = win.ymin + i * dy
    let f
    try { f = fn(mathX, y) } catch { prevF = null; prevY = null; continue }
    if (!isFinite(f) || isNaN(f)) { prevF = null; prevY = null; continue }
    if (prevF !== null && prevF * f < 0) {
      const t = prevF / (prevF - f)
      results.push(prevY + t * dy)
    }
    prevF = f; prevY = y
  }
  return results
}

// Marching squares for F(x,y) = 0 curves.
function drawImplicitCurve(ctx, fn, win, W, H, color) {
  const GX = Math.min(Math.ceil(W), 300)
  const GY = Math.min(Math.ceil(H), 300)
  const dx = (win.xmax - win.xmin) / GX
  const dy = (win.ymax - win.ymin) / GY

  const vals = new Float64Array((GX + 1) * (GY + 1))
  for (let j = 0; j <= GY; j++) {
    for (let i = 0; i <= GX; i++) {
      const x = win.xmin + i * dx
      const y = win.ymin + j * dy
      try { vals[j * (GX + 1) + i] = fn(x, y) }
      catch { vals[j * (GX + 1) + i] = NaN }
    }
  }

  const px = (x) => toPixelX(x, win.xmin, win.xmax, W)
  const py = (y) => toPixelY(y, win.ymin, win.ymax, H)

  ctx.strokeStyle = color
  ctx.lineWidth = 2

  for (let j = 0; j < GY; j++) {
    for (let i = 0; i < GX; i++) {
      const f00 = vals[j * (GX + 1) + i]
      const f10 = vals[j * (GX + 1) + (i + 1)]
      const f01 = vals[(j + 1) * (GX + 1) + i]
      const f11 = vals[(j + 1) * (GX + 1) + (i + 1)]
      if (isNaN(f00) || isNaN(f10) || isNaN(f01) || isNaN(f11)) continue

      const x0 = win.xmin + i * dx, x1 = win.xmin + (i + 1) * dx
      const y0 = win.ymin + j * dy, y1 = win.ymin + (j + 1) * dy

      const pts = []
      if (f00 * f10 < 0) { const t = f00 / (f00 - f10); pts.push([x0 + t * (x1 - x0), y0]) }
      if (f10 * f11 < 0) { const t = f10 / (f10 - f11); pts.push([x1, y0 + t * (y1 - y0)]) }
      if (f01 * f11 < 0) { const t = f01 / (f01 - f11); pts.push([x0 + t * (x1 - x0), y1]) }
      if (f00 * f01 < 0) { const t = f00 / (f00 - f01); pts.push([x0, y0 + t * (y1 - y0)]) }

      if (pts.length === 2) {
        ctx.beginPath()
        ctx.moveTo(px(pts[0][0]), py(pts[0][1]))
        ctx.lineTo(px(pts[1][0]), py(pts[1][1]))
        ctx.stroke()
      } else if (pts.length === 4) {
        // Saddle: connect opposite pairs
        ctx.beginPath(); ctx.moveTo(px(pts[0][0]), py(pts[0][1])); ctx.lineTo(px(pts[3][0]), py(pts[3][1])); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(px(pts[1][0]), py(pts[1][1])); ctx.lineTo(px(pts[2][0]), py(pts[2][1])); ctx.stroke()
      }
    }
  }
}

// Draw crosshair overlay: dashed vertical line + dot + label for each explicit curve.
function drawCrosshair(canvas, win, curves, mathX, locked) {
  if (!canvas || !win) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  if (W === 0 || H === 0) return
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, W, H)
  if (mathX === null || mathX < win.xmin || mathX > win.xmax) return

  const pixX = toPixelX(mathX, win.xmin, win.xmax, W)

  ctx.strokeStyle = locked ? 'rgba(229,192,123,0.8)' : 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath(); ctx.moveTo(pixX, 0); ctx.lineTo(pixX, H); ctx.stroke()
  ctx.setLineDash([])

  const drawIntersectionMark = (pixY, color, label) => {
    if (pixY < -10 || pixY > H + 10) return
    // Horizontal dashed line at y in curve color
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.globalAlpha = locked ? 0.65 : 0.4
    ctx.beginPath(); ctx.moveTo(0, pixY); ctx.lineTo(W, pixY); ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    // Dot
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(pixX, pixY, 4, 0, Math.PI * 2); ctx.fill()
    // Label
    ctx.font = '11px "JetBrains Mono", monospace'
    const tw = ctx.measureText(label).width
    const lx = pixX + 10 + tw > W ? pixX - tw - 10 : pixX + 10
    const ly = Math.max(14, Math.min(pixY, H - 6))
    ctx.fillStyle = 'rgba(15,17,23,0.88)'
    ctx.fillRect(lx - 2, ly - 13, tw + 4, 17)
    ctx.fillStyle = color
    ctx.fillText(label, lx, ly)
  }

  const explicitCurves = curves.filter(c => !c.isImplicit && c.fn)
  explicitCurves.forEach(({ fn, color }) => {
    let y
    try { y = fn(mathX) } catch { return }
    if (!isFinite(y) || isNaN(y)) return
    drawIntersectionMark(toPixelY(y, win.ymin, win.ymax, H), color, `(${formatNum(mathX)}, ${formatNum(y)})`)
  })

  // Implicit curves: sweep y to find intersections with the crosshair line
  curves.filter(c => c.isImplicit && c.implicitFn).forEach(({ implicitFn, color }) => {
    findImplicitYs(implicitFn, mathX, win).forEach(y => {
      drawIntersectionMark(toPixelY(y, win.ymin, win.ymax, H), color, `(${formatNum(mathX)}, ${formatNum(y)})`)
    })
  })
}

function drawGraph(canvas, curves, win) {
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
    const ay = py(0); ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.stroke()
  }
  if (win.xmin <= 0 && win.xmax >= 0) {
    const ax = px(0); ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, H); ctx.stroke()
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

  // Explicit curves (y = f(x))
  const SAMPLES = W * 2
  const MAX_JUMP = H * 2
  curves.filter(c => !c.isImplicit).forEach(({ fn, color }) => {
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
        ctx.moveTo(pixX, pixY); penDown = true
      } else {
        ctx.lineTo(pixX, pixY)
      }
      prevPixY = pixY
    }
    ctx.stroke()
  })

  // Implicit curves (F(x,y) = 0)
  curves.filter(c => c.isImplicit).forEach(({ implicitFn, color }) => {
    drawImplicitCurve(ctx, implicitFn, win, W, H, color)
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
  const [crosshairX, setCrosshairX] = useState(null)
  const [crosshairLocked, setCrosshairLocked] = useState(false)

  const canvasRefs = useRef([])
  const overlayRefs = useRef([])
  const compiledFnsRef = useRef([])
  const winRef = useRef(null)

  const visibleFns = fns
    .map((f, i) => ({ ...f, idx: i }))
    .filter(f => f.visible && f.expr.trim())
  const visibleFnsRef = useRef(visibleFns)
  visibleFnsRef.current = visibleFns

  const plot = useCallback(() => {
    setError(null)
    const win = parseWin(winStr)
    if (!win) { setError('Invalid window settings'); return }
    winRef.current = win

    const compiled = []
    for (const { expr, idx } of fns.map((f, i) => ({ ...f, idx: i })).filter(f => f.visible && f.expr.trim())) {
      const parsed = parseExpr(expr.trim())
      const color = CURVE_COLORS[idx % CURVE_COLORS.length]
      try {
        if (parsed.implicit) {
          compiled.push({ fn: null, implicitFn: compileImplicitFn(parsed.expr, angleMode), isImplicit: true, color, idx })
        } else {
          compiled.push({ fn: compileFn(parsed.expr, 'x', angleMode), implicitFn: null, isImplicit: false, color, idx })
        }
      } catch {
        setError(`f${idx + 1}: invalid expression`)
        return
      }
    }

    if (compiled.length === 0) { setError('No visible functions to plot'); return }
    compiledFnsRef.current = compiled

    if (splitMode) {
      compiled.forEach((entry, i) => {
        const canvas = canvasRefs.current[i]
        if (canvas) drawGraph(canvas, [entry], win)
      })
    } else {
      const canvas = canvasRefs.current[0]
      if (canvas) drawGraph(canvas, compiled, win)
    }

    setCrosshairX(null)
    setCrosshairLocked(false)
  }, [fns, winStr, angleMode, splitMode])

  useEffect(() => { plot() }, [plot])

  // Redraw crosshair on all overlays whenever position or lock changes
  useEffect(() => {
    const win = winRef.current
    const compiled = compiledFnsRef.current
    const vfns = visibleFnsRef.current
    if (splitMode) {
      vfns.forEach(({ idx }, i) => {
        const overlay = overlayRefs.current[i]
        const curvesForSubplot = compiled.filter(f => f.idx === idx)
        drawCrosshair(overlay, win, curvesForSubplot, crosshairX, crosshairLocked)
      })
    } else {
      drawCrosshair(overlayRefs.current[0], win, compiled, crosshairX, crosshairLocked)
    }
  }, [crosshairX, crosshairLocked, splitMode])

  const handleMouseMove = (e, canvas) => {
    if (crosshairLocked || !canvas || !winRef.current) return
    const rect = canvas.getBoundingClientRect()
    const win = winRef.current
    const mathX = win.xmin + ((e.clientX - rect.left) / canvas.clientWidth) * (win.xmax - win.xmin)
    setCrosshairX(mathX)
  }

  const handleMouseLeave = () => {
    if (!crosshairLocked) setCrosshairX(null)
  }

  const handleClick = () => {
    if (crosshairX !== null || crosshairLocked) setCrosshairLocked(prev => !prev)
  }

  const handleSquareAxes = () => {
    const canvas = canvasRefs.current[0]
    if (!canvas || !canvas.clientWidth || !canvas.clientHeight) return
    const win = parseWin(winStr)
    if (!win) return
    const W = canvas.clientWidth, H = canvas.clientHeight
    const xrange = win.xmax - win.xmin
    const ycenter = (win.ymin + win.ymax) / 2
    const yrange = xrange * H / W
    setWinStr(w => ({
      ...w,
      ymin: String(parseFloat((ycenter - yrange / 2).toPrecision(6))),
      ymax: String(parseFloat((ycenter + yrange / 2).toPrecision(6))),
    }))
  }

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
        {fns.map(({ expr, visible }, i) => {
          const { implicit } = parseExpr(expr.trim())
          return (
            <div key={i} className={`graph-fn-row${visible ? '' : ' graph-fn-hidden'}`}>
              <span
                className="graph-fn-label"
                style={{ color: visible ? CURVE_COLORS[i % CURVE_COLORS.length] : '#555B6E' }}
              >
                f{i + 1}({implicit ? 'x,y' : 'x'})
              </span>
              <input
                className="graph-fn-input"
                value={expr}
                placeholder={implicit ? 'e.g. x^2 + y^2 = 4' : 'e.g. sin(x)  or  x^2 + y^2 = 4'}
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
          )
        })}
        <button
          className="graph-fn-add"
          onClick={() => setFns(prev => [...prev, { expr: '', visible: true }])}
        >+ add function</button>
        <p className="graph-fn-tip">label shows f(x,y) when y or = is detected — plots implicit curves (circles, ellipses, hyperbolas)</p>
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
          <button className={`graph-view-btn${!splitMode ? ' active' : ''}`} onClick={() => setSplitMode(false)}>combined</button>
          <button className={`graph-view-btn${splitMode ? ' active' : ''}`} onClick={() => setSplitMode(true)}>split</button>
          <button className="graph-view-btn" onClick={handleSquareAxes} title="Equal scale on both axes">1:1</button>
        </div>
        <button className="ov-close tbl-go" onClick={plot}>plot</button>
        <span className="graph-crosshair-hint">
          {crosshairLocked ? 'click to unlock' : 'hover · click to lock'}
        </span>
      </div>

      {error && <div className="ov-note tbl-error">{error}</div>}

      {splitMode ? (
        <div
          className="graph-split-grid"
          style={{ gridTemplateColumns: visibleFns.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}
        >
          {visibleFns.map(({ idx }, i) => {
            const { implicit } = parseExpr(fns[idx]?.expr?.trim() ?? '')
            return (
              <div key={idx} className="graph-subplot">
                <span
                  className="graph-subplot-label"
                  style={{ color: CURVE_COLORS[idx % CURVE_COLORS.length] }}
                >f{idx + 1}({implicit ? 'x,y' : 'x'})</span>
                <div
                  className="graph-subplot-canvas-wrapper"
                  onMouseMove={e => handleMouseMove(e, canvasRefs.current[i])}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                  style={{ cursor: 'crosshair' }}
                >
                  <canvas ref={el => { canvasRefs.current[i] = el }} className="graph-subplot-canvas" />
                  <canvas ref={el => { overlayRefs.current[i] = el }} className="graph-crosshair-overlay" />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          className="graph-canvas-wrapper"
          onMouseMove={e => handleMouseMove(e, canvasRefs.current[0])}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ cursor: 'crosshair' }}
        >
          <canvas ref={el => { canvasRefs.current[0] = el }} className="graph-canvas" />
          <canvas ref={el => { overlayRefs.current[0] = el }} className="graph-crosshair-overlay" />
        </div>
      )}
    </div>
  )
}
