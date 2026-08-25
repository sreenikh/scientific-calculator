import { solveLinearSystem } from './numeric'

// Linear interpolation percentile. p is 0-100. sorted must be pre-sorted ascending.
export function percentile(sorted, p) {
  const n = sorted.length
  if (n === 0) return NaN
  if (p <= 0) return sorted[0]
  if (p >= 100) return sorted[n - 1]
  const idx = (p / 100) * (n - 1)
  const lo = Math.floor(idx)
  const frac = idx - lo
  return frac === 0 ? sorted[lo] : sorted[lo] * (1 - frac) + sorted[lo + 1] * frac
}

export function oneVarStats(data) {
  const xs = data.map(Number).filter(isFinite)
  const n = xs.length
  if (n === 0) return { ok: false, error: 'No valid data' }
  const sorted = [...xs].sort((a, b) => a - b)
  const sum = xs.reduce((s, x) => s + x, 0)
  const mean = sum / n
  const variance = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / n
  return {
    ok: true, n, sum, mean,
    median: percentile(sorted, 50),
    stddev: Math.sqrt(variance), variance,
    min: sorted[0], max: sorted[n - 1],
    q1: percentile(sorted, 25),
    q3: percentile(sorted, 75),
    sorted,
  }
}

function linearFit(xs, ys) {
  const n = xs.length
  const sx  = xs.reduce((s, x) => s + x, 0)
  const sy  = ys.reduce((s, y) => s + y, 0)
  const sxy = xs.reduce((s, x, i) => s + x * ys[i], 0)
  const sx2 = xs.reduce((s, x) => s + x * x, 0)
  const sy2 = ys.reduce((s, y) => s + y * y, 0)
  const den = n * sx2 - sx * sx
  if (Math.abs(den) < 1e-12) return null
  const b = (n * sxy - sx * sy) / den
  const a = (sy - b * sx) / n
  const rDen = Math.sqrt(Math.abs(den) * Math.abs(n * sy2 - sy * sy))
  const r = rDen < 1e-12 ? 1 : (n * sxy - sx * sy) / rDen
  return { a, b, r, r2: r * r }
}

function r2FromResiduals(xs, ys, predict) {
  const n = xs.length
  const yMean = ys.reduce((s, y) => s + y, 0) / n
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    ssTot += (ys[i] - yMean) ** 2
    ssRes += (ys[i] - predict(xs[i])) ** 2
  }
  return ssTot < 1e-12 ? 1 : 1 - ssRes / ssTot
}

export function twoVarStats(xs, ys, model = 'linear') {
  const n = xs.length
  if (n < 2) return { ok: false, error: 'Need at least 2 data points' }

  if (model === 'linear') {
    const fit = linearFit(xs, ys)
    if (!fit) return { ok: false, error: 'Cannot fit: all x values are identical' }
    return { ok: true, model, ...fit }
  }

  if (model === 'quadratic') {
    if (n < 3) return { ok: false, error: 'Quadratic fit needs at least 3 points' }
    const sx1 = xs.reduce((s, x) => s + x, 0)
    const sx2 = xs.reduce((s, x) => s + x ** 2, 0)
    const sx3 = xs.reduce((s, x) => s + x ** 3, 0)
    const sx4 = xs.reduce((s, x) => s + x ** 4, 0)
    const sy  = ys.reduce((s, y) => s + y, 0)
    const sxy = xs.reduce((s, x, i) => s + x * ys[i], 0)
    const sx2y = xs.reduce((s, x, i) => s + x ** 2 * ys[i], 0)
    const A = [[n, sx1, sx2], [sx1, sx2, sx3], [sx2, sx3, sx4]]
    const b = [sy, sxy, sx2y]
    const sol = solveLinearSystem(A, b)
    if (!sol.ok) return { ok: false, error: 'Cannot fit quadratic: ' + sol.error }
    const [a, bCoef, c] = sol.solution
    const r2 = r2FromResiduals(xs, ys, x => a + bCoef * x + c * x * x)
    return { ok: true, model, a, b: bCoef, c, r2 }
  }

  if (model === 'exponential') {
    if (ys.some(y => y <= 0)) return { ok: false, error: 'Exponential model requires all y > 0' }
    const fit = linearFit(xs, ys.map(y => Math.log(y)))
    if (!fit) return { ok: false, error: 'Cannot fit: all x values are identical' }
    return { ok: true, model, a: Math.exp(fit.a), b: fit.b, r: fit.r, r2: fit.r2 }
  }

  if (model === 'power') {
    if (xs.some(x => x <= 0)) return { ok: false, error: 'Power model requires all x > 0' }
    if (ys.some(y => y <= 0)) return { ok: false, error: 'Power model requires all y > 0' }
    const fit = linearFit(xs.map(x => Math.log(x)), ys.map(y => Math.log(y)))
    if (!fit) return { ok: false, error: 'Cannot fit: all x values are identical' }
    return { ok: true, model, a: Math.exp(fit.a), b: fit.b, r: fit.r, r2: fit.r2 }
  }

  return { ok: false, error: 'Unknown model' }
}
