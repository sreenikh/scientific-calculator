import { describe, it, expect } from 'vitest'
import {
  parseBase, formatBin, formatOct, formatDec, formatHex, formatAllBases,
  bitwiseOp, evaluateBaseExpr,
  kmapMinterm, kmapDims,
  findPrimeImplicants, findMinimalCover, formatImplicant, karnaughMinimize,
} from '../baseN'

// ---------- parseBase ----------

describe('parseBase: decimal', () => {
  it('parses 0',   () => expect(parseBase('0',   10)).toBe(0n))
  it('parses 42',  () => expect(parseBase('42',  10)).toBe(42n))
  it('parses 255', () => expect(parseBase('255', 10)).toBe(255n))
  it('rejects letters', () => expect(parseBase('abc', 10)).toBeNull())
  it('empty string returns null', () => expect(parseBase('', 10)).toBeNull())
})

describe('parseBase: binary', () => {
  it('parses 1010 as 10', () => expect(parseBase('1010', 2)).toBe(10n))
  it('parses spaced binary', () => expect(parseBase('1111 1111', 2)).toBe(255n))
  it('rejects digit 2', () => expect(parseBase('2', 2)).toBeNull())
})

describe('parseBase: hex', () => {
  it('parses FF as 255', () => expect(parseBase('FF', 16)).toBe(255n))
  it('parses ff as 255', () => expect(parseBase('ff', 16)).toBe(255n))
  it('parses 1A as 26',  () => expect(parseBase('1A', 16)).toBe(26n))
})

// ---------- format functions (legacy 32-bit) ----------

describe('format functions', () => {
  it('formatBin(0) = 0000',        () => expect(formatBin(0)).toBe('0000'))
  it('formatBin(10) = 1010',       () => expect(formatBin(10)).toBe('1010'))
  it('formatBin(255) = 1111 1111', () => expect(formatBin(255)).toBe('1111 1111'))
  it('formatOct(8) = 10',          () => expect(formatOct(8)).toBe('10'))
  it('formatDec(42) = 42',         () => expect(formatDec(42)).toBe('42'))
  it('formatHex(255) = FF',        () => expect(formatHex(255)).toBe('FF'))
  it('formatHex(26) = 1A',         () => expect(formatHex(26)).toBe('1A'))
})

// ---------- formatAllBases (BigInt) ----------

describe('formatAllBases', () => {
  it('0 -> all zero', () => {
    const r = formatAllBases(0n)
    expect(r.dec).toBe('0'); expect(r.hex).toBe('0'); expect(r.oct).toBe('0')
  })
  it('255 -> FF hex, 377 oct, 1111 1111 bin', () => {
    const r = formatAllBases(255n)
    expect(r.hex).toBe('FF'); expect(r.oct).toBe('377'); expect(r.bin).toBe('1111 1111')
  })
  it('large number does not overflow', () => {
    const big = 2n ** 63n
    expect(formatAllBases(big).dec).toBe('9223372036854775808')
  })
})

// ---------- bitwiseOp (legacy 32-bit) ----------

describe('bitwiseOp: AND', () => {
  it('0b1010 AND 0b1100 = 0b1000', () => expect(bitwiseOp('AND', 10, 12)).toBe(8))
  it('0 AND anything = 0',          () => expect(bitwiseOp('AND', 0, 255)).toBe(0))
})
describe('bitwiseOp: OR',  () => {
  it('0b1010 OR 0b0101 = 0b1111', () => expect(bitwiseOp('OR', 10, 5)).toBe(15))
})
describe('bitwiseOp: XOR', () => {
  it('0b1010 XOR 0b1100 = 0b0110', () => expect(bitwiseOp('XOR', 10, 12)).toBe(6))
  it('n XOR n = 0',                 () => expect(bitwiseOp('XOR', 42, 42)).toBe(0))
})
describe('bitwiseOp: NOT', () => {
  it('NOT 0 = 0xFFFFFFFF',          () => expect(bitwiseOp('NOT', 0, 0)).toBe(0xFFFFFFFF))
  it('NOT 0xFFFFFFFF = 0',          () => expect(bitwiseOp('NOT', 0xFFFFFFFF, 0)).toBe(0))
})
describe('bitwiseOp: shifts', () => {
  it('1 LSH 3 = 8',   () => expect(bitwiseOp('LSH', 1, 3)).toBe(8))
  it('8 RSH 3 = 1',   () => expect(bitwiseOp('RSH', 8, 3)).toBe(1))
  it('RSH is logical', () => expect(bitwiseOp('RSH', 0xFFFFFFFF, 1)).toBe(0x7FFFFFFF))
})

// ---------- evaluateBaseExpr ----------

describe('evaluateBaseExpr: decimal base', () => {
  it('simple addition',       () => expect(evaluateBaseExpr('3 + 4', 10)).toEqual({ ok: true, value: 7n }))
  it('subtraction',           () => expect(evaluateBaseExpr('10 - 3', 10)).toEqual({ ok: true, value: 7n }))
  it('multiplication',        () => expect(evaluateBaseExpr('6 * 7', 10)).toEqual({ ok: true, value: 42n }))
  it('integer division',      () => expect(evaluateBaseExpr('10 / 3', 10)).toEqual({ ok: true, value: 3n }))
  it('modulo',                () => expect(evaluateBaseExpr('10 % 3', 10)).toEqual({ ok: true, value: 1n }))
  it('parentheses',           () => expect(evaluateBaseExpr('(2 + 3) * 4', 10)).toEqual({ ok: true, value: 20n }))
  it('unary minus',           () => expect(evaluateBaseExpr('-5 + 8', 10)).toEqual({ ok: true, value: 3n }))
  it('division by zero error',() => expect(evaluateBaseExpr('5 / 0', 10).ok).toBe(false))
  it('empty expression error',() => expect(evaluateBaseExpr('', 10).ok).toBe(false))
})

describe('evaluateBaseExpr: hex base', () => {
  it('FF + 1A = 281 (0x119)',  () => expect(evaluateBaseExpr('FF + 1A', 16)).toEqual({ ok: true, value: 281n }))
  it('A * B = 110',            () => expect(evaluateBaseExpr('A * B', 16)).toEqual({ ok: true, value: 110n }))
  it('100 - 1 = 255',          () => expect(evaluateBaseExpr('100 - 1', 16)).toEqual({ ok: true, value: 255n }))
  it('rejects invalid digit G',() => expect(evaluateBaseExpr('G', 16).ok).toBe(false))
})

describe('evaluateBaseExpr: binary base', () => {
  it('1010 + 101 = 15',        () => expect(evaluateBaseExpr('1010 + 101', 2)).toEqual({ ok: true, value: 15n }))
  it('rejects digit 2',        () => expect(evaluateBaseExpr('1010 + 2', 2).ok).toBe(false))
})

describe('evaluateBaseExpr: bitwise ops', () => {
  it('AND keyword',  () => expect(evaluateBaseExpr('12 AND 10', 10)).toEqual({ ok: true, value: 8n }))
  it('OR keyword',   () => expect(evaluateBaseExpr('12 OR 3',   10)).toEqual({ ok: true, value: 15n }))
  it('XOR keyword',  () => expect(evaluateBaseExpr('15 XOR 5',  10)).toEqual({ ok: true, value: 10n }))
  it('NOT 0 = 64-bit mask',
    () => expect(evaluateBaseExpr('NOT 0', 10).value).toBe((2n ** 64n) - 1n))
  it('<< operator',  () => expect(evaluateBaseExpr('1 << 3', 10)).toEqual({ ok: true, value: 8n }))
  it('>> operator',  () => expect(evaluateBaseExpr('16 >> 2', 10)).toEqual({ ok: true, value: 4n }))
  it('& symbol',     () => expect(evaluateBaseExpr('12 & 10', 10)).toEqual({ ok: true, value: 8n }))
  it('| symbol',     () => expect(evaluateBaseExpr('12 | 3',  10)).toEqual({ ok: true, value: 15n }))
  it('^ symbol',     () => expect(evaluateBaseExpr('15 ^ 5',  10)).toEqual({ ok: true, value: 10n }))
})

describe('evaluateBaseExpr: large numbers', () => {
  it('2^63 is representable', () => {
    const r = evaluateBaseExpr('9223372036854775808', 10)
    expect(r.ok).toBe(true)
    expect(r.value).toBe(2n ** 63n)
  })
  it('large multiplication', () => {
    const r = evaluateBaseExpr('1000000000 * 1000000000', 10)
    expect(r.ok).toBe(true)
    expect(r.value).toBe(1000000000000000000n)
  })
})

describe('evaluateBaseExpr: mixed-base prefixes', () => {
  it('0b10 in decimal context = 2',    () => expect(evaluateBaseExpr('0b10', 10)).toEqual({ ok: true, value: 2n }))
  it('0xFF in decimal context = 255',  () => expect(evaluateBaseExpr('0xFF', 10)).toEqual({ ok: true, value: 255n }))
  it('0o17 in decimal context = 15',   () => expect(evaluateBaseExpr('0o17', 10)).toEqual({ ok: true, value: 15n }))
  it('0h1A in decimal context = 26',   () => expect(evaluateBaseExpr('0h1A', 10)).toEqual({ ok: true, value: 26n }))
  it('0d42 in binary context = 42',    () => expect(evaluateBaseExpr('0d42', 2)).toEqual({ ok: true, value: 42n }))
  it('A + 0b10 in hex = 12',           () => expect(evaluateBaseExpr('A + 0b10', 16)).toEqual({ ok: true, value: 12n }))
  it('0xFF + 0b10 in decimal = 257',   () => expect(evaluateBaseExpr('0xFF + 0b10', 10)).toEqual({ ok: true, value: 257n }))
  it('0x0 prefix with no digits errors', () => expect(evaluateBaseExpr('0x', 10).ok).toBe(false))
})

// ---------- kmapMinterm ----------

describe('kmapMinterm: 2-var', () => {
  it('(0,0) = 0', () => expect(kmapMinterm(2, 0, 0)).toBe(0))
  it('(0,1) = 1', () => expect(kmapMinterm(2, 0, 1)).toBe(1))
  it('(1,0) = 2', () => expect(kmapMinterm(2, 1, 0)).toBe(2))
  it('(1,1) = 3', () => expect(kmapMinterm(2, 1, 1)).toBe(3))
})

describe('kmapMinterm: 3-var', () => {
  it('(0,0) = 0', () => expect(kmapMinterm(3, 0, 0)).toBe(0))
  it('(0,1) = 1', () => expect(kmapMinterm(3, 0, 1)).toBe(1))
  it('(0,2) = 3', () => expect(kmapMinterm(3, 0, 2)).toBe(3))
  it('(0,3) = 2', () => expect(kmapMinterm(3, 0, 3)).toBe(2))
  it('(1,0) = 4', () => expect(kmapMinterm(3, 1, 0)).toBe(4))
})

describe('kmapMinterm: 5-var Gray code', () => {
  it('(0,0) = 0',  () => expect(kmapMinterm(5, 0, 0)).toBe(0))
  it('(0,1) = 1',  () => expect(kmapMinterm(5, 0, 1)).toBe(1))
  it('(1,0) = 8',  () => expect(kmapMinterm(5, 1, 0)).toBe(8))   // GRAY2[1]=1, GRAY3[0]=0 -> 1<<3|0
  it('(2,0) = 24', () => expect(kmapMinterm(5, 2, 0)).toBe(24))  // GRAY2[2]=3, GRAY3[0]=0 -> 3<<3|0
  it('(3,0) = 16', () => expect(kmapMinterm(5, 3, 0)).toBe(16))  // GRAY2[3]=2, GRAY3[0]=0 -> 2<<3|0
})

describe('kmapMinterm: 6-var Gray code', () => {
  it('(0,0) = 0',  () => expect(kmapMinterm(6, 0, 0)).toBe(0))
  it('(0,1) = 1',  () => expect(kmapMinterm(6, 0, 1)).toBe(1))
  it('(1,0) = 8',  () => expect(kmapMinterm(6, 1, 0)).toBe(8))   // GRAY3[1]=1, GRAY3[0]=0 -> 1<<3|0
  it('(2,0) = 24', () => expect(kmapMinterm(6, 2, 0)).toBe(24))  // GRAY3[2]=3, GRAY3[0]=0 -> 3<<3|0
})

describe('kmapDims', () => {
  it('2 vars: 2x2', () => expect(kmapDims(2)).toEqual({ rows: 2, cols: 2 }))
  it('3 vars: 2x4', () => expect(kmapDims(3)).toEqual({ rows: 2, cols: 4 }))
  it('4 vars: 4x4', () => expect(kmapDims(4)).toEqual({ rows: 4, cols: 4 }))
  it('5 vars: 4x8', () => expect(kmapDims(5)).toEqual({ rows: 4, cols: 8 }))
  it('6 vars: 8x8', () => expect(kmapDims(6)).toEqual({ rows: 8, cols: 8 }))
  it('7 vars: null (flat list)', () => expect(kmapDims(7)).toBeNull())
  it('8 vars: null (flat list)', () => expect(kmapDims(8)).toBeNull())
})

// ---------- karnaughMinimize ----------

describe('karnaughMinimize: 2-var', () => {
  it('all zeros -> 0', () => expect(karnaughMinimize(2, [0, 0, 0, 0])).toBe('0'))
  it('all ones -> 1',  () => expect(karnaughMinimize(2, [1, 1, 1, 1])).toBe('1'))
  it('minterm {3} only -> AB', () => expect(karnaughMinimize(2, [0, 0, 0, 1])).toBe('AB'))
  it('minterms {1,3} -> B',    () => expect(karnaughMinimize(2, [0, 1, 0, 1])).toBe('B'))
  it('minterms {1,2,3} is non-empty', () => expect(karnaughMinimize(2, [0, 1, 1, 1])).toBeTruthy())
})

describe('karnaughMinimize: 3-var', () => {
  it('empty -> 0', () => expect(karnaughMinimize(3, [0,0,0,0,0,0,0,0])).toBe('0'))
  it('all -> 1',   () => expect(karnaughMinimize(3, [1,1,1,1,1,1,1,1])).toBe('1'))
  it('minterms {0,1,2,3} -> A\'', () => {
    expect(karnaughMinimize(3, [1,1,1,1,0,0,0,0])).toBe("A'")
  })
})

describe('karnaughMinimize: 5-var', () => {
  it('all zeros -> 0', () => expect(karnaughMinimize(5, Array(32).fill(0))).toBe('0'))
  it('all ones -> 1',  () => expect(karnaughMinimize(5, Array(32).fill(1))).toBe('1'))
  it('single minterm -> 5-literal term', () => {
    const cells = Array(32).fill(0); cells[0] = 1
    const r = karnaughMinimize(5, cells)
    expect(r).toBeTruthy(); expect(r).not.toBe('0')
  })
})

describe('karnaughMinimize: don\'t cares', () => {
  it('minterm + adjacent DC simplifies', () => {
    const cells = Array(8).fill(0)
    cells[1] = 1; cells[3] = 2  // 3-var: m1 = minterm, m3 = DC
    const r = karnaughMinimize(3, cells)
    expect(r).toBeTruthy(); expect(r).not.toBe('0')
  })
})

// ---------- formatImplicant ----------

describe('formatImplicant', () => {
  it('mask=0 value=3 (2-var) -> AB',    () => expect(formatImplicant({ value: 3, mask: 0 }, 2)).toBe('AB'))
  it('mask=0 value=0 (2-var) -> A\'B\'', () => expect(formatImplicant({ value: 0, mask: 0 }, 2)).toBe("A'B'"))
  it('mask=1 value=2 -> A',             () => expect(formatImplicant({ value: 2, mask: 1 }, 2)).toBe('A'))
  it('mask=2 value=1 -> B',             () => expect(formatImplicant({ value: 1, mask: 2 }, 2)).toBe('B'))
  it('all masked -> 1',                 () => expect(formatImplicant({ value: 0, mask: 3 }, 2)).toBe('1'))
})
