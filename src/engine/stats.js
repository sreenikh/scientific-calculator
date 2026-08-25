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

export function mode(xs) {
  if (xs.length === 0) return []
  const freq = new Map()
  for (const x of xs) freq.set(x, (freq.get(x) || 0) + 1)
  const maxFreq = Math.max(...freq.values())
  if (maxFreq === 1) return []
  return [...freq.entries()]
    .filter(([, c]) => c === maxFreq)
    .map(([v]) => v)
    .sort((a, b) => a - b)
}

export function oneVarStats(data) {
  const xs = data.map(Number).filter(isFinite)
  const n = xs.length
  if (n === 0) return { ok: false, error: 'No valid data' }
  const sorted = [...xs].sort((a, b) => a - b)
  const sum = xs.reduce((s, x) => s + x, 0)
  const mean = sum / n
  const variance = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / n
  const stddev = Math.sqrt(variance)
  const q1 = percentile(sorted, 25)
  const q3 = percentile(sorted, 75)
  const sampleVariance = n > 1 ? variance * n / (n - 1) : NaN
  const sampleStddev = Math.sqrt(sampleVariance)

  const skewness = (n >= 3 && sampleStddev > 0)
    ? xs.reduce((s, x) => s + ((x - mean) / sampleStddev) ** 3, 0)
      * n / ((n - 1) * (n - 2))
    : NaN

  const kurtosis = (n >= 4 && sampleStddev > 0)
    ? xs.reduce((s, x) => s + ((x - mean) / sampleStddev) ** 4, 0)
      * (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))
      - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3))
    : NaN

  return {
    ok: true, n,
    sum, sumx2: xs.reduce((s, x) => s + x * x, 0),
    mean, median: percentile(sorted, 50), mode: mode(xs),
    q1, q3, iqr: q3 - q1,
    range: sorted[n - 1] - sorted[0],
    stddev, variance,
    sampleStddev, sampleVariance,
    cv:  Math.abs(mean) > 1e-12 ? sampleStddev / mean : NaN,
    sem: n > 1 ? sampleStddev / Math.sqrt(n) : NaN,
    skewness, kurtosis,
    min: sorted[0], max: sorted[n - 1],
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

// Multiple linear regression: y = b0 + b1*x1 + b2*x2 + ... + bk*xk
// data: array of rows; each row is [x1, x2, ..., xk, y] (all numeric, length k+1)
export function multiVarStats(data, k) {
  const valid = data.filter(row => row.length === k + 1 && row.every(v => isFinite(v)))
  const n = valid.length
  const minPoints = k + 2
  if (n < minPoints) return { ok: false, error: `Need at least ${minPoints} data points for ${k}-predictor regression` }

  const p = k + 1
  // Design matrix rows: [1, x1, x2, ..., xk]
  const X = valid.map(row => [1, ...row.slice(0, k)])
  const y = valid.map(row => row[k])

  // XtX (p x p) and Xty (p x 1) via normal equations
  const XtX = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0)
    )
  )
  const Xty = Array.from({ length: p }, (_, i) =>
    X.reduce((s, row, ri) => s + row[i] * y[ri], 0)
  )

  const sol = solveLinearSystem(XtX, Xty)
  if (!sol.ok) return { ok: false, error: 'Cannot fit: predictors may be collinear' }

  const coeffs = sol.solution   // [b0, b1, ..., bk]

  const yMean = y.reduce((s, v) => s + v, 0) / n
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    const yHat = X[i].reduce((s, x, j) => s + x * coeffs[j], 0)
    ssTot += (y[i] - yMean) ** 2
    ssRes += (y[i] - yHat) ** 2
  }
  const r2    = ssTot < 1e-12 ? 1 : 1 - ssRes / ssTot
  const adjR2 = n > k + 1 ? 1 - (1 - r2) * (n - 1) / (n - k - 1) : NaN

  return { ok: true, k, n, coeffs, r2, adjR2 }
}
