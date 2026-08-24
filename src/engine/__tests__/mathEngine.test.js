import { describe, it, expect } from 'vitest'
import { normalizeExpression, evaluateExpression } from '../mathEngine.js'

const DEG = { angleMode: 'deg' }
const RAD = { angleMode: 'rad' }
const withAns = (v) => ({ angleMode: 'deg', vars: { Ans: v } })

function ok(expr, opts = DEG) {
  const r = evaluateExpression(expr, opts)
  if (!r.ok) throw new Error(`Expected ok for "${expr}" but got error: "${r.error}"`)
  return r.value
}

function err(expr, opts = DEG) {
  const r = evaluateExpression(expr, opts)
  if (r.ok) throw new Error(`Expected error for "${expr}" but got value: ${r.value}`)
  return r.error
}

describe('normalizeExpression: character substitutions', () => {
  it('replaces × with *',  () => expect(normalizeExpression('3×4')).toBe('3*4'))
  it('replaces ÷ with /',  () => expect(normalizeExpression('8÷2')).toBe('8/2'))
  it('replaces − with -',  () => expect(normalizeExpression('5−3')).toBe('5-3'))
  it('replaces · with *',  () => expect(normalizeExpression('2·3')).toBe('2*3'))
  it('replaces π with pi', () => expect(normalizeExpression('2×π')).toBe('2*pi'))
  it('trims whitespace',   () => expect(normalizeExpression('  5+1  ')).toBe('5+1'))
  it('handles multiple substitutions in one pass', () =>
    expect(normalizeExpression('3×π÷2')).toBe('3*pi/2'))
})

describe('normalizeExpression: nth-root bridge (MathLive → math.js)', () => {
  // MathLive ascii-math emits root(n)(x) for \sqrt[n]{x}
  it('root(3)(8)  → nthRoot(8, 3)',   () => expect(normalizeExpression('root(3)(8)')).toBe('nthRoot(8, 3)'))
  it('root(2)(16) → nthRoot(16, 2)',  () => expect(normalizeExpression('root(2)(16)')).toBe('nthRoot(16, 2)'))
  it('root(4)(81) → nthRoot(81, 4)',  () => expect(normalizeExpression('root(4)(81)')).toBe('nthRoot(81, 4)'))
  it('root(())(8) left unchanged - guard will fire', () =>
    expect(normalizeExpression('root(())(8)')).toBe('root(())(8)'))
  it('root(3)()8  left unchanged - guard will fire', () =>
    expect(normalizeExpression('root(3)()8')).toBe('root(3)()8'))
})

describe('normalizeExpression: log-base bridge', () => {
  // Single-token base: \log_{2}(x) -> 'log _2(x)'
  it('log _2(8)       → logb(8, 2)',    () => expect(normalizeExpression('log _2(8)')).toBe('logb(8, 2)'))
  it('log _e(x)       → logb(x, e)',    () => expect(normalizeExpression('log _e(x)')).toBe('logb(x, e)'))
  // Multi-char base: \log_{10}(x) -> 'log _(10)(x)'
  it('log _(10)(100)  → logb(100, 10)', () => expect(normalizeExpression('log _(10)(100)')).toBe('logb(100, 10)'))
  it('log _(2)(1024)  → logb(1024, 2)', () => expect(normalizeExpression('log _(2)(1024)')).toBe('logb(1024, 2)'))
  it('log _(x+1)(8)   → logb(8, x+1)',  () => expect(normalizeExpression('log _(x+1)(8)')).toBe('logb(8, x+1)'))
  it('log _(())(8)    left unchanged',   () => expect(normalizeExpression('log _(())(8)')).toBe('log _(())(8)'))
})

describe('normalizeExpression: nPr / nCr bridge', () => {
  // \operatorname{nCr} -> 'n C r (n,r)'
  it('n C r (4,2)   → nCr(4,2)',   () => expect(normalizeExpression('n C r (4,2)')).toBe('nCr(4,2)'))
  it('n C r (10,3)  → nCr(10,3)',  () => expect(normalizeExpression('n C r (10,3)')).toBe('nCr(10,3)'))
  it('n P r (4,2)   → nPr(4,2)',   () => expect(normalizeExpression('n P r (4,2)')).toBe('nPr(4,2)'))
  it('n P r (5,3)   → nPr(5,3)',   () => expect(normalizeExpression('n P r (5,3)')).toBe('nPr(5,3)'))
  it('no-space form: n C r(4,2)',   () => expect(normalizeExpression('n C r(4,2)')).toBe('nCr(4,2)'))
})

describe('normalizeExpression: Ans bridge', () => {
  // \mathrm{Ans} -> 'A n s'
  it('A n s          → Ans',     () => expect(normalizeExpression('A n s')).toBe('Ans'))
  it('A n s^2        → Ans^2',   () => expect(normalizeExpression('A n s^2')).toBe('Ans^2'))
  it('2*A n s+1      → 2*Ans+1', () => expect(normalizeExpression('2*A n s+1')).toBe('2*Ans+1'))
  it('sin(A n s)     → sin(Ans)', () => expect(normalizeExpression('sin(A n s)')).toBe('sin(Ans)'))
})

describe('evaluateExpression: arithmetic', () => {
  it('2 + 3 = 5',          () => expect(ok('2+3')).toBe(5))
  it('10 - 4 = 6',         () => expect(ok('10-4')).toBe(6))
  it('3 * 4 = 12',         () => expect(ok('3*4')).toBe(12))
  it('8 / 2 = 4',          () => expect(ok('8/2')).toBe(4))
  it('2 + 3 * 4 = 14 (precedence)', () => expect(ok('2+3*4')).toBe(14))
  it('(2 + 3) * 4 = 20',   () => expect(ok('(2+3)*4')).toBe(20))
  it('-5 + 2 = -3',         () => expect(ok('-5+2')).toBe(-3))
  it('0.1 + 0.2 ≈ 0.3',    () => expect(ok('0.1+0.2')).toBeCloseTo(0.3, 10))
  it('100 / 4 = 25',        () => expect(ok('100/4')).toBe(25))
  it('× normalised to *',   () => expect(ok('3×4')).toBe(12))
  it('÷ normalised to /',   () => expect(ok('8÷2')).toBe(4))
  it('− normalised to -',   () => expect(ok('10−4')).toBe(6))
})

describe('evaluateExpression: powers and roots', () => {
  it('5^2 = 25',               () => expect(ok('5^2')).toBe(25))
  it('2^3 = 8',                () => expect(ok('2^3')).toBe(8))
  it('2^10 = 1024',            () => expect(ok('2^10')).toBe(1024))
  it('10^0 = 1',               () => expect(ok('10^0')).toBe(1))
  it('sqrt(16) = 4',           () => expect(ok('sqrt(16)')).toBe(4))
  it('sqrt(2) ≈ 1.4142',       () => expect(ok('sqrt(2)')).toBeCloseTo(Math.SQRT2, 10))
  it('sqrt(0) = 0',            () => expect(ok('sqrt(0)')).toBe(0))
  it('nthRoot(8, 3) = 2',      () => expect(ok('nthRoot(8, 3)')).toBeCloseTo(2, 10))
  it('nthRoot(16, 4) = 2',     () => expect(ok('nthRoot(16, 4)')).toBeCloseTo(2, 10))
  it('nthRoot(32, 5) = 2',     () => expect(ok('nthRoot(32, 5)')).toBeCloseTo(2, 10))
  it('nthRoot(1, 3) = 1',      () => expect(ok('nthRoot(1, 3)')).toBeCloseTo(1, 10))
  // Via the normalisation bridge (simulates MathLive ascii-math for \sqrt[3]{8})
  it('root(3)(8) → 2',         () => expect(ok('root(3)(8)')).toBeCloseTo(2, 10))
  it('root(4)(16) → 2',        () => expect(ok('root(4)(16)')).toBeCloseTo(2, 10))
})

describe('evaluateExpression: trig, degree mode', () => {
  it('sin(0) = 0',    () => expect(ok('sin(0)')).toBeCloseTo(0, 10))
  it('sin(30) = 0.5', () => expect(ok('sin(30)')).toBeCloseTo(0.5, 10))
  it('sin(45) ≈ √2/2',() => expect(ok('sin(45)')).toBeCloseTo(Math.SQRT2 / 2, 10))
  it('sin(60) ≈ √3/2',() => expect(ok('sin(60)')).toBeCloseTo(Math.sqrt(3) / 2, 10))
  it('sin(90) = 1',   () => expect(ok('sin(90)')).toBeCloseTo(1, 10))
  it('cos(0) = 1',    () => expect(ok('cos(0)')).toBeCloseTo(1, 10))
  it('cos(60) = 0.5', () => expect(ok('cos(60)')).toBeCloseTo(0.5, 10))
  it('cos(90) ≈ 0',   () => expect(ok('cos(90)')).toBeCloseTo(0, 10))
  it('tan(0) = 0',    () => expect(ok('tan(0)')).toBeCloseTo(0, 10))
  it('tan(45) = 1',   () => expect(ok('tan(45)')).toBeCloseTo(1, 10))
})

describe('evaluateExpression: trig, radian mode', () => {
  it('sin(pi/6) = 0.5',  () => expect(ok('sin(pi/6)', RAD)).toBeCloseTo(0.5, 10))
  it('cos(pi/3) = 0.5',  () => expect(ok('cos(pi/3)', RAD)).toBeCloseTo(0.5, 10))
  it('tan(pi/4) = 1',    () => expect(ok('tan(pi/4)', RAD)).toBeCloseTo(1, 10))
  it('sin(pi) ≈ 0',      () => expect(ok('sin(pi)', RAD)).toBeCloseTo(0, 10))
  it('cos(pi) = -1',     () => expect(ok('cos(pi)', RAD)).toBeCloseTo(-1, 10))
})

describe('evaluateExpression: inverse trig, degree mode', () => {
  // asin / acos / atan are the direct names kept in scope
  it('asin(0.5) = 30',    () => expect(ok('asin(0.5)')).toBeCloseTo(30, 8))
  it('acos(0.5) = 60',    () => expect(ok('acos(0.5)')).toBeCloseTo(60, 8))
  it('atan(1) = 45',      () => expect(ok('atan(1)')).toBeCloseTo(45, 8))
  it('asin(0) = 0',       () => expect(ok('asin(0)')).toBeCloseTo(0, 8))
  it('asin(1) = 90',      () => expect(ok('asin(1)')).toBeCloseTo(90, 8))
  it('acos(1) = 0',       () => expect(ok('acos(1)')).toBeCloseTo(0, 8))
  it('acos(0) = 90',      () => expect(ok('acos(0)')).toBeCloseTo(90, 8))
  // arcsin/arccos/arctan: what \arcsin produces via ascii-math
  it('arcsin(0.5) = 30',  () => expect(ok('arcsin(0.5)')).toBeCloseTo(30, 8))
  it('arccos(0.5) = 60',  () => expect(ok('arccos(0.5)')).toBeCloseTo(60, 8))
  it('arctan(1) = 45',    () => expect(ok('arctan(1)')).toBeCloseTo(45, 8))
})

describe('evaluateExpression: reciprocal trig, degree mode', () => {
  it('sec(60) = 2',   () => expect(ok('sec(60)')).toBeCloseTo(2, 8))
  it('sec(0) = 1',    () => expect(ok('sec(0)')).toBeCloseTo(1, 8))
  it('csc(30) = 2',   () => expect(ok('csc(30)')).toBeCloseTo(2, 8))
  it('csc(90) = 1',   () => expect(ok('csc(90)')).toBeCloseTo(1, 8))
  it('cot(45) = 1',   () => expect(ok('cot(45)')).toBeCloseTo(1, 8))
})

describe('evaluateExpression: logarithms', () => {
  // log = log10 (calculator convention)
  it('log(10) = 1',          () => expect(ok('log(10)')).toBeCloseTo(1, 10))
  it('log(100) = 2',         () => expect(ok('log(100)')).toBeCloseTo(2, 10))
  it('log(1000) = 3',        () => expect(ok('log(1000)')).toBeCloseTo(3, 10))
  it('log(1) = 0',           () => expect(ok('log(1)')).toBeCloseTo(0, 10))
  // ln = natural log
  it('ln(1) = 0',            () => expect(ok('ln(1)')).toBeCloseTo(0, 10))
  it('ln(e) = 1  (via e^1)', () => expect(ok('ln(e^1)')).toBeCloseTo(1, 10))
  it('ln(e^2) = 2',          () => expect(ok('ln(e^2)')).toBeCloseTo(2, 10))
  // logb(x, b): custom base
  it('logb(8, 2) = 3',       () => expect(ok('logb(8, 2)')).toBeCloseTo(3, 10))
  it('logb(1000, 10) = 3',   () => expect(ok('logb(1000, 10)')).toBeCloseTo(3, 10))
  it('logb(243, 3) = 5',     () => expect(ok('logb(243, 3)')).toBeCloseTo(5, 10))
  it('logb(1, any) = 0',     () => expect(ok('logb(1, 7)')).toBeCloseTo(0, 10))
  // Via bridge (simulates MathLive ascii-math for \log_{2}(8))
  it('log _2(8) → 3',        () => expect(ok('log _2(8)')).toBeCloseTo(3, 10))
  it('log _(10)(100) → 2',   () => expect(ok('log _(10)(100)')).toBeCloseTo(2, 10))
})

describe('evaluateExpression: combinatorics', () => {
  // nCr
  it('nCr(4, 2) = 6',    () => expect(ok('nCr(4, 2)')).toBe(6))
  it('nCr(10, 3) = 120', () => expect(ok('nCr(10, 3)')).toBe(120))
  it('nCr(5, 0) = 1',    () => expect(ok('nCr(5, 0)')).toBe(1))
  it('nCr(5, 5) = 1',    () => expect(ok('nCr(5, 5)')).toBe(1))
  it('nCr(n, 1) = n',    () => expect(ok('nCr(7, 1)')).toBe(7))
  // nPr
  it('nPr(4, 2) = 12',   () => expect(ok('nPr(4, 2)')).toBe(12))
  it('nPr(5, 3) = 60',   () => expect(ok('nPr(5, 3)')).toBe(60))
  it('nPr(n, 1) = n',    () => expect(ok('nPr(7, 1)')).toBe(7))
  it('nPr(n, 0) = 1',    () => expect(ok('nPr(5, 0)')).toBe(1))
  // factorial
  it('5! = 120',         () => expect(ok('5!')).toBe(120))
  it('10! = 3628800',    () => expect(ok('10!')).toBe(3628800))
  it('0! = 1',           () => expect(ok('0!')).toBe(1))
  it('1! = 1',           () => expect(ok('1!')).toBe(1))
  // Via bridge (simulates MathLive ascii-math for \operatorname{nCr})
  it('n C r (4,2) → 6',  () => expect(ok('n C r (4,2)')).toBe(6))
  it('n P r (4,2) → 12', () => expect(ok('n P r (4,2)')).toBe(12))
})

describe('evaluateExpression: Ans variable', () => {
  it('Ans returns previous value',     () => expect(ok('Ans', withAns(5))).toBe(5))
  it('Ans + 1',                        () => expect(ok('Ans+1', withAns(5))).toBe(6))
  it('Ans * 2',                        () => expect(ok('Ans*2', withAns(4))).toBe(8))
  it('Ans^2',                          () => expect(ok('Ans^2', withAns(3))).toBe(9))
  it('sqrt(Ans)',                       () => expect(ok('sqrt(Ans)', withAns(9))).toBe(3))
  it('sin(Ans) (Ans=30° in deg mode)', () => expect(ok('sin(Ans)', withAns(30))).toBeCloseTo(0.5, 10))
  // Via bridge (simulates MathLive ascii-math for \mathrm{Ans}^2)
  it('A n s^2 → Ans^2 → 9',           () => expect(ok('A n s^2', withAns(3))).toBe(9))
})

describe('evaluateExpression: constants', () => {
  it('pi ≈ 3.14159',        () => expect(ok('pi')).toBeCloseTo(Math.PI, 10))
  it('2*pi ≈ 6.28318',      () => expect(ok('2*pi')).toBeCloseTo(2 * Math.PI, 10))
  it('π normalises to pi',  () => expect(ok('π')).toBeCloseTo(Math.PI, 10))
  it('e ≈ 2.71828',         () => expect(ok('e')).toBeCloseTo(Math.E, 10))
  it('e^1 = e',             () => expect(ok('e^1')).toBeCloseTo(Math.E, 10))
  it('e^2 ≈ 7.389',         () => expect(ok('e^2')).toBeCloseTo(Math.E ** 2, 10))
  it('10^3 = 1000',         () => expect(ok('10^3')).toBe(1000))
})

describe('evaluateExpression: expected failures', () => {
  it('empty string → empty expression error',
    () => expect(err('')).toMatch(/empty/i))

  it('whitespace only → empty expression error',
    () => expect(err('   ')).toMatch(/empty/i))

  it('division by zero → displays ∞ (ok:true, not an error)',
    () => {
      const r = evaluateExpression('1/0', DEG)
      expect(r.ok).toBe(true)
      expect(r.display).toBe('∞')
    })

  it('unknown function → undefined variable or function',
    () => expect(err('fooBar(5)')).toMatch(/undefined/i))

  it('unknown variable → undefined variable or function',
    () => expect(err('x + 1')).toMatch(/undefined/i))

  it('incomplete expression (trailing operator) → incomplete expression',
    () => expect(err('2+')).toMatch(/incomplete/i))

  it('unmatched open paren → incomplete expression',
    () => expect(err('(2+3')).toMatch(/incomplete/i))

  it('nth root: unfilled index placeholder root(())(8) → root degree error',
    () => expect(err('root(())(8)')).toMatch(/root degree/i))

  it('nth root: filled index but radicand outside root(3)()8 → radicand error',
    () => expect(err('root(3)()8')).toMatch(/radicand/i))

  it('nth root: filled index, placeholder radicand root(3)(()) → radicand error',
    () => expect(err('root(3)(())')).toMatch(/radicand/i))

  it('log base: unfilled placeholder log _(())(8) → log base error',
    () => expect(err('log _(())(8)')).toMatch(/log base/i))

  it('sqrt of negative → complex result, not an error',
    () => {
      const r = evaluateExpression('sqrt(-1)', DEG)
      // math.js returns a Complex number (ok:true)
      expect(r.ok).toBe(true)
    })

  it('asin out of domain asin(2) → display "undefined", ok:true',
    () => {
      const r = evaluateExpression('asin(2)', DEG)
      expect(r.ok).toBe(true)
      expect(r.display).toBe('undefined')
    })

  it('log of zero → -Infinity display',
    () => {
      const r = evaluateExpression('log(0)', DEG)
      expect(r.ok).toBe(true)
      expect(r.display).toBe('-∞')
    })

  it('log of negative → NaN (domain error), display "undefined"',
    () => {
      const r = evaluateExpression('log(-1)', DEG)
      expect(r.ok).toBe(true)
      expect(r.display).toBe('undefined')
    })
})

// Full MathLive ascii-math pipeline: actual strings MathLive emits per button,
// proving the normalise -> evaluate bridge is intact end-to-end.
describe('evaluateExpression: full MathLive pipeline per button', () => {
  // Arithmetic buttons (characters pass through as-is)
  it('+ : 2+3 = 5',       () => expect(ok('2+3')).toBe(5))
  it('- : 10-4 = 6',      () => expect(ok('10-4')).toBe(6))
  it('× : 3×4 = 12',      () => expect(ok('3×4')).toBe(12))
  it('÷ : 8÷2 = 4',       () => expect(ok('8÷2')).toBe(4))

  // Trig - MathLive emits 'sin (x)' (space before paren)
  it('sin : sin (30) = 0.5',   () => expect(ok('sin (30)')).toBeCloseTo(0.5, 10))
  it('cos : cos (60) = 0.5',   () => expect(ok('cos (60)')).toBeCloseTo(0.5, 10))
  it('tan : tan (45) = 1',     () => expect(ok('tan (45)')).toBeCloseTo(1, 10))
  it('csc : csc (30) = 2',     () => expect(ok('csc (30)')).toBeCloseTo(2, 8))
  it('sec : sec (60) = 2',     () => expect(ok('sec (60)')).toBeCloseTo(2, 8))
  it('cot : cot (45) = 1',     () => expect(ok('cot (45)')).toBeCloseTo(1, 8))

  // Inverse trig - MathLive emits 'arcsin (x)'
  it('sin⁻¹ : arcsin (0.5) = 30', () => expect(ok('arcsin (0.5)')).toBeCloseTo(30, 8))
  it('cos⁻¹ : arccos (0.5) = 60', () => expect(ok('arccos (0.5)')).toBeCloseTo(60, 8))
  it('tan⁻¹ : arctan (1) = 45',   () => expect(ok('arctan (1)')).toBeCloseTo(45, 8))

  // Log / Ln - MathLive emits 'log (x)' / 'ln (x)'
  it('log : log (100) = 2',   () => expect(ok('log (100)')).toBeCloseTo(2, 10))
  it('ln  : ln (1) = 0',      () => expect(ok('ln (1)')).toBeCloseTo(0, 10))

  // Powers
  it('x² : 5^2 = 25',         () => expect(ok('5^2')).toBe(25))
  it('x³ : 2^3 = 8',          () => expect(ok('2^3')).toBe(8))
  it('xʸ : 2^10 = 1024',      () => expect(ok('2^10')).toBe(1024))
  it('10ˣ: 10^3 = 1000',      () => expect(ok('10^3')).toBe(1000))
  it('eˣ : e^2 ≈ 7.389',      () => expect(ok('e^2')).toBeCloseTo(Math.E ** 2, 10))

  // sqrt - MathLive emits 'sqrt(x)'
  it('√  : sqrt(16) = 4',     () => expect(ok('sqrt(16)')).toBe(4))
  // nth root - MathLive emits 'root(n)(x)'
  it('ˣ√y: root(3)(8) = 2',   () => expect(ok('root(3)(8)')).toBeCloseTo(2, 10))

  // logₐ - MathLive emits 'log _2(8)'
  it('logₐ: log _2(8) = 3',   () => expect(ok('log _2(8)')).toBeCloseTo(3, 10))

  // nCr / nPr - MathLive emits 'n C r (n,r)'
  it('nCr : n C r (4,2) = 6', () => expect(ok('n C r (4,2)')).toBe(6))
  it('nPr : n P r (4,2) = 12',() => expect(ok('n P r (4,2)')).toBe(12))

  // Factorial
  it('x!  : 5! = 120',        () => expect(ok('5!')).toBe(120))

  // Ans - MathLive emits 'A n s'
  it('Ans : A n s+1 = 6 (Ans=5)', () => expect(ok('A n s+1', withAns(5))).toBe(6))

  // Fraction - MathLive emits '(1)/(2)'
  it('÷   : (1)/(2) = 0.5',   () => expect(ok('(1)/(2)')).toBeCloseTo(0.5, 10))
})

describe('evaluateExpression: complex numbers', () => {
  it('sqrt(-1) returns a complex result', () => {
    const r = evaluateExpression('sqrt(-1)')
    expect(r.ok).toBe(true)
    expect(r.isComplex).toBe(true)
  })
  it('sqrt(-1) display in rect mode is i', () => {
    const r = evaluateExpression('sqrt(-1)', { complexMode: 'rect' })
    expect(r.display).toBe('i')
  })
  it('sqrt(-4) display in rect mode is 2i', () => {
    const r = evaluateExpression('sqrt(-4)', { complexMode: 'rect' })
    expect(r.display).toContain('2')
    expect(r.display).toContain('i')
  })
  it('sqrt(-1) display in polar mode contains angle symbol', () => {
    const r = evaluateExpression('sqrt(-1)', { complexMode: 'polar' })
    expect(r.display).toContain('∠')
  })
  it('real result is not flagged as complex', () => {
    const r = evaluateExpression('sqrt(4)')
    expect(r.isComplex).toBe(false)
  })
})
