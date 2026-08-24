import { create, all } from 'mathjs'

export const math = create(all, {})

// DEG mode converts degrees to radians on input and back on output.
function buildScope(angleMode, vars) {
  const toRad = (x) => (angleMode === 'deg' ? (x * Math.PI) / 180 : x)
  const toOut = (rad) => (angleMode === 'deg' ? (rad * 180) / Math.PI : rad)

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
    // \arcsin serialises to 'arcsin' in MathLive ascii-math
    arcsin: (x) => toOut(Math.asin(x)),
    arccos: (x) => toOut(Math.acos(x)),
    arctan: (x) => toOut(Math.atan(x)),
    asec:   (x) => toOut(Math.acos(1 / x)),
    acsc:   (x) => toOut(Math.asin(1 / x)),
    acot:   (x) => toOut(Math.atan(1 / x)),
    // log = log10 to match calculator convention; math.js defaults to ln
    log:  (x) => Math.log10(x),
    ln:   (x) => Math.log(x),
    logb: (x, b) => Math.log(x) / Math.log(b),
    nPr: (n, r) => math.permutations(n, r),
    nCr: (n, r) => math.combinations(n, r),
    ...vars,
  }
}

// Normalize MathLive ascii-math output (and pasted input) to valid math.js syntax.
export function normalizeExpression(raw) {
  return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/·/g, '*')
    .replace(/π/g, 'pi')
    // MathLive emits root(n)(x) for nth roots; map to nthRoot(radicand, index)
    .replace(/root\(([^()]+)\)\(([^()]+)\)/g, 'nthRoot($2, $1)')
    // log _n(x) or log _(n)(x) from MathLive -> logb(x, n)
    .replace(/log _\(([^()]+)\)\(([^()]+)\)/g, 'logb($2, $1)')
    .replace(/log _(\w+)\(([^()]+)\)/g, 'logb($2, $1)')
    // \operatorname{nPr/nCr} emits 'n P r (n,r)' / 'n C r (n,r)' in ascii-math
    .replace(/n P r ?\(([^)]+)\)/g, 'nPr($1)')
    .replace(/n C r ?\(([^)]+)\)/g, 'nCr($1)')
    // \mathrm{Ans} serializes to 'A n s' in ascii-math
    .replace(/\bA n s\b/g, 'Ans')
    .trim()
}

export function evaluateExpression(rawExpr, { angleMode = 'deg', vars = {}, complexMode = 'rect' } = {}) {
  const expr = normalizeExpression(rawExpr)
  if (!expr) return { ok: false, error: 'Empty expression' }
  // After normalization, any remaining root(...) means an unfilled placeholder.
  if (/root\(\(\)/.test(expr)) return { ok: false, error: 'Enter the root degree (e.g. 3 for cube root)' }
  if (/\broot\(/.test(expr)) return { ok: false, error: 'Enter the radicand inside the root symbol' }
  if (/log _\(\(\)\)/.test(expr)) return { ok: false, error: 'Enter the log base' }

  try {
    const scope = buildScope(angleMode, vars)
    const value = math.evaluate(expr, scope)
    if (value === undefined) {
      return { ok: false, error: 'Nothing to evaluate' }
    }
    const isComplex = math.typeOf(value) === 'Complex'
    return { ok: true, value, display: formatValue(value, angleMode, complexMode), isComplex }
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
    if (math.typeOf(value) === 'Complex') {
      const re = value.re
      const im = value.im
      if (complexMode === 'polar') {
        const r = Math.sqrt(re * re + im * im)
        let theta = Math.atan2(im, re)
        if (angleMode === 'deg') theta = (theta * 180) / Math.PI
        const unit = angleMode === 'deg' ? '°' : ' rad'
        return `${formatNum(r)}∠${formatNum(theta)}${unit}`
      }
      // rectangular: a + bi
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
  if (/division by zero/i.test(msg) || /Infinity/i.test(msg)) return 'Math error: division by zero'
  return msg
}
