import { describe, it, expect } from 'vitest'
import { oneVarStats, twoVarStats, percentile } from '../stats.js'

// ── 1-variable stats ────────────────────────────────────────────────────────

describe('oneVarStats: basic properties', () => {
  const data = [2, 4, 4, 4, 5, 5, 7, 9]  // classic std-dev example, σ = 2
  let r

  it('returns ok: true for valid data', () => {
    r = oneVarStats(data)
    expect(r.ok).toBe(true)
  })
  it('n', () => expect(oneVarStats(data).n).toBe(8))
  it('sum', () => expect(oneVarStats(data).sum).toBeCloseTo(40, 10))
  it('mean', () => expect(oneVarStats(data).mean).toBeCloseTo(5, 10))
  it('population std dev', () => expect(oneVarStats(data).stddev).toBeCloseTo(2, 10))
  it('variance', () => expect(oneVarStats(data).variance).toBeCloseTo(4, 10))
  it('min', () => expect(oneVarStats(data).min).toBe(2))
  it('max', () => expect(oneVarStats(data).max).toBe(9))
})

describe('oneVarStats: median and quartiles', () => {
  it('median of even-length dataset', () => {
    expect(oneVarStats([1, 3, 5, 7]).median).toBeCloseTo(4, 10)
  })
  it('median of odd-length dataset', () => {
    expect(oneVarStats([1, 3, 5]).median).toBeCloseTo(3, 10)
  })
  it('Q1 of [1,2,3,4,5,6,7,8] (linear interpolation P25)', () => {
    expect(oneVarStats([1,2,3,4,5,6,7,8]).q1).toBeCloseTo(2.75, 10)
  })
  it('Q3 of [1,2,3,4,5,6,7,8] (linear interpolation P75)', () => {
    expect(oneVarStats([1,2,3,4,5,6,7,8]).q3).toBeCloseTo(6.25, 10)
  })
  it('single element: median = that element', () => {
    expect(oneVarStats([42]).median).toBe(42)
  })
})

describe('oneVarStats: edge cases', () => {
  it('returns error for empty array', () => {
    expect(oneVarStats([]).ok).toBe(false)
  })
  it('ignores NaN entries', () => {
    expect(oneVarStats([1, NaN, 3]).n).toBe(2)
  })
  it('single-element dataset has variance 0', () => {
    expect(oneVarStats([5]).variance).toBeCloseTo(0, 10)
  })
  it('constant dataset has std dev 0', () => {
    expect(oneVarStats([3, 3, 3, 3]).stddev).toBeCloseTo(0, 10)
  })
})

describe('percentile function', () => {
  const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  it('P0 returns min', () => expect(percentile(sorted, 0)).toBe(1))
  it('P100 returns max', () => expect(percentile(sorted, 100)).toBe(10))
  it('P50 returns median', () => expect(percentile(sorted, 50)).toBeCloseTo(5.5, 10))
  it('P25 interpolates correctly', () => expect(percentile(sorted, 25)).toBeCloseTo(3.25, 10))
  it('P75 interpolates correctly', () => expect(percentile(sorted, 75)).toBeCloseTo(7.75, 10))
  it('P10 of [1..10]', () => expect(percentile(sorted, 10)).toBeCloseTo(1.9, 10))
  it('P90 of [1..10]', () => expect(percentile(sorted, 90)).toBeCloseTo(9.1, 10))
  it('single element always returns that element', () => {
    expect(percentile([42], 0)).toBe(42)
    expect(percentile([42], 50)).toBe(42)
    expect(percentile([42], 100)).toBe(42)
  })
  it('empty array returns NaN', () => expect(percentile([], 50)).toBeNaN())
  it('exact index (no interpolation needed)', () => expect(percentile([10, 20, 30], 50)).toBe(20))
})

// ── 2-variable: linear regression ───────────────────────────────────────────

describe('twoVarStats: linear regression', () => {
  // Perfect line y = 2x + 1
  const xs = [1, 2, 3, 4, 5]
  const ys = [3, 5, 7, 9, 11]

  it('returns ok: true', () => expect(twoVarStats(xs, ys, 'linear').ok).toBe(true))
  it('a = 1', () => expect(twoVarStats(xs, ys, 'linear').a).toBeCloseTo(1, 8))
  it('b = 2', () => expect(twoVarStats(xs, ys, 'linear').b).toBeCloseTo(2, 8))
  it('r = 1 for perfect fit', () => expect(twoVarStats(xs, ys, 'linear').r).toBeCloseTo(1, 8))
  it('r² = 1 for perfect fit', () => expect(twoVarStats(xs, ys, 'linear').r2).toBeCloseTo(1, 8))
  it('negative correlation: r close to -1', () => {
    const r = twoVarStats([1,2,3], [3,2,1], 'linear')
    expect(r.r).toBeCloseTo(-1, 8)
  })
  it('returns error for < 2 points', () => {
    expect(twoVarStats([1], [1], 'linear').ok).toBe(false)
  })
  it('returns error when all x identical', () => {
    expect(twoVarStats([2,2,2], [1,2,3], 'linear').ok).toBe(false)
  })
})

// ── 2-variable: quadratic regression ────────────────────────────────────────

describe('twoVarStats: quadratic regression', () => {
  // Perfect parabola y = x² + 2x + 3
  const xs = [0, 1, 2, 3, 4]
  const ys = xs.map(x => x * x + 2 * x + 3)

  it('returns ok: true', () => expect(twoVarStats(xs, ys, 'quadratic').ok).toBe(true))
  it('a ≈ 3', () => expect(twoVarStats(xs, ys, 'quadratic').a).toBeCloseTo(3, 6))
  it('b ≈ 2', () => expect(twoVarStats(xs, ys, 'quadratic').b).toBeCloseTo(2, 6))
  it('c ≈ 1', () => expect(twoVarStats(xs, ys, 'quadratic').c).toBeCloseTo(1, 6))
  it('r² ≈ 1 for perfect fit', () => expect(twoVarStats(xs, ys, 'quadratic').r2).toBeCloseTo(1, 6))
  it('returns error for < 3 points', () => {
    expect(twoVarStats([1,2], [1,2], 'quadratic').ok).toBe(false)
  })
})

// ── 2-variable: exponential regression ──────────────────────────────────────

describe('twoVarStats: exponential regression', () => {
  // Perfect y = 2 * e^(0.5x)
  const xs = [0, 1, 2, 3, 4]
  const ys = xs.map(x => 2 * Math.exp(0.5 * x))

  it('returns ok: true', () => expect(twoVarStats(xs, ys, 'exponential').ok).toBe(true))
  it('a ≈ 2', () => expect(twoVarStats(xs, ys, 'exponential').a).toBeCloseTo(2, 6))
  it('b ≈ 0.5', () => expect(twoVarStats(xs, ys, 'exponential').b).toBeCloseTo(0.5, 6))
  it('r² ≈ 1 for perfect fit', () => expect(twoVarStats(xs, ys, 'exponential').r2).toBeCloseTo(1, 8))
  it('returns error when y <= 0', () => {
    expect(twoVarStats([1,2,3], [1,-1,3], 'exponential').ok).toBe(false)
  })
})

// ── 2-variable: power regression ────────────────────────────────────────────

describe('twoVarStats: power regression', () => {
  // Perfect y = 3 * x^2
  const xs = [1, 2, 3, 4, 5]
  const ys = xs.map(x => 3 * x * x)

  it('returns ok: true', () => expect(twoVarStats(xs, ys, 'power').ok).toBe(true))
  it('a ≈ 3', () => expect(twoVarStats(xs, ys, 'power').a).toBeCloseTo(3, 6))
  it('b ≈ 2', () => expect(twoVarStats(xs, ys, 'power').b).toBeCloseTo(2, 6))
  it('r² ≈ 1 for perfect fit', () => expect(twoVarStats(xs, ys, 'power').r2).toBeCloseTo(1, 8))
  it('returns error when x <= 0', () => {
    expect(twoVarStats([0,1,2], [1,2,3], 'power').ok).toBe(false)
  })
  it('returns error when y <= 0', () => {
    expect(twoVarStats([1,2,3], [0,1,2], 'power').ok).toBe(false)
  })
})
