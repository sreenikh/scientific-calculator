import { useState, useRef, useEffect, useCallback } from 'react'
import { compileFn, compileImplicitFn } from '../engine/numeric'
import { trackEvent } from '../analytics'
import GraphPanel3D from './GraphPanel3D'

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

export function niceStep(range) {
  if (range <= 0) return 1
  const raw = range / 8
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  return (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag
}

function fmtWin(n) { return String(parseFloat(n.toPrecision(7))) }

function parseExpr(rawExpr) {
  const expr = rawExpr.trim()
  if (!expr) return { implicit: false, expr }
  const m = expr.match(/^y\s*=\s*(.+)$/i)
  if (m && !/(?<![a-zA-Z])y(?![a-zA-Z])/.test(m[1].trim())) return { implicit: false, expr: m[1].trim() }
  if (expr.includes('=') || /(?<![a-zA-Z])y(?![a-zA-Z])/.test(expr)) return { implicit: true, expr }
  return { implicit: false, expr }
}

function formatNum(n) {
  if (!isFinite(n)) return '?'
  const abs = Math.abs(n)
  if (abs >= 1e4 || (abs < 1e-3 && abs > 0)) return n.toExponential(3)
  return parseFloat(n.toPrecision(5)).toString()
}

// ── Implicit curve utilities ───────────────────────────────────────────────

function findImplicitYs(fn, mathX, win, numSamples = 300) {
  const results = [], dy = (win.ymax - win.ymin) / numSamples
  let prevF = null, prevY = null
  for (let i = 0; i <= numSamples; i++) {
    const y = win.ymin + i * dy
    let f; try { f = fn(mathX, y) } catch { prevF = null; prevY = null; continue }
    if (!isFinite(f) || isNaN(f)) { prevF = null; prevY = null; continue }
    if (prevF !== null && prevF * f < 0) results.push(prevY + (prevF / (prevF - f)) * dy)
    prevF = f; prevY = y
  }
  return results
}

// Newton projection onto F(x,y) = 0.
export function projectOntoCurve(fn, x0, y0, maxIter = 12, tol = 1e-8) {
  let x = x0, y = y0
  const h = 1e-6
  for (let i = 0; i < maxIter; i++) {
    let f; try { f = fn(x, y) } catch { return null }
    if (!isFinite(f)) return null
    if (Math.abs(f) < tol) return { x, y }
    const gx = (fn(x + h, y) - fn(x - h, y)) / (2 * h)
    const gy = (fn(x, y + h) - fn(x, y - h)) / (2 * h)
    const g2 = gx * gx + gy * gy
    if (g2 < 1e-20) return null
    x -= f * gx / g2; y -= f * gy / g2
  }
  return null
}

// One tangent step along F(x,y)=0, then project back.
export function implicitStep(fn, x, y, stepSize, dir) {
  const h = 1e-6
  let gx, gy
  try {
    gx = (fn(x + h, y) - fn(x - h, y)) / (2 * h)
    gy = (fn(x, y + h) - fn(x, y - h)) / (2 * h)
  } catch { return null }
  const len = Math.sqrt(gx * gx + gy * gy)
  if (len < 1e-10) return null
  const tx = -gy / len * dir, ty = gx / len * dir
  return projectOntoCurve(fn, x + stepSize * tx, y + stepSize * ty)
}

// Find a starting trace position on a curve near (nearX, nearY).
function findInitialTracePos(curve, win, nearX, nearY) {
  const cx = nearX ?? (win.xmin + win.xmax) / 2
  if (!curve.isImplicit) {
    for (let a = 0; a <= 50; a++) {
      const x = a === 0 ? cx : win.xmin + (a / 50) * (win.xmax - win.xmin)
      try { const y = curve.fn(x); if (isFinite(y) && !isNaN(y)) return { x, y } } catch {}
    }
    return null
  }
  for (let a = 0; a <= 50; a++) {
    const x = a === 0 ? cx : win.xmin + (a / 50) * (win.xmax - win.xmin)
    const ys = findImplicitYs(curve.implicitFn, x, win)
    if (ys.length) {
      const y = nearY != null ? ys.reduce((b, yy) => Math.abs(yy - nearY) < Math.abs(b - nearY) ? yy : b, ys[0]) : ys[0]
      return { x, y }
    }
  }
  return null
}

// Search for where plots exist and return a bounding window.
export function findPlotBounds(compiled) {
  for (const XSEARCH of [5, 15, 50, 150]) {
    const pts = []
    compiled.filter(c => !c.isImplicit && c.fn).forEach(({ fn }) => {
      for (let i = 0; i <= 300; i++) {
        const x = -XSEARCH + (i / 300) * 2 * XSEARCH
        try { const y = fn(x); if (isFinite(y) && !isNaN(y) && Math.abs(y) < XSEARCH * 20) pts.push([x, y]) } catch {}
      }
    })
    compiled.filter(c => c.isImplicit && c.implicitFn).forEach(({ implicitFn }) => {
      const G = 30, step = 2 * XSEARCH / G
      for (let j = 0; j < G; j++) {
        for (let i = 0; i < G; i++) {
          const x = -XSEARCH + i * step, y = -XSEARCH + j * step
          try {
            const f00 = implicitFn(x, y), f10 = implicitFn(x + step, y), f01 = implicitFn(x, y + step)
            if (isFinite(f00) && isFinite(f10) && f00 * f10 < 0) pts.push([x + step / 2, y])
            if (isFinite(f00) && isFinite(f01) && f00 * f01 < 0) pts.push([x, y + step / 2])
          } catch {}
        }
      }
    })
    if (pts.length < 8) continue
    const xs = pts.map(p => p[0]).sort((a, b) => a - b)
    const ys = pts.map(p => p[1]).sort((a, b) => a - b)
    const cp = Math.max(0, Math.floor(pts.length * 0.05))
    let x0 = xs[cp], x1 = xs[xs.length - 1 - cp]
    let y0 = ys[cp], y1 = ys[ys.length - 1 - cp]
    if (x1 - x0 < 1) { const cx = (x0 + x1) / 2; x0 = cx - 3; x1 = cx + 3 }
    if (y1 - y0 < 1) { const cy = (y0 + y1) / 2; y0 = cy - 3; y1 = cy + 3 }
    const xp = (x1 - x0) * 0.15, yp = (y1 - y0) * 0.15
    return { xmin: x0 - xp, xmax: x1 + xp, ymin: y0 - yp, ymax: y1 + yp, xscl: niceStep((x1 - x0) * 1.3), yscl: niceStep((y1 - y0) * 1.3) }
  }
  return null
}

// ── Canvas drawing ─────────────────────────────────────────────────────────

function drawImplicitCurve(ctx, fn, win, W, H, color, gridSize = 300) {
  const GX = Math.min(Math.ceil(W), gridSize), GY = Math.min(Math.ceil(H), gridSize)
  const dx = (win.xmax - win.xmin) / GX, dy = (win.ymax - win.ymin) / GY
  const vals = new Float64Array((GX + 1) * (GY + 1))
  for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
    try { vals[j * (GX + 1) + i] = fn(win.xmin + i * dx, win.ymin + j * dy) } catch { vals[j * (GX + 1) + i] = NaN }
  }
  const px = x => toPixelX(x, win.xmin, win.xmax, W)
  const py = y => toPixelY(y, win.ymin, win.ymax, H)
  ctx.strokeStyle = color; ctx.lineWidth = 2
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
    const f00 = vals[j * (GX + 1) + i], f10 = vals[j * (GX + 1) + (i + 1)]
    const f01 = vals[(j + 1) * (GX + 1) + i], f11 = vals[(j + 1) * (GX + 1) + (i + 1)]
    if (isNaN(f00) || isNaN(f10) || isNaN(f01) || isNaN(f11)) continue
    const x0 = win.xmin + i * dx, x1 = win.xmin + (i + 1) * dx
    const y0 = win.ymin + j * dy, y1 = win.ymin + (j + 1) * dy
    const pts = []
    if (f00 * f10 < 0) { const t = f00 / (f00 - f10); pts.push([x0 + t * (x1 - x0), y0]) }
    if (f10 * f11 < 0) { const t = f10 / (f10 - f11); pts.push([x1, y0 + t * (y1 - y0)]) }
    if (f01 * f11 < 0) { const t = f01 / (f01 - f11); pts.push([x0 + t * (x1 - x0), y1]) }
    if (f00 * f01 < 0) { const t = f00 / (f00 - f01); pts.push([x0, y0 + t * (y1 - y0)]) }
    if (pts.length === 2) {
      ctx.beginPath(); ctx.moveTo(px(pts[0][0]), py(pts[0][1])); ctx.lineTo(px(pts[1][0]), py(pts[1][1])); ctx.stroke()
    } else if (pts.length === 4) {
      ctx.beginPath(); ctx.moveTo(px(pts[0][0]), py(pts[0][1])); ctx.lineTo(px(pts[3][0]), py(pts[3][1])); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(px(pts[1][0]), py(pts[1][1])); ctx.lineTo(px(pts[2][0]), py(pts[2][1])); ctx.stroke()
    }
  }
}

function drawIntersectionMark(ctx, pixX, pixY, color, label, W, H, locked) {
  if (pixY < -10 || pixY > H + 10) return
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
  ctx.globalAlpha = locked ? 0.65 : 0.4
  ctx.beginPath(); ctx.moveTo(0, pixY); ctx.lineTo(W, pixY); ctx.stroke()
  ctx.setLineDash([]); ctx.globalAlpha = 1
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pixX, pixY, 4, 0, Math.PI * 2); ctx.fill()
  ctx.font = '11px "JetBrains Mono", monospace'
  const tw = ctx.measureText(label).width
  const lx = pixX + 10 + tw > W ? pixX - tw - 10 : pixX + 10
  const ly = Math.max(14, Math.min(pixY, H - 6))
  ctx.fillStyle = 'rgba(15,17,23,0.88)'; ctx.fillRect(lx - 2, ly - 13, tw + 4, 17)
  ctx.fillStyle = color; ctx.fillText(label, lx, ly)
}

function drawCrosshair(canvas, win, curves, mathX, locked) {
  if (!canvas || !win) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H)
  if (mathX === null || mathX < win.xmin || mathX > win.xmax) return
  const pixX = toPixelX(mathX, win.xmin, win.xmax, W)
  ctx.strokeStyle = locked ? 'rgba(229,192,123,0.8)' : 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1; ctx.setLineDash([4, 4])
  ctx.beginPath(); ctx.moveTo(pixX, 0); ctx.lineTo(pixX, H); ctx.stroke()
  ctx.setLineDash([])
  curves.filter(c => !c.isImplicit && c.fn).forEach(({ fn, color }) => {
    let y; try { y = fn(mathX) } catch { return }
    if (!isFinite(y) || isNaN(y)) return
    drawIntersectionMark(ctx, pixX, toPixelY(y, win.ymin, win.ymax, H), color, `(${formatNum(mathX)}, ${formatNum(y)})`, W, H, locked)
  })
  curves.filter(c => c.isImplicit && c.implicitFn).forEach(({ implicitFn, color }) => {
    findImplicitYs(implicitFn, mathX, win).forEach(y =>
      drawIntersectionMark(ctx, pixX, toPixelY(y, win.ymin, win.ymax, H), color, `(${formatNum(mathX)}, ${formatNum(y)})`, W, H, locked))
  })
}

// Trace overlay: uses pre-computed tracePos { x, y } — works for both explicit and implicit.
function drawTrace(canvas, win, curves, tracePos, activeCurveIdx) {
  if (!canvas || !win) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H)
  if (!tracePos) return
  const active = curves[activeCurveIdx % Math.max(curves.length, 1)]
  if (!active) return
  const { x, y } = tracePos
  const pixX = toPixelX(x, win.xmin, win.xmax, W)
  const pixY = toPixelY(y, win.ymin, win.ymax, H)
  ctx.strokeStyle = active.color; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.globalAlpha = 0.55
  ctx.beginPath(); ctx.moveTo(pixX, 0); ctx.lineTo(pixX, H); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, pixY); ctx.lineTo(W, pixY); ctx.stroke()
  ctx.setLineDash([]); ctx.globalAlpha = 1
  ctx.fillStyle = active.color; ctx.beginPath(); ctx.arc(pixX, pixY, 6, 0, Math.PI * 2); ctx.fill()
  const typeTag = active.isImplicit ? ' [impl]' : ''
  const label = `x=${formatNum(x)}   y=${formatNum(y)}${typeTag}`
  ctx.font = 'bold 12px "JetBrains Mono", monospace'
  const tw = ctx.measureText(label).width
  const bx = Math.min(Math.max(pixX - tw / 2, 4), W - tw - 6)
  ctx.fillStyle = 'rgba(15,17,23,0.92)'; ctx.fillRect(bx - 4, 4, tw + 8, 20)
  ctx.fillStyle = active.color; ctx.fillText(label, bx, 19)
  if (curves.length > 1) {
    const hint = `f${active.idx + 1}  ↑↓ switch`
    ctx.font = '10px "JetBrains Mono", monospace'
    const hw = ctx.measureText(hint).width
    ctx.fillStyle = 'rgba(15,17,23,0.85)'; ctx.fillRect(W - hw - 10, 4, hw + 6, 16)
    ctx.fillStyle = '#555B6E'; ctx.fillText(hint, W - hw - 7, 16)
  }
}

function drawGraph(canvas, curves, win, gridSize = 300) {
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth, H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = W * dpr; canvas.height = H * dpr
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr)
  const px = x => toPixelX(x, win.xmin, win.xmax, W)
  const py = y => toPixelY(y, win.ymin, win.ymax, H)
  ctx.fillStyle = '#0F1117'; ctx.fillRect(0, 0, W, H)
  const xscl = win.xscl > 0 ? win.xscl : niceStep(win.xmax - win.xmin)
  const yscl = win.yscl > 0 ? win.yscl : niceStep(win.ymax - win.ymin)
  ctx.strokeStyle = '#1C2030'; ctx.lineWidth = 1
  const xgs = Math.ceil(win.xmin / xscl) * xscl
  for (let x = xgs; x <= win.xmax + xscl * 0.01; x = Math.round((x + xscl) * 1e10) / 1e10) {
    const gx = px(x); ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
  }
  const ygs = Math.ceil(win.ymin / yscl) * yscl
  for (let y = ygs; y <= win.ymax + yscl * 0.01; y = Math.round((y + yscl) * 1e10) / 1e10) {
    const gy = py(y); ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
  }
  ctx.strokeStyle = '#3A3F52'; ctx.lineWidth = 1.5
  if (win.ymin <= 0 && win.ymax >= 0) { const ay = py(0); ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.stroke() }
  if (win.xmin <= 0 && win.xmax >= 0) { const ax = px(0); ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, H); ctx.stroke() }
  const fs = Math.max(9, Math.round(W * 0.022))
  ctx.font = `${fs}px "JetBrains Mono", monospace`; ctx.fillStyle = '#555B6E'; ctx.strokeStyle = '#3A3F52'; ctx.lineWidth = 1
  const axisY = win.ymin <= 0 && win.ymax >= 0 ? py(0) : H
  const axisX = win.xmin <= 0 && win.xmax >= 0 ? px(0) : 0
  ctx.textAlign = 'center'
  for (let x = xgs; x <= win.xmax + xscl * 0.01; x = Math.round((x + xscl) * 1e10) / 1e10) {
    if (Math.abs(x) < xscl * 0.01) continue
    const gx = px(x); ctx.beginPath(); ctx.moveTo(gx, axisY - 3); ctx.lineTo(gx, axisY + 3); ctx.stroke()
    ctx.fillText(Number.isInteger(x) ? String(x) : x.toPrecision(3).replace(/\.?0+$/, ''), gx, Math.min(axisY + fs + 4, H - 2))
  }
  ctx.textAlign = 'right'
  for (let y = ygs; y <= win.ymax + yscl * 0.01; y = Math.round((y + yscl) * 1e10) / 1e10) {
    if (Math.abs(y) < yscl * 0.01) continue
    const gy = py(y); ctx.beginPath(); ctx.moveTo(axisX - 3, gy); ctx.lineTo(axisX + 3, gy); ctx.stroke()
    ctx.fillText(Number.isInteger(y) ? String(y) : y.toPrecision(3).replace(/\.?0+$/, ''), Math.max(axisX - 5, fs * 2), gy + fs * 0.35)
  }
  const SAMPLES = W * 2, MAX_JUMP = H * 2
  curves.filter(c => !c.isImplicit).forEach(({ fn, color }) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath()
    let penDown = false, prevPixY = null
    for (let i = 0; i <= SAMPLES; i++) {
      const mathX = win.xmin + (i / SAMPLES) * (win.xmax - win.xmin)
      let mathY; try { mathY = fn(mathX) } catch { mathY = NaN }
      if (!isFinite(mathY) || isNaN(mathY)) { penDown = false; prevPixY = null; continue }
      const pixX = px(mathX), pixY = py(mathY)
      if (!penDown || (prevPixY !== null && Math.abs(pixY - prevPixY) > MAX_JUMP)) { ctx.moveTo(pixX, pixY); penDown = true }
      else ctx.lineTo(pixX, pixY)
      prevPixY = pixY
    }
    ctx.stroke()
  })
  curves.filter(c => c.isImplicit).forEach(({ implicitFn, color }) => {
    drawImplicitCurve(ctx, implicitFn, win, W, H, color, gridSize)
  })
}

function parseWin(s) {
  const keys = ['xmin', 'xmax', 'ymin', 'ymax', 'xscl', 'yscl'], w = {}
  for (const k of keys) { const v = parseFloat(s[k]); if (isNaN(v)) return null; w[k] = v }
  if (w.xmin >= w.xmax || w.ymin >= w.ymax || w.xscl <= 0 || w.yscl <= 0) return null
  return w
}

const DEFAULT_WIN = { xmin: '-10', xmax: '10', ymin: '-6.2', ymax: '6.2', xscl: '1', yscl: '1' }

// ─────────────────────────────────────────────────────────────────────────────

export default function GraphPanel({ onClose, angleMode = 'deg' }) {
  const [graphDim, setGraphDim] = useState('2d')
  const [fns, setFns] = useState([{ expr: 'sin(x)', visible: true }])
  const [winStr, setWinStr] = useState(DEFAULT_WIN)
  const [splitMode, setSplitMode] = useState(false)
  const [error, setError] = useState(null)
  const [crosshairX, setCrosshairX] = useState(null)
  const [crosshairLocked, setCrosshairLocked] = useState(false)
  const [traceMode, setTraceMode] = useState(false)
  const [traceCurveIdx, setTraceCurveIdx] = useState(0) // indexes ALL compiled curves
  const [tracePos, setTracePos] = useState(null)         // { x, y } on the active curve

  const canvasRefs = useRef([])
  const overlayRefs = useRef([])
  const compiledFnsRef = useRef([])
  const winRef = useRef(null)
  const splitModeRef = useRef(splitMode)
  splitModeRef.current = splitMode

  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const dragStartRef = useRef(null)
  const gestureTimerRef = useRef(null)
  const touchStartRef = useRef(null)

  const visibleFns = fns.map((f, i) => ({ ...f, idx: i })).filter(f => f.visible && f.expr.trim())
  const visibleFnsRef = useRef(visibleFns)
  visibleFnsRef.current = visibleFns

  // ── Direct canvas draw (bypasses React state for gesture smoothness)
  const applyPanZoom = (bounds, draft = true) => {
    const { xmin, xmax, ymin, ymax } = bounds
    const win = { xmin, xmax, ymin, ymax, xscl: niceStep(xmax - xmin), yscl: niceStep(ymax - ymin) }
    winRef.current = win
    const gridSize = draft ? 80 : 300
    const compiled = compiledFnsRef.current
    if (splitModeRef.current) {
      compiled.forEach((entry, i) => { const c = canvasRefs.current[i]; if (c) drawGraph(c, [entry], win, gridSize) })
    } else {
      const c = canvasRefs.current[0]; if (c) drawGraph(c, compiled, win, gridSize)
    }
    overlayRefs.current.forEach(ov => { if (ov) { const ctx = ov.getContext('2d'); if (ctx) ctx.clearRect(0, 0, ov.width, ov.height) } })
  }

  const commitWin = (win) => setWinStr({ xmin: fmtWin(win.xmin), xmax: fmtWin(win.xmax), ymin: fmtWin(win.ymin), ymax: fmtWin(win.ymax), xscl: fmtWin(win.xscl), yscl: fmtWin(win.yscl) })

  const scheduleCommit = (win) => { clearTimeout(gestureTimerRef.current); gestureTimerRef.current = setTimeout(() => commitWin(win), 250) }

  const zoomAround = (mathX, mathY, factor) => {
    const w = winRef.current; if (!w) return
    applyPanZoom({ xmin: mathX + (w.xmin - mathX) * factor, xmax: mathX + (w.xmax - mathX) * factor, ymin: mathY + (w.ymin - mathY) * factor, ymax: mathY + (w.ymax - mathY) * factor }, true)
    scheduleCommit(winRef.current)
  }

  // ── Full-quality replot driven by React state
  const plot = useCallback(() => {
    setError(null)
    const win = parseWin(winStr); if (!win) { setError('Invalid window settings'); return }
    winRef.current = win
    const compiled = []
    for (const { expr, idx } of fns.map((f, i) => ({ ...f, idx: i })).filter(f => f.visible && f.expr.trim())) {
      const parsed = parseExpr(expr.trim()), color = CURVE_COLORS[idx % CURVE_COLORS.length]
      try {
        if (parsed.implicit) compiled.push({ fn: null, implicitFn: compileImplicitFn(parsed.expr, angleMode), isImplicit: true, color, idx })
        else compiled.push({ fn: compileFn(parsed.expr, 'x', angleMode), implicitFn: null, isImplicit: false, color, idx })
      } catch { setError(`f${idx + 1}: invalid expression`); return }
    }
    if (!compiled.length) { setError('No visible functions to plot'); return }
    compiledFnsRef.current = compiled
    trackEvent('graph_plotted', { fn_count: compiled.length, has_implicit: compiled.some(c => c.isImplicit) })
    if (splitMode) { compiled.forEach((e, i) => { const c = canvasRefs.current[i]; if (c) drawGraph(c, [e], win) }) }
    else { const c = canvasRefs.current[0]; if (c) drawGraph(c, compiled, win) }
    setCrosshairX(null); setCrosshairLocked(false); setTraceMode(false); setTracePos(null)
  }, [fns, winStr, angleMode, splitMode])

  useEffect(() => { plot() }, [plot])

  // ── Overlay (crosshair or trace)
  useEffect(() => {
    const win = winRef.current, compiled = compiledFnsRef.current, vfns = visibleFnsRef.current
    if (traceMode) {
      if (splitMode) {
        vfns.forEach(({ idx }, i) => drawTrace(overlayRefs.current[i], win, compiled.filter(c => c.idx === idx), tracePos, 0))
      } else {
        drawTrace(overlayRefs.current[0], win, compiled, tracePos, traceCurveIdx)
      }
    } else {
      if (splitMode) {
        vfns.forEach(({ idx }, i) => drawCrosshair(overlayRefs.current[i], win, compiled.filter(c => c.idx === idx), crosshairX, crosshairLocked))
      } else {
        drawCrosshair(overlayRefs.current[0], win, compiled, crosshairX, crosshairLocked)
      }
    }
  }, [crosshairX, crosshairLocked, traceMode, tracePos, traceCurveIdx, splitMode])

  // ── Keyboard: trace navigation + crosshair lock
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      const compiled = compiledFnsRef.current, win = winRef.current
      if (traceMode) {
        if (!win || !compiled.length) return
        const curve = compiled[traceCurveIdx % compiled.length]
        const step = (win.xmax - win.xmin + win.ymax - win.ymin) / 600
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          const dir = e.key === 'ArrowRight' ? 1 : -1
          if (!tracePos) return
          if (curve.isImplicit) {
            const next = implicitStep(curve.implicitFn, tracePos.x, tracePos.y, step, dir)
            if (next && next.x >= win.xmin && next.x <= win.xmax && next.y >= win.ymin && next.y <= win.ymax) setTracePos(next)
          } else {
            const newX = Math.max(win.xmin, Math.min(win.xmax, tracePos.x + dir * step))
            try { const y = curve.fn(newX); if (isFinite(y)) setTracePos({ x: newX, y }) } catch {}
          }
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const nextIdx = (traceCurveIdx + (e.key === 'ArrowDown' ? 1 : -1) + compiled.length) % compiled.length
          const pos = findInitialTracePos(compiled[nextIdx], win, tracePos?.x, tracePos?.y)
          setTraceCurveIdx(nextIdx); setTracePos(pos)
        }
        if (e.key === 'Escape' || e.key === 't' || e.key === 'T') { setTraceMode(false); setTracePos(null) }
        return
      }
      if (e.key === 't' || e.key === 'T') {
        if (win && compiled.length) { setTraceMode(true); setTraceCurveIdx(0); setTracePos(findInitialTracePos(compiled[0], win)); setCrosshairX(null); setCrosshairLocked(false) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [traceMode, traceCurveIdx, tracePos])

  // ── Wheel: trackpad swipe (pan) or pinch/Ctrl+scroll (zoom)
  const handleWheel = (e, canvas) => {
    e.preventDefault()
    const w = winRef.current; if (!w || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const mathX = w.xmin + ((e.clientX - rect.left) / canvas.clientWidth) * (w.xmax - w.xmin)
    const mathY = w.ymax - ((e.clientY - rect.top) / canvas.clientHeight) * (w.ymax - w.ymin)
    if (e.ctrlKey) {
      zoomAround(mathX, mathY, Math.exp(e.deltaY * 0.01))
    } else {
      const dxM = (e.deltaX / canvas.clientWidth) * (w.xmax - w.xmin)
      const dyM = -(e.deltaY / canvas.clientHeight) * (w.ymax - w.ymin)
      applyPanZoom({ xmin: w.xmin + dxM, xmax: w.xmax + dxM, ymin: w.ymin + dyM, ymax: w.ymax + dyM }, true)
      scheduleCommit(winRef.current)
    }
  }

  // ── Mouse: drag = pan, click = crosshair lock (or trace position update)
  const handleMouseDown = (e, canvas) => {
    if (e.button !== 0 || traceMode) return
    isDraggingRef.current = true; hasDraggedRef.current = false
    dragStartRef.current = { pixX: e.clientX, pixY: e.clientY, win: { ...winRef.current }, canvas }
    e.currentTarget.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e, canvas) => {
    if (isDraggingRef.current && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.pixX, dy = e.clientY - dragStartRef.current.pixY
      if (!hasDraggedRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) hasDraggedRef.current = true
      if (hasDraggedRef.current) {
        const sw = dragStartRef.current.win, c = canvas || dragStartRef.current.canvas
        const W = c.clientWidth, H = c.clientHeight
        applyPanZoom({ xmin: sw.xmin - (dx / W) * (sw.xmax - sw.xmin), xmax: sw.xmax - (dx / W) * (sw.xmax - sw.xmin), ymin: sw.ymin + (dy / H) * (sw.ymax - sw.ymin), ymax: sw.ymax + (dy / H) * (sw.ymax - sw.ymin) }, true)
        return
      }
    }
    if (traceMode) {
      if (!canvas || !winRef.current) return
      const rect = canvas.getBoundingClientRect(), win = winRef.current
      const mathX = win.xmin + ((e.clientX - rect.left) / canvas.clientWidth) * (win.xmax - win.xmin)
      const mathY = win.ymax - ((e.clientY - rect.top) / canvas.clientHeight) * (win.ymax - win.ymin)
      const compiled = compiledFnsRef.current, curve = compiled[traceCurveIdx % compiled.length]
      if (!curve) return
      if (curve.isImplicit) {
        const ys = findImplicitYs(curve.implicitFn, mathX, win)
        if (ys.length) {
          const nearY = tracePos?.y ?? mathY
          setTracePos({ x: mathX, y: ys.reduce((b, yy) => Math.abs(yy - nearY) < Math.abs(b - nearY) ? yy : b, ys[0]) })
        }
      } else {
        try { const y = curve.fn(mathX); if (isFinite(y) && !isNaN(y)) setTracePos({ x: mathX, y }) } catch {}
      }
      return
    }
    if (crosshairLocked || !canvas || !winRef.current) return
    const rect = canvas.getBoundingClientRect(), win = winRef.current
    setCrosshairX(win.xmin + ((e.clientX - rect.left) / canvas.clientWidth) * (win.xmax - win.xmin))
  }

  const handleMouseUp = (e) => {
    if (!isDraggingRef.current) return
    const wasDrag = hasDraggedRef.current
    isDraggingRef.current = false; hasDraggedRef.current = false
    e.currentTarget.style.cursor = 'crosshair'
    if (wasDrag) { scheduleCommit(winRef.current) }
    else if (!traceMode && (crosshairX !== null || crosshairLocked)) { setCrosshairLocked(prev => !prev) }
  }

  const handleMouseLeave = (e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      if (hasDraggedRef.current) scheduleCommit(winRef.current)
      hasDraggedRef.current = false
      if (e.currentTarget) e.currentTarget.style.cursor = 'crosshair'
      return
    }
    if (traceMode) return
    if (!crosshairLocked) setCrosshairX(null)
  }

  // ── Touch: 1-finger pan, 2-finger pinch
  const handleTouchStart = (e, canvas) => {
    e.preventDefault()
    touchStartRef.current = { touches: Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY })), win: { ...winRef.current }, canvas }
  }
  const handleTouchMove = (e, canvas) => {
    e.preventDefault()
    const ts = touchStartRef.current; if (!ts) return
    const cur = Array.from(e.touches), sw = ts.win, W = canvas.clientWidth, H = canvas.clientHeight
    if (cur.length === 1) {
      const dx = cur[0].clientX - ts.touches[0].x, dy = cur[0].clientY - ts.touches[0].y
      applyPanZoom({ xmin: sw.xmin - (dx / W) * (sw.xmax - sw.xmin), xmax: sw.xmax - (dx / W) * (sw.xmax - sw.xmin), ymin: sw.ymin + (dy / H) * (sw.ymax - sw.ymin), ymax: sw.ymax + (dy / H) * (sw.ymax - sw.ymin) }, true)
    } else if (cur.length === 2 && ts.touches.length >= 2) {
      const sd = Math.hypot(ts.touches[1].x - ts.touches[0].x, ts.touches[1].y - ts.touches[0].y)
      const cd = Math.hypot(cur[1].clientX - cur[0].clientX, cur[1].clientY - cur[0].clientY)
      if (sd < 1) return
      const factor = sd / cd
      const rect = canvas.getBoundingClientRect()
      const mx = (ts.touches[0].x + ts.touches[1].x) / 2, my = (ts.touches[0].y + ts.touches[1].y) / 2
      const mmx = sw.xmin + ((mx - rect.left) / W) * (sw.xmax - sw.xmin)
      const mmy = sw.ymax - ((my - rect.top) / H) * (sw.ymax - sw.ymin)
      applyPanZoom({ xmin: mmx + (sw.xmin - mmx) * factor, xmax: mmx + (sw.xmax - mmx) * factor, ymin: mmy + (sw.ymin - mmy) * factor, ymax: mmy + (sw.ymax - mmy) * factor }, true)
    }
  }
  const handleTouchEnd = () => { scheduleCommit(winRef.current); touchStartRef.current = null }

  // ── Reset / Fit / Square
  const handleReset = () => { setWinStr(DEFAULT_WIN) }

  const handleFit = () => {
    const bounds = findPlotBounds(compiledFnsRef.current)
    if (!bounds) return
    applyPanZoom(bounds, false)
    commitWin(bounds)
  }

  const handleSquareAxes = () => {
    const canvas = canvasRefs.current[0]
    if (!canvas || !canvas.clientWidth || !canvas.clientHeight) return
    const win = parseWin(winStr); if (!win) return
    const W = canvas.clientWidth, H = canvas.clientHeight
    const xrange = win.xmax - win.xmin, ycenter = (win.ymin + win.ymax) / 2
    const yrange = xrange * H / W
    setWinStr(w => ({ ...w, ymin: fmtWin(ycenter - yrange / 2), ymax: fmtWin(ycenter + yrange / 2) }))
  }

  const updateFn = (i, patch) => setFns(prev => prev.map((f, j) => j === i ? { ...f, ...patch } : f))

  const WIN_FIELDS = [['xmin', 'Xmin'], ['xmax', 'Xmax'], ['ymin', 'Ymin'], ['ymax', 'Ymax'], ['xscl', 'Xscl'], ['yscl', 'Yscl']]

  const wrapperEvents = (idx) => ({
    onMouseDown: e => handleMouseDown(e, canvasRefs.current[idx]),
    onMouseMove: e => handleMouseMove(e, canvasRefs.current[idx]),
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onWheel: e => handleWheel(e, canvasRefs.current[idx]),
    onTouchStart: e => handleTouchStart(e, canvasRefs.current[idx]),
    onTouchMove: e => handleTouchMove(e, canvasRefs.current[idx]),
    onTouchEnd: handleTouchEnd,
    style: { cursor: traceMode ? 'none' : 'crosshair' },
  })

  const enterTrace = () => {
    const win = winRef.current, compiled = compiledFnsRef.current
    if (win && compiled.length) { setTraceMode(true); setTraceCurveIdx(0); setTracePos(findInitialTracePos(compiled[0], win)); setCrosshairX(null); setCrosshairLocked(false) }
  }

  return (
    <div className="overlay graph-overlay">
      <div className="ov-head">
        <h3>Graph</h3>
        <div className="graph-dim-toggle">
          <button className={`graph-dim-btn${graphDim === '2d' ? ' active' : ''}`} onClick={() => setGraphDim('2d')}>2D</button>
          <button className={`graph-dim-btn${graphDim === '3d' ? ' active' : ''}`} onClick={() => setGraphDim('3d')}>3D</button>
        </div>
        <span className="tbl-mode-badge">{angleMode.toUpperCase()}</span>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      {graphDim === '3d' ? <GraphPanel3D angleMode={angleMode} /> : (<>
      <div className="graph-fns">
        {fns.map(({ expr, visible }, i) => {
          const { implicit } = parseExpr(expr.trim())
          return (
            <div key={i} className={`graph-fn-row${visible ? '' : ' graph-fn-hidden'}`}>
              <span className="graph-fn-label" style={{ color: visible ? CURVE_COLORS[i % CURVE_COLORS.length] : '#555B6E' }}>f{i + 1}({implicit ? 'x,y' : 'x'})</span>
              <input className="graph-fn-input" value={expr} placeholder={implicit ? 'e.g. x^2 + y^2 = 4' : 'e.g. sin(x)  or  x^2 + y^2 = 4'} onChange={e => updateFn(i, { expr: e.target.value })} onKeyDown={e => e.key === 'Enter' && plot()} />
              <button className={`graph-fn-eye${visible ? ' active' : ''}`} onClick={() => updateFn(i, { visible: !visible })} title={visible ? 'Hide' : 'Show'}>{visible ? '●' : '○'}</button>
              {fns.length > 1 && <button className="graph-fn-remove" onClick={() => setFns(prev => prev.filter((_, j) => j !== i))} aria-label="Remove">×</button>}
            </div>
          )
        })}
        <button className="graph-fn-add" onClick={() => setFns(prev => [...prev, { expr: '', visible: true }])}>+ add function</button>
        <p className="graph-fn-tip">label shows f(x,y) when y or = detected — plots implicit curves (circles, ellipses, hyperbolas)</p>
      </div>

      <div className="graph-win">
        {WIN_FIELDS.map(([k, label]) => (
          <label key={k} className="graph-win-field">
            <span>{label}</span>
            <input className="tbl-num" value={winStr[k]} onChange={e => setWinStr(w => ({ ...w, [k]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && plot()} />
          </label>
        ))}
        <div className="graph-view-toggle">
          <button className={`graph-view-btn${!splitMode ? ' active' : ''}`} onClick={() => setSplitMode(false)}>combined</button>
          <button className={`graph-view-btn${splitMode ? ' active' : ''}`} onClick={() => setSplitMode(true)}>split</button>
          <button className="graph-view-btn" onClick={handleSquareAxes} title="Equal scale on both axes">1:1</button>
          <button className="graph-view-btn" onClick={handleReset} title="Reset to default window">RESET</button>
          <button className="graph-view-btn" onClick={handleFit} title="Fit window to visible plots">FIT</button>
        </div>
        <button className="ov-close tbl-go" onClick={plot}>plot</button>
        <button className={`graph-view-btn graph-trace-btn${traceMode ? ' active' : ''}`} onClick={() => { if (traceMode) { setTraceMode(false); setTracePos(null) } else enterTrace() }} title="Trace mode (T)">TRACE</button>
        <span className="graph-crosshair-hint">
          {traceMode ? '← → step · ↑ ↓ curve · Esc exit' : crosshairLocked ? 'click to unlock' : 'scroll/pinch zoom · drag pan · click lock'}
        </span>
      </div>

      {error && <div className="ov-note tbl-error">{error}</div>}

      {splitMode ? (
        <div className="graph-split-grid" style={{ gridTemplateColumns: visibleFns.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}>
          {visibleFns.map(({ idx }, i) => {
            const { implicit } = parseExpr(fns[idx]?.expr?.trim() ?? '')
            return (
              <div key={idx} className="graph-subplot">
                <span className="graph-subplot-label" style={{ color: CURVE_COLORS[idx % CURVE_COLORS.length] }}>f{idx + 1}({implicit ? 'x,y' : 'x'})</span>
                <div className="graph-subplot-canvas-wrapper" {...wrapperEvents(i)}>
                  <canvas ref={el => { canvasRefs.current[i] = el }} className="graph-subplot-canvas" />
                  <canvas ref={el => { overlayRefs.current[i] = el }} className="graph-crosshair-overlay" />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="graph-canvas-wrapper" {...wrapperEvents(0)}>
          <canvas ref={el => { canvasRefs.current[0] = el }} className="graph-canvas" />
          <canvas ref={el => { overlayRefs.current[0] = el }} className="graph-crosshair-overlay" />
        </div>
      )}
      </>)}
    </div>
  )
}
