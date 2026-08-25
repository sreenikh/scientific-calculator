import { describe, it, expect } from 'vitest'
import { ROWS } from '../keypadConfig.js'

const ALL_KEYS  = ROWS.flat()
const ALL_VALID_ACTIONS = new Set([
  'toggleShift', 'toggleAlpha', 'openModeMenu', 'toggleAngle', 'cycleBase',
  'clear', 'del', 'evaluate',
  'openConst', 'openConv', 'openSolve', 'openDeriv', 'openInteg', 'openBaseN', 'openOps',
])

describe('keypad structure', () => {
  it('every key has an id', () => {
    ALL_KEYS.forEach((k) => expect(k.id, `Missing id on key: ${JSON.stringify(k)}`).toBeTruthy())
  })

  it('all key ids are unique', () => {
    const ids = ALL_KEYS.map((k) => k.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes).toEqual([])
  })

  it('every key has either insert or action (not neither)', () => {
    ALL_KEYS.forEach((k) => {
      const has = k.insert !== undefined || k.action !== undefined
      expect(has, `Key "${k.id}" has neither insert nor action`).toBe(true)
    })
  })

  it('every action key references a known action', () => {
    ALL_KEYS.filter((k) => k.action).forEach((k) => {
      expect(ALL_VALID_ACTIONS.has(k.action), `Unknown action "${k.action}" on key "${k.id}"`).toBe(true)
    })
  })

  it('every insert key has a non-empty string value', () => {
    ALL_KEYS.filter((k) => k.insert !== undefined).forEach((k) => {
      expect(typeof k.insert).toBe('string')
      expect(k.insert.length, `Empty insert on key "${k.id}"`).toBeGreaterThan(0)
    })
  })

  it('shift variants have insert or action', () => {
    ALL_KEYS.filter((k) => k.shift).forEach((k) => {
      const s = k.shift
      const has = s.insert !== undefined || s.action !== undefined
      expect(has, `shift of "${k.id}" has neither insert nor action`).toBe(true)
    })
  })

  it('alpha variants have insert or action', () => {
    ALL_KEYS.filter((k) => k.alpha).forEach((k) => {
      const a = k.alpha
      const has = a.insert !== undefined || a.action !== undefined
      expect(has, `alpha of "${k.id}" has neither insert nor action`).toBe(true)
    })
  })
})

function key(id)  { return ALL_KEYS.find((k) => k.id === id) }

describe('keypad key contracts: trig', () => {
  it('sin  → \\sin(',       () => expect(key('sin').insert).toBe('\\sin('))
  it('cos  → \\cos(',       () => expect(key('cos').insert).toBe('\\cos('))
  it('tan  → \\tan(',       () => expect(key('tan').insert).toBe('\\tan('))
  // Shift: inverse trig - must use \arcXXX so MathLive serialises cleanly
  it('sin⁻¹ → \\arcsin(',  () => expect(key('sin').shift.insert).toBe('\\arcsin('))
  it('cos⁻¹ → \\arccos(',  () => expect(key('cos').shift.insert).toBe('\\arccos('))
  it('tan⁻¹ → \\arctan(',  () => expect(key('tan').shift.insert).toBe('\\arctan('))
  // Alpha: reciprocal trig
  it('csc (alpha sin) → \\csc(', () => expect(key('sin').alpha.insert).toBe('\\csc('))
  it('sec (alpha cos) → \\sec(', () => expect(key('cos').alpha.insert).toBe('\\sec('))
  it('cot (alpha tan) → \\cot(', () => expect(key('tan').alpha.insert).toBe('\\cot('))
})

describe('keypad key contracts: log / ln', () => {
  it('log  → \\log(',              () => expect(key('log').insert).toBe('\\log('))
  it('ln   → \\ln(',               () => expect(key('ln').insert).toBe('\\ln('))
  it('10ˣ (shift log) → 10^{#0}', () => expect(key('log').shift.insert).toBe('10^{#0}'))
  it('eˣ  (shift ln)  → e^{#0}',  () => expect(key('ln').shift.insert).toBe('e^{#0}'))
  it('logₐ (alpha log) uses #0 placeholder in base',
    () => expect(key('log').alpha.insert).toContain('#0'))
})

describe('keypad key contracts: roots & powers', () => {
  it('√  → \\sqrt{#0} (cursor in radicand)',
    () => expect(key('sqrt').insert).toBe('\\sqrt{#0}'))
  it('ˣ√y (shift √) → \\sqrt[#0]{#0} (cursor in index then radicand)',
    () => expect(key('sqrt').shift.insert).toBe('\\sqrt[#0]{#0}'))
  it('x² → ^2',   () => expect(key('x2').insert).toBe('^2'))
  it('x³ → ^3',   () => expect(key('x2').shift.insert).toBe('^3'))
  it('xʸ → ^{#0} (cursor in exponent)',
    () => expect(key('pow').insert).toBe('^{#0}'))
})

describe('keypad key contracts: combinatorics', () => {
  it('nCr → \\operatorname{nCr}(#0,#0)',
    () => expect(key('ncr').insert).toBe('\\operatorname{nCr}(#0,#0)'))
  it('nPr → \\operatorname{nPr}(#0,#0)',
    () => expect(key('npr').insert).toBe('\\operatorname{nPr}(#0,#0)'))
  it('x! → !', () => expect(key('fact').insert).toBe('!'))
})

describe('keypad key contracts: Ans & imaginary', () => {
  it('Ans → \\mathrm{Ans}',
    () => expect(key('ans').insert).toBe('\\mathrm{Ans}'))
  it('i (shift Ans) → i',
    () => expect(key('ans').shift.insert).toBe('i'))
})

describe('keypad key contracts: digits & arithmetic', () => {
  ;['0','1','2','3','4','5','6','7','8','9'].forEach((d) => {
    it(`digit ${d} inserts "${d}"`, () => expect(key(d).insert).toBe(d))
  })
  it('+ inserts +',  () => expect(key('add').insert).toBe('+'))
  it('− inserts -',  () => expect(key('sub').insert).toBe('-'))
  it('. inserts .',  () => expect(key('dot').insert).toBe('.'))
  it('( inserts (',  () => expect(key('lparen').insert).toBe('('))
  it(') inserts )',  () => expect(key('rparen').insert).toBe(')'))
})

describe('keypad key contracts: modifier / action keys', () => {
  it('SHIFT  → toggleShift',  () => expect(key('shift').action).toBe('toggleShift'))
  it('ALPHA  → toggleAlpha',  () => expect(key('alpha').action).toBe('toggleAlpha'))
  it('DRG    → toggleAngle',  () => expect(key('angle').action).toBe('toggleAngle'))
  it('DEL    → del',          () => expect(key('del').action).toBe('del'))
  it('AC     → clear',        () => expect(key('ac').action).toBe('clear'))
  it('=      → evaluate',     () => expect(key('exe').action).toBe('evaluate'))
  it('CONST  → openConst',    () => expect(key('const').action).toBe('openConst'))
  it('CONV   → openConv',     () => expect(key('conv').action).toBe('openConv'))
  it('SOLVE  → openSolve',    () => expect(key('solve').action).toBe('openSolve'))
  it('BASE-N → openBaseN',    () => expect(key('basen').action).toBe('openBaseN'))
  it('d/dx   → openDeriv',    () => expect(key('deriv').action).toBe('openDeriv'))
  it('∫dx    → openInteg',    () => expect(key('integ').action).toBe('openInteg'))
})

describe('keypad key contracts: arithmetic operators', () => {
  it('× inserts \\times ',     () => expect(key('mul').insert).toBe('\\times '))
  it('ALPHA × inserts %',      () => expect(key('mul').alpha.insert).toBe('%'))
  it('÷ inserts \\frac{#0}{}', () => expect(key('div').insert).toBe('\\frac{#0}{}'))
})
