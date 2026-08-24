import { create, all } from 'mathjs'

export const math = create(all, {})

// DEG mode converts degrees to radians on input and back on output.
function buildScope(angleMode, vars) {
  const toRad = (x) => (angleMode === 'deg' ? (x * Math.PI) / 180 : x)
  const toOut = (rad) => (angleMode === 'deg' ? (rad * 180) / Math.PI : rad)

  const processedVars = {}
  for (const [k, v] of Object.entries(vars)) {
    if (!Array.isArray(v)) {
      processedVars[k] = v
    } else if (v.length === 1 && Array.isArray(v[0])) {
      // 1xN stored matrix: flatten to a 1D array so dot/norm/cross work
      processedVars[k] = v[0]
    } else if (v.length > 0 && Array.isArray(v[0]) && v[0].length === 1) {
      // Nx1 stored matrix: flatten to a 1D column vector
      processedVars[k] = v.map(row => row[0])
    } else {
      processedVars[k] = math.matrix(v)
    }
  }

  return {
    sin: (x) => Math.sin(toRad(x)),
    cos: (x) => Math.cos(toRad(x)),
    tan: (x) => Math.tan(toRad(x)),
    sec: (x) => 1 / Math.cos(toRad(x)),
    csc: (x) => 1 / Math.sin(toRad(x)),
    cot: (x) => 1 / Math.tan(toRad(x)),
    asin:   (x) => toOut(Math.asin(x)),
    acos:   (x) => toOut(Math.acos(x)),
    atan:   (x) => toOut(Math.atan(x)),
    arcsin: (x) => toOut(Math.asin(x)),
    arccos: (x) => toOut(Math.acos(x)),
    arctan: (x) => toOut(Math.atan(x)),
    asec:   (x) => toOut(Math.acos(1 / x)),
    acsc:   (x) => toOut(Math.asin(1 / x)),
    acot:   (x) => toOut(Math.atan(1 / x)),
    log:  (x) => Math.log10(x),
    ln:   (x) => Math.log(x),
    logb: (x, b) => Math.log(x) / Math.log(b),
    nPr: (n, r) => math.permutations(n, r),
    nCr: (n, r) => math.combinations(n, r),
    polar: (r, theta) => math.complex(r * Math.cos(toRad(theta)), r * Math.sin(toRad(theta))),
    arg:   (z) => toOut(math.arg(z)),
    ...processedVars,
  }
}

export function normalizeExpression(raw) {
  return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/·/g, '*')
    .replace(/π/g, 'pi')
    .replace(/root\(([^()]+)\)\(([^()]+)\)/g, 'nthRoot($2, $1)')
    .replace(/log _\(([^()]+)\)\(([^()]+)\)/g, 'logb($2, $1)')
    .replace(/log _(\w+)\(([^()]+)\)/g, 'logb($2, $1)')
    .replace(/n P r ?\(([^)]+)\)/g, 'nPr($1)')
    .replace(/n C r ?\(([^)]+)\)/g, 'nCr($1)')
    .replace(/\bi n v \(/g, 'inv(')
    .replace(/\bd e t \(/g, 'det(')
    .replace(/\bt r a c e \(/g, 'trace(')
    .replace(/\bt r a n s p o s e \(/g, 'transpose(')
    .replace(/\bs i z e \(/g, 'size(')
    .replace(/\bd o t \(/g, 'dot(')
    .replace(/\bc r o s s \(/g, 'cross(')
    .replace(/\bn o r m \(/g, 'norm(')
    .replace(/\bp o l a r \(/g, 'polar(')
    .replace(/\ba b s \(/g, 'abs(')
    .replace(/\ba r g \(/g, 'arg(')
    .replace(/\bc o n j \(/g, 'conj(')
    .replace(/\br e \(/g, 're(')
    .replace(/\bi m \(/g, 'im(')
    .replace(/\bA n s\b/g, 'Ans')
    .trim()
}

export function evaluateExpression(rawExpr, { angleMode = 'deg', vars = {}, complexMode = 'rect' } = {}) {
  const expr = normalizeExpression(rawExpr)
  if (!expr) return { ok: false, error: 'Empty expression' }
  if (/root\(\(\)/.test(expr)) return { ok: false, error: 'Enter the root degree (e.g. 3 for cube root)' }
  if (/\broot\(/.test(expr)) return { ok: false, error: 'Enter the radicand inside the root symbol' }
  if (/log _\(\(\)\)/.test(expr)) return { ok: false, error: 'Enter the log base' }

  try {
    const scope = buildScope(angleMode, vars)
    const value = math.evaluate(expr, scope)
    if (value === undefined) return { ok: false, error: 'Nothing to evaluate' }
    const type = math.typeOf(value)
    const isComplex = type === 'Complex'
    const isMatrix = type === 'DenseMatrix' || type === 'SparseMatrix'
    return { ok: true, value, display: formatValue(value, angleMode, complexMode), isComplex, isMatrix }
  } catch (err) {
    return { ok: false, error: humanizeError(err) }
  }
}

function formatNum(n) {
  if (Number.isNaN(n)) return 'undefined'
  if (!isFinite(n)) return n > 0 ? '∞' : '-∞'
  return math.format(n, { precision: 10 })
}

export function formatValue(value, angleMode = 'deg', complexMode = 'rect') {
  try {
    const type = math.typeOf(value)

    if (type === 'Complex') {
      const re = value.re
      const im = value.im
      if (complexMode === 'polar') {
        const r = Math.sqrt(re * re + im * im)
        let theta = Math.atan2(im, re)
        if (angleMode === 'deg') theta = (theta * 180) / Math.PI
        const unit = angleMode === 'deg' ? '°' : ' rad'
        return `${formatNum(r)}∠${formatNum(theta)}${unit}`
      }
      if (Math.abs(im) < 1e-10) return formatNum(re)
      if (Math.abs(re) < 1e-10) {
        if (im === 1) return 'i'
        if (im === -1) return '-i'
        return `${formatNum(im)}i`
      }
      const sign = im < 0 ? ' - ' : ' + '
      const absIm = Math.abs(im)
      const imStr = absIm === 1 ? 'i' : `${formatNum(absIm)}i`
      return `${formatNum(re)}${sign}${imStr}`
    }

    if (type === 'DenseMatrix' || type === 'SparseMatrix') {
      const arr = value.toArray()
      if (Array.isArray(arr[0])) {
        // 2D matrix - format as rows on separate lines
        return arr
          .map(row => '[' + row.map(v => math.format(v, { precision: 6 })).join('  ') + ']')
          .join('\n')
      }
      // 1D result (e.g. eigenvalue array)
      return arr.map(v => math.format(v, { precision: 8 })).join('\n')
    }

    if (typeof value === 'number') {
      if (Number.isNaN(value)) return 'undefined'
      if (!isFinite(value)) return value > 0 ? '∞' : '-∞'
      return math.format(value, { precision: 12 })
    }

    return math.format(value, { precision: 12 })
  } catch {
    return String(value)
  }
}

function humanizeError(err) {
  const msg = err.message || String(err)
  if (/Undefined symbol/i.test(msg)) return 'Undefined variable or function'
  if (/Unexpected end of expression/i.test(msg)) return 'Incomplete expression'
  if (/Parenthesis/i.test(msg)) return 'Incomplete expression'
  if (/Value expected/i.test(msg)) return 'Syntax error'
  if (/dimension mismatch/i.test(msg)) return 'Dimension mismatch'
  if (/Vectors with length 3 expected/i.test(msg)) return 'cross() requires 3-component vectors (store as 1x3 in matrix panel)'
  if (/Expected a column vector/i.test(msg)) return 'Vector operation requires a 1-row stored variable'
  if (/division by zero/i.test(msg) || /Infinity/i.test(msg)) return 'Math error: division by zero'
  return msg
}
