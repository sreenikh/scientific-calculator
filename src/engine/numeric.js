import { math, normalizeExpression } from './mathEngine'

function angleScopeFor(angleMode) {
  const toRad = (x) => angleMode === 'deg' ? x * Math.PI / 180 : x
  const toOut = (r) => angleMode === 'deg' ? r * 180 / Math.PI : r
  return {
    sin: (x) => Math.sin(toRad(x)),
    cos: (x) => Math.cos(toRad(x)),
    tan: (x) => Math.tan(toRad(x)),
    sec: (x) => 1 / Math.cos(toRad(x)),
    csc: (x) => 1 / Math.sin(toRad(x)),
    cot: (x) => 1 / Math.tan(toRad(x)),
    asin: (x) => toOut(Math.asin(x)),
    acos: (x) => toOut(Math.acos(x)),
    atan: (x) => toOut(Math.atan(x)),
    arcsin: (x) => toOut(Math.asin(x)),
    arccos: (x) => toOut(Math.acos(x)),
    arctan: (x) => toOut(Math.atan(x)),
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    log: (x) => Math.log10(x),
    ln:  (x) => Math.log(x),
    logb: (x, b) => Math.log(x) / Math.log(b),
  }
}

// Compiles "x^3 - 2x" into a callable f(x). Throws if the expression is invalid.
export function compileFn(exprString, varName = 'x', angleMode = 'rad') {
  const expr = normalizeExpression(exprString)
  const node = math.parse(expr)
  const code = node.compile()
  const base = angleScopeFor(angleMode)
  return (xVal) => code.evaluate({ ...base, [varName]: xVal })
}

// Compiles an implicit equation "LHS = RHS" into F(x,y) = LHS - RHS.
// If no = sign, treats the whole expression as F(x,y) = 0.
export function compileImplicitFn(exprString, angleMode = 'rad') {
  const raw = exprString.trim()
  const eqIdx = raw.indexOf('=')
  const combined = eqIdx >= 0
    ? `(${raw.slice(0, eqIdx).trim()}) - (${raw.slice(eqIdx + 1).trim()})`
    : raw
  const code = math.parse(normalizeExpression(combined)).compile()
  const scope = { ...angleScopeFor(angleMode), x: 0, y: 0 }
  return (x, y) => { scope.x = x; scope.y = y; return code.evaluate(scope) }
}

export function derivativeAt(fn, x, h = 1e-5) {
  return (fn(x + h) - fn(x - h)) / (2 * h)
}

// Composite Simpson's rule
export function integrate(fn, a, b, n = 200) {
  if (n % 2 !== 0) n += 1
  const h = (b - a) / n
  let sum = fn(a) + fn(b)
  for (let i = 1; i < n; i++) {
    sum += fn(a + i * h) * (i % 2 === 0 ? 2 : 4)
  }
  return (sum * h) / 3
}

export function newtonRaphson(fn, x0, { maxIter = 50, tol = 1e-10, h = 1e-6 } = {}) {
  const steps = []
  let x = x0
  for (let i = 0; i < maxIter; i++) {
    const fx = fn(x)
    const fpx = derivativeAt(fn, x, h)
    steps.push({ n: i, x, fx, fpx })
    if (Math.abs(fx) < tol) return { ok: true, root: x, steps }
    if (fpx === 0) return { ok: false, error: 'Derivative is zero - try secant or bisection', steps }
    x = x - fx / fpx
  }
  return { ok: false, error: 'Did not converge in max iterations', steps }
}

export function secant(fn, x0, x1, { maxIter = 50, tol = 1e-10 } = {}) {
  const steps = [{ n: 0, x: x0, fx: fn(x0) }, { n: 1, x: x1, fx: fn(x1) }]
  let a = x0, b = x1
  for (let i = 0; i < maxIter; i++) {
    const fa = fn(a), fb = fn(b)
    if (fb - fa === 0) return { ok: false, error: 'Secant is flat - try different starting points', steps }
    const c = b - (fb * (b - a)) / (fb - fa)
    steps.push({ n: i + 2, x: c, fx: fn(c) })
    if (Math.abs(fn(c)) < tol) return { ok: true, root: c, steps }
    a = b
    b = c
  }
  return { ok: false, error: 'Did not converge in max iterations', steps }
}

export function bisection(fn, a, b, { maxIter = 50, tol = 1e-10 } = {}) {
  let fa = fn(a), fb = fn(b)
  if (fa * fb > 0) {
    return { ok: false, error: 'f(a) and f(b) must have opposite signs', steps: [] }
  }
  const steps = []
  for (let i = 0; i < maxIter; i++) {
    const mid = (a + b) / 2
    const fm = fn(mid)
    steps.push({ n: i, a, b, mid, fm })
    if (Math.abs(fm) < tol || (b - a) / 2 < tol) return { ok: true, root: mid, steps }
    if (fa * fm < 0) { b = mid } else { a = mid; fa = fm }
  }
  return { ok: false, error: 'Did not converge in max iterations', steps }
}

// Closed-form roots for real quadratics/cubics/quartics (poly-solv).
// coeffs are highest-degree first, e.g. [1, -3, 2] for x^2 - 3x + 2.
export function polyRoots(coeffs) {
  const degree = coeffs.length - 1
  if (degree === 1) {
    const [a, b] = coeffs
    return [math.complex(-b / a, 0)]
  }
  if (degree === 2) {
    const [a, b, c] = coeffs
    const disc = math.complex(b * b - 4 * a * c, 0)
    const sqrtDisc = math.sqrt(disc)
    const r1 = math.divide(math.add(math.multiply(-1, b), sqrtDisc), 2 * a)
    const r2 = math.divide(math.subtract(math.multiply(-1, b), sqrtDisc), 2 * a)
    return [r1, r2]
  }
  // Cubic and higher: Durand-Kerner (Weierstrass) simultaneous root finder.
  // More reliable than companion-matrix eigs when roots share equal magnitude
  // (e.g. x^3 - 5), where QR iteration fails to converge.
  const n = degree
  const monic = coeffs.map(c => c / coeffs[0])

  function evalPoly(z) {
    let r = math.complex(0, 0)
    for (const c of monic) r = math.add(math.multiply(r, z), math.complex(c, 0))
    return r
  }

  // Initial points: (0.4+0.9i)^k scaled to the geometric-mean root magnitude
  const scale = Math.max(1, Math.pow(Math.abs(monic[n]), 1 / n))
  const base = math.complex(0.4, 0.9)
  let roots = Array.from({ length: n }, (_, k) => math.multiply(math.pow(base, k), scale))

  for (let iter = 0; iter < 300; iter++) {
    const next = roots.map((zi, i) => {
      const pz = evalPoly(zi)
      let denom = math.complex(1, 0)
      for (let j = 0; j < n; j++) {
        if (j !== i) denom = math.multiply(denom, math.subtract(zi, roots[j]))
      }
      if (math.abs(denom) < 1e-30) return zi
      return math.subtract(zi, math.divide(pz, denom))
    })
    const maxChange = roots.reduce((m, _, i) =>
      Math.max(m, math.abs(math.subtract(next[i], roots[i]))), 0)
    roots = next
    if (maxChange < 1e-12) break
  }
  return roots
}

// Gaussian elimination with partial pivoting for 2x2 / 3x3 (sys-solv).
export function solveLinearSystem(A, b) {
  const n = A.length
  const M = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row
    }
    if (Math.abs(M[pivot][col]) < 1e-12) {
      return { ok: false, error: 'System has no unique solution' }
    }
    ;[M[col], M[pivot]] = [M[pivot], M[col]]

    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = M[row][col] / M[col][col]
      for (let k = col; k <= n; k++) {
        M[row][k] -= factor * M[col][k]
      }
    }
  }

  const solution = M.map((row, i) => row[n] / row[i])
  return { ok: true, solution }
}
