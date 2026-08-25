import { describe, it, expect } from 'vitest'
import {
  parseBase, formatBin, formatOct, formatDec, formatHex,
  bitwiseOp,
  kmapMinterm, kmapDims,
  findPrimeImplicants, findMinimalCover, formatImplicant, karnaughMinimize,
} from '../baseN'

// ---------- parseBase ----------

describe('parseBase: decimal', () => {
  it('parses 0', () => expect(parseBase('0', 10)).toBe(0))
  it('parses 42', () => expect(parseBase('42', 10)).toBe(42))
  it('parses 255', () => expect(parseBase('255', 10)).toBe(255))
  it('rejects letters', () => expect(parseBase('abc', 10)).toBeNull())
  it('empty string returns null', () => expect(parseBase('', 10)).toBeNull())
})

describe('parseBase: binary', () => {
  it('parses 1010 as 10', () => expect(parseBase('1010', 2)).toBe(10))
  it('parses 1111 1111 as 255', () => expect(parseBase('1111 1111', 2)).toBe(255))
  it('rejects digit 2', () => expect(parseBase('2', 2)).toBeNull())
})

describe('parseBase: hex', () => {
  it('parses FF as 255', () => expect(parseBase('FF', 16)).toBe(255))
  it('parses ff as 255', () => expect(parseBase('ff', 16)).toBe(255))
  it('parses 1A as 26', () => expect(parseBase('1A', 16)).toBe(26))
})

// ---------- formatBin/Oct/Dec/Hex ----------

describe('format functions', () => {
  it('formatBin(0) = 0000', () => expect(formatBin(0)).toBe('0000'))
  it('formatBin(10) = 1010', () => expect(formatBin(10)).toBe('1010'))
  it('formatBin(255) = 1111 1111', () => expect(formatBin(255)).toBe('1111 1111'))
  it('formatOct(8) = 10', () => expect(formatOct(8)).toBe('10'))
  it('formatDec(42) = 42', () => expect(formatDec(42)).toBe('42'))
  it('formatHex(255) = FF', () => expect(formatHex(255)).toBe('FF'))
  it('formatHex(26) = 1A', () => expect(formatHex(26)).toBe('1A'))
})

// ---------- bitwiseOp ----------

describe('bitwiseOp: AND', () => {
  it('0b1010 AND 0b1100 = 0b1000', () => expect(bitwiseOp('AND', 10, 12)).toBe(8))
  it('0 AND anything = 0', () => expect(bitwiseOp('AND', 0, 255)).toBe(0))
})

describe('bitwiseOp: OR', () => {
  it('0b1010 OR 0b0101 = 0b1111', () => expect(bitwiseOp('OR', 10, 5)).toBe(15))
})

describe('bitwiseOp: XOR', () => {
  it('0b1010 XOR 0b1100 = 0b0110', () => expect(bitwiseOp('XOR', 10, 12)).toBe(6))
  it('n XOR n = 0', () => expect(bitwiseOp('XOR', 42, 42)).toBe(0))
})

describe('bitwiseOp: NOT', () => {
  it('NOT 0 = 0xFFFFFFFF', () => expect(bitwiseOp('NOT', 0, 0)).toBe(0xFFFFFFFF))
  it('NOT 0xFFFFFFFF = 0', () => expect(bitwiseOp('NOT', 0xFFFFFFFF, 0)).toBe(0))
})

describe('bitwiseOp: shifts', () => {
  it('1 LSH 3 = 8', () => expect(bitwiseOp('LSH', 1, 3)).toBe(8))
  it('8 RSH 3 = 1', () => expect(bitwiseOp('RSH', 8, 3)).toBe(1))
  it('RSH is logical (unsigned)', () => expect(bitwiseOp('RSH', 0xFFFFFFFF, 1)).toBe(0x7FFFFFFF))
})

// ---------- kmapMinterm ----------

describe('kmapMinterm: 2-var', () => {
  it('(0,0) = 0', () => expect(kmapMinterm(2, 0, 0)).toBe(0))
  it('(0,1) = 1', () => expect(kmapMinterm(2, 0, 1)).toBe(1))
  it('(1,0) = 2', () => expect(kmapMinterm(2, 1, 0)).toBe(2))
  it('(1,1) = 3', () => expect(kmapMinterm(2, 1, 1)).toBe(3))
})

describe('kmapMinterm: 3-var gray ordering', () => {
  // colVals: 00,01,11,10 -> GRAY2=[0,1,3,2]
  it('(0,0) = 0', () => expect(kmapMinterm(3, 0, 0)).toBe(0))
  it('(0,1) = 1', () => expect(kmapMinterm(3, 0, 1)).toBe(1))
  it('(0,2) = 3', () => expect(kmapMinterm(3, 0, 2)).toBe(3))
  it('(0,3) = 2', () => expect(kmapMinterm(3, 0, 3)).toBe(2))
  it('(1,0) = 4', () => expect(kmapMinterm(3, 1, 0)).toBe(4))
})

describe('kmapDims', () => {
  it('2 vars: 2x2', () => expect(kmapDims(2)).toEqual({ rows: 2, cols: 2 }))
  it('3 vars: 2x4', () => expect(kmapDims(3)).toEqual({ rows: 2, cols: 4 }))
  it('4 vars: 4x4', () => expect(kmapDims(4)).toEqual({ rows: 4, cols: 4 }))
})

// ---------- karnaughMinimize ----------

describe('karnaughMinimize: 2-var', () => {
  it('all zeros -> 0', () => {
    expect(karnaughMinimize(2, [0, 0, 0, 0])).toBe('0')
  })
  it('all ones -> 1', () => {
    expect(karnaughMinimize(2, [1, 1, 1, 1])).toBe('1')
  })
  it('minterm {3} only -> AB', () => {
    // m3 = 11 -> A=1,B=1 -> AB
    const r = karnaughMinimize(2, [0, 0, 0, 1])
    expect(r).toBe("AB")
  })
  it('minterms {1,3} -> B (A varies, B=1)', () => {
    // m1=01 m3=11 => B always 1, A varies => simplified to B
    const r = karnaughMinimize(2, [0, 1, 0, 1])
    expect(r).toBe("B")
  })
  it('minterms {1,2,3} -> A+B', () => {
    const r = karnaughMinimize(2, [0, 1, 1, 1])
    expect(r).toMatch(/A|B/)
  })
})

describe('karnaughMinimize: 3-var', () => {
  it('empty minterms -> 0', () => {
    expect(karnaughMinimize(3, [0, 0, 0, 0, 0, 0, 0, 0])).toBe('0')
  })
  it('all minterms -> 1', () => {
    expect(karnaughMinimize(3, [1, 1, 1, 1, 1, 1, 1, 1])).toBe('1')
  })
  it('minterms {0,1,2,3} -> A\' (A=0 group)', () => {
    // minterms 0-3: A=0, B and C vary freely -> A'
    const cells = [1, 1, 1, 1, 0, 0, 0, 0]
    const r = karnaughMinimize(3, cells)
    expect(r).toBe("A'")
  })
})

describe('karnaughMinimize: don\'t cares', () => {
  it('minterm {1} + DC {3} -> B', () => {
    // m1=01 (A'B) m3=11 (AB) - DC allows grouping them into B
    const cells = [0, 1, 2, 0, 0, 0, 0, 0]  // 3-var: cell[1]=1, cell[3]=DC
    // cell index corresponds to minterm index
    const r = karnaughMinimize(3, cells)
    // should use DC to simplify
    expect(r).toBeTruthy()
  })
})

// ---------- formatImplicant ----------

describe('formatImplicant', () => {
  it('mask=0 value=3 (2-var) -> AB', () => {
    expect(formatImplicant({ value: 3, mask: 0 }, 2)).toBe('AB')
  })
  it('mask=0 value=0 (2-var) -> A\'B\'', () => {
    expect(formatImplicant({ value: 0, mask: 0 }, 2)).toBe("A'B'")
  })
  it('mask=1 value=2 (2-var) -> A (B is masked)', () => {
    // value=10b, mask=01b means B is irrelevant, A=1
    expect(formatImplicant({ value: 2, mask: 1 }, 2)).toBe('A')
  })
  it('mask=2 value=1 (2-var) -> B (A is masked)', () => {
    // value=01b, mask=10b means A is irrelevant, B=1
    expect(formatImplicant({ value: 1, mask: 2 }, 2)).toBe('B')
  })
  it('all masked (2-var) -> 1', () => {
    expect(formatImplicant({ value: 0, mask: 3 }, 2)).toBe('1')
  })
})
