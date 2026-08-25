import { describe, it, expect } from 'vitest'
import { normalizeExpression, evaluateExpression } from '../mathEngine.js'
import { polyRoots, solveLinearSystem } from '../numeric.js'

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

describe('normalizeExpression: matrix operatorname bridge', () => {
  it('i n v (  → inv(',       () => expect(normalizeExpression('i n v (')).toBe('inv('))
  it('d e t (  → det(',       () => expect(normalizeExpression('d e t (')).toBe('det('))
  it('t r a c e (  → trace(', () => expect(normalizeExpression('t r a c e (')).toBe('trace('))
  it('t r a n s p o s e (  → transpose(', () => expect(normalizeExpression('t r a n s p o s e (')).toBe('transpose('))
  it('inv(A) passes through unchanged', () => expect(normalizeExpression('inv(A)')).toBe('inv(A)'))
  it('s i z e (   → size(',      () => expect(normalizeExpression('s i z e (')).toBe('size('))
  it('d o t (     → dot(',       () => expect(normalizeExpression('d o t (')).toBe('dot('))
  it('c r o s s ( → cross(',     () => expect(normalizeExpression('c r o s s (')).toBe('cross('))
  it('n o r m (   → norm(',      () => expect(normalizeExpression('n o r m (')).toBe('norm('))
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
  it('sqrt(-1) is flagged as complex', () => {
    const r = evaluateExpression('sqrt(-1)')
    expect(r.ok).toBe(true)
    expect(r.isComplex).toBe(true)
  })
  it('sqrt(-1) rect display is i', () => {
    expect(evaluateExpression('sqrt(-1)', { complexMode: 'rect' }).display).toBe('i')
  })
  it('sqrt(-4) rect display contains 2 and i', () => {
    const d = evaluateExpression('sqrt(-4)', { complexMode: 'rect' }).display
    expect(d).toContain('2')
    expect(d).toContain('i')
  })
  it('sqrt(-1) polar display contains angle symbol', () => {
    expect(evaluateExpression('sqrt(-1)', { complexMode: 'polar' }).display).toContain('∠')
  })
  it('real result is not flagged as complex', () => {
    expect(evaluateExpression('sqrt(4)').isComplex).toBe(false)
  })
})

describe('evaluateExpression: matrix variables in scope', () => {
  it('det of identity 2x2 is 1', () => {
    const vars = { A: [[1,0],[0,1]] }
    const r = evaluateExpression('det(A)', { vars })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(1, 10)
  })
  it('matrix multiply result is flagged as matrix', () => {
    const vars = { A: [[1,0],[0,1]], B: [[2,0],[0,2]] }
    const r = evaluateExpression('A*B', { vars })
    expect(r.ok).toBe(true)
    expect(r.isMatrix).toBe(true)
  })
  it('scalar multiply on matrix works', () => {
    const vars = { A: [[1,2],[3,4]] }
    const r = evaluateExpression('2*A', { vars })
    expect(r.ok).toBe(true)
    expect(r.isMatrix).toBe(true)
  })
})

describe('evaluateExpression: OPS panel - matrix operations', () => {
  const identity = [[1,0],[0,1]]
  const mat = [[1,2],[3,4]]

  it('det of identity is 1', () => {
    const r = evaluateExpression('det(A)', { vars: { A: identity } })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(1, 10)
  })
  it('det of [[1,2],[3,4]] is -2', () => {
    const r = evaluateExpression('det(A)', { vars: { A: mat } })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(-2, 10)
  })
  it('trace of [[1,2],[3,4]] is 5', () => {
    const r = evaluateExpression('trace(A)', { vars: { A: mat } })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(5, 10)
  })
  it('inv of identity returns a matrix', () => {
    const r = evaluateExpression('inv(A)', { vars: { A: identity } })
    expect(r.ok).toBe(true)
    expect(r.isMatrix).toBe(true)
  })
  it('transpose returns a matrix', () => {
    const r = evaluateExpression('transpose(A)', { vars: { A: mat } })
    expect(r.ok).toBe(true)
    expect(r.isMatrix).toBe(true)
  })
  it('size of 2x3 matrix returns ok (plain array result)', () => {
    // size() returns a plain JS array [rows, cols], not a DenseMatrix
    const r = evaluateExpression('size(A)', { vars: { A: [[1,2,3],[4,5,6]] } })
    expect(r.ok).toBe(true)
  })
  it('det of non-square matrix errors', () => {
    const r = evaluateExpression('det(A)', { vars: { A: [[1,2,3],[4,5,6]] } })
    expect(r.ok).toBe(false)
  })
})

describe('evaluateExpression: OPS panel - vector operations (inline)', () => {
  it('norm([3,4]) is 5', () => {
    const r = evaluateExpression('norm([3,4])', {})
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(5, 10)
  })
  it('dot([1,0,0],[0,1,0]) orthogonal = 0', () => {
    const r = evaluateExpression('dot([1,0,0],[0,1,0])', {})
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(0, 10)
  })
  it('dot([1,2],[3,4]) = 11', () => {
    const r = evaluateExpression('dot([1,2],[3,4])', {})
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(11, 10)
  })
  it('cross([1,0,0],[0,1,0]) returns matrix', () => {
    const r = evaluateExpression('cross([1,0,0],[0,1,0])', {})
    expect(r.ok).toBe(true)
    expect(r.isMatrix).toBe(true)
  })
})

describe('evaluateExpression: OPS panel - vector operations (stored 1-row variables)', () => {
  // 1xN matrices are flattened to 1D in buildScope, enabling dot/norm/cross
  it('norm of stored 1x2 vector [[3,4]] is 5', () => {
    const r = evaluateExpression('norm(A)', { vars: { A: [[3, 4]] } })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(5, 10)
  })
  it('norm of stored 1x3 zero vector is 0', () => {
    const r = evaluateExpression('norm(A)', { vars: { A: [[0, 0, 0]] } })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(0, 10)
  })
  it('dot of stored orthogonal 1x3 vectors is 0', () => {
    const r = evaluateExpression('dot(A,B)', { vars: { A: [[1,0,0]], B: [[0,1,0]] } })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(0, 10)
  })
  it('dot of stored 1x2 vectors [[1,2]] . [[3,4]] = 11', () => {
    const r = evaluateExpression('dot(A,B)', { vars: { A: [[1,2]], B: [[3,4]] } })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(11, 10)
  })
  it('Nx1 column vector is also flattened: norm([[3],[4]]) = 5', () => {
    const r = evaluateExpression('norm(A)', { vars: { A: [[3],[4]] } })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(5, 10)
  })
})

describe('normalizeExpression: complex operatorname bridge', () => {
  it('p o l a r ( -> polar(', () => expect(normalizeExpression('p o l a r (')).toBe('polar('))
  it('a b s (    -> abs(',   () => expect(normalizeExpression('a b s (')).toBe('abs('))
  it('a r g (    -> arg(',   () => expect(normalizeExpression('a r g (')).toBe('arg('))
  it('c o n j (  -> conj(',  () => expect(normalizeExpression('c o n j (')).toBe('conj('))
  it('r e (      -> re(',    () => expect(normalizeExpression('r e (')).toBe('re('))
  it('i m (      -> im(',    () => expect(normalizeExpression('i m (')).toBe('im('))
})

describe('evaluateExpression: OPS panel - complex operations', () => {
  it('polar(5, 53.13) in DEG is approximately 3+4i', () => {
    const r = evaluateExpression('polar(5, 53.13)', { angleMode: 'deg' })
    expect(r.ok).toBe(true)
    expect(r.isComplex).toBe(true)
    expect(r.value.re).toBeCloseTo(3, 2)
    expect(r.value.im).toBeCloseTo(4, 2)
  })
  it('polar(1, 90) in DEG is i', () => {
    const r = evaluateExpression('polar(1, 90)', { angleMode: 'deg' })
    expect(r.ok).toBe(true)
    expect(r.value.re).toBeCloseTo(0, 10)
    expect(r.value.im).toBeCloseTo(1, 10)
  })
  it('abs(3+4i) = 5', () => {
    const r = evaluateExpression('abs(3+4i)', { angleMode: 'deg' })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(5, 10)
  })
  it('arg(1+i) in DEG = 45', () => {
    const r = evaluateExpression('arg(1+i)', { angleMode: 'deg' })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(45, 8)
  })
  it('conj(2+3i) = 2-3i', () => {
    const r = evaluateExpression('conj(2+3i)', { angleMode: 'deg' })
    expect(r.ok).toBe(true)
    expect(r.isComplex).toBe(true)
    expect(r.value.re).toBeCloseTo(2, 10)
    expect(r.value.im).toBeCloseTo(-3, 10)
  })
  it('re(2+3i) = 2', () => {
    const r = evaluateExpression('re(2+3i)', { angleMode: 'deg' })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(2, 10)
  })
  it('im(2+3i) = 3', () => {
    const r = evaluateExpression('im(2+3i)', { angleMode: 'deg' })
    expect(r.ok).toBe(true)
    expect(r.value).toBeCloseTo(3, 10)
  })
  it('formatValue rect: 2+3i displayed as rect', () => {
    const r = evaluateExpression('2+3i', { angleMode: 'deg', complexMode: 'rect' })
    expect(r.ok).toBe(true)
    expect(r.display).toContain('2')
    expect(r.display).toContain('3')
    expect(r.display).toContain('i')
  })
  it('formatValue polar: 2+3i displayed as polar with angle symbol', () => {
    const r = evaluateExpression('2+3i', { angleMode: 'deg', complexMode: 'polar' })
    expect(r.ok).toBe(true)
    expect(r.display).toContain('∠')
  })
})

function rootVal(r) {
  return { re: r.re !== undefined ? r.re : Number(r), im: r.im !== undefined ? r.im : 0 }
}

describe('polyRoots: degree 1', () => {
  it('2x - 6 = 0 -> root at 3', () => {
    const roots = polyRoots([2, -6])
    expect(roots).toHaveLength(1)
    expect(rootVal(roots[0]).re).toBeCloseTo(3, 8)
    expect(Math.abs(rootVal(roots[0]).im)).toBeCloseTo(0, 8)
  })
})

describe('polyRoots: degree 2', () => {
  it('x^2 - 3x + 2 = 0 -> roots 1 and 2 (real)', () => {
    const roots = polyRoots([1, -3, 2]).map(rootVal)
    const res = roots.map(r => r.re).sort((a, b) => a - b)
    expect(res[0]).toBeCloseTo(1, 8)
    expect(res[1]).toBeCloseTo(2, 8)
    roots.forEach(r => expect(Math.abs(r.im)).toBeCloseTo(0, 8))
  })
  it('x^2 + 1 = 0 -> roots ±i (purely imaginary)', () => {
    const roots = polyRoots([1, 0, 1]).map(rootVal)
    expect(roots).toHaveLength(2)
    roots.forEach(r => {
      expect(Math.abs(r.re)).toBeCloseTo(0, 8)
      expect(Math.abs(r.im)).toBeCloseTo(1, 8)
    })
  })
  it('x^2 - 2x + 1 = 0 -> repeated root at 1', () => {
    const roots = polyRoots([1, -2, 1]).map(rootVal)
    roots.forEach(r => expect(r.re).toBeCloseTo(1, 6))
  })
})

describe('polyRoots: degree 3', () => {
  it('(x-1)(x-2)(x-3) -> roots 1, 2, 3', () => {
    const roots = polyRoots([1, -6, 11, -6]).map(rootVal)
    expect(roots).toHaveLength(3)
    const res = roots.map(r => r.re).sort((a, b) => a - b)
    expect(res[0]).toBeCloseTo(1, 6)
    expect(res[1]).toBeCloseTo(2, 6)
    expect(res[2]).toBeCloseTo(3, 6)
    roots.forEach(r => expect(Math.abs(r.im)).toBeCloseTo(0, 6))
  })
})

describe('polyRoots: degree 4', () => {
  it('(x-1)(x+1)(x-2)(x+2) = x^4-5x^2+4 -> roots ±1, ±2', () => {
    const roots = polyRoots([1, 0, -5, 0, 4]).map(rootVal)
    expect(roots).toHaveLength(4)
    const res = roots.map(r => r.re).sort((a, b) => a - b)
    expect(res[0]).toBeCloseTo(-2, 6)
    expect(res[1]).toBeCloseTo(-1, 6)
    expect(res[2]).toBeCloseTo(1, 6)
    expect(res[3]).toBeCloseTo(2, 6)
  })
})

describe('polyRoots: degree 5 and beyond', () => {
  // (x-1)(x-2)(x-3)(x-4)(x-5) = x^5 - 15x^4 + 85x^3 - 225x^2 + 274x - 120
  it('(x-1)(x-2)(x-3)(x-4)(x-5) returns 5 roots', () => {
    const roots = polyRoots([1, -15, 85, -225, 274, -120])
    expect(roots).toHaveLength(5)
  })
  it('(x-1)(x-2)(x-3)(x-4)(x-5) roots are all near integers 1-5', () => {
    const roots = polyRoots([1, -15, 85, -225, 274, -120]).map(rootVal)
    const res = roots.map(r => r.re).sort((a, b) => a - b)
    ;[1, 2, 3, 4, 5].forEach((v, i) => expect(res[i]).toBeCloseTo(v, 4))
    roots.forEach(r => expect(Math.abs(r.im)).toBeCloseTo(0, 4))
  })
  // (x-1)(x-2)(x-3)(x-4)(x-5)(x-6) for degree 6
  it('degree 6 polynomial returns 6 roots', () => {
    const roots = polyRoots([1, -21, 175, -735, 1624, -1764, 720])
    expect(roots).toHaveLength(6)
  })
  it('degree 6 roots are all near integers 1-6', () => {
    const roots = polyRoots([1, -21, 175, -735, 1624, -1764, 720]).map(rootVal)
    const res = roots.map(r => r.re).sort((a, b) => a - b)
    ;[1, 2, 3, 4, 5, 6].forEach((v, i) => expect(res[i]).toBeCloseTo(v, 3))
  })
})

describe('solveLinearSystem: 2x2', () => {
  it('x+y=3, x-y=1 -> x=2, y=1', () => {
    const r = solveLinearSystem([[1,1],[1,-1]], [3,1])
    expect(r.ok).toBe(true)
    expect(r.solution[0]).toBeCloseTo(2, 10)
    expect(r.solution[1]).toBeCloseTo(1, 10)
  })
  it('singular matrix -> no unique solution', () => {
    const r = solveLinearSystem([[1,2],[2,4]], [1,2])
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/no unique solution/i)
  })
})

describe('solveLinearSystem: 3x3', () => {
  it('identity system -> solution equals b', () => {
    const r = solveLinearSystem([[1,0,0],[0,1,0],[0,0,1]], [4,5,6])
    expect(r.ok).toBe(true)
    expect(r.solution[0]).toBeCloseTo(4, 10)
    expect(r.solution[1]).toBeCloseTo(5, 10)
    expect(r.solution[2]).toBeCloseTo(6, 10)
  })
  it('known 3x3 system x+y+z=6, 2y+5z=−4, 2x+5y−z=27 -> x=5, y=3, z=−2', () => {
    const r = solveLinearSystem([[1,1,1],[0,2,5],[2,5,-1]], [6,-4,27])
    expect(r.ok).toBe(true)
    expect(r.solution[0]).toBeCloseTo(5, 8)
    expect(r.solution[1]).toBeCloseTo(3, 8)
    expect(r.solution[2]).toBeCloseTo(-2, 8)
  })
})

describe('solveLinearSystem: 4x4 and 5x5', () => {
  it('4x4 identity system -> solution equals b', () => {
    const I4 = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    const r = solveLinearSystem(I4, [1,2,3,4])
    expect(r.ok).toBe(true)
    r.solution.forEach((v, i) => expect(v).toBeCloseTo(i + 1, 10))
  })
  it('5x5 identity system -> solution equals b', () => {
    const I5 = Array.from({length:5}, (_, i) => Array.from({length:5}, (_, j) => i===j ? 1 : 0))
    const r = solveLinearSystem(I5, [10,20,30,40,50])
    expect(r.ok).toBe(true)
    r.solution.forEach((v, i) => expect(v).toBeCloseTo((i + 1) * 10, 10))
  })
})
