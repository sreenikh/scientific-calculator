import { describe, it, expect } from 'vitest'
import { oneVarStats, twoVarStats, multiVarStats, percentile, mode } from '../stats.js'

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

describe('mode function', () => {
  it('single mode', () => expect(mode([1, 2, 2, 3])).toEqual([2]))
  it('bimodal', () => expect(mode([1, 1, 2, 2, 3])).toEqual([1, 2]))
  it('all unique returns empty (no mode)', () => expect(mode([1, 2, 3])).toEqual([]))
  it('empty array returns empty', () => expect(mode([])).toEqual([]))
  it('all same value is that value', () => expect(mode([5, 5, 5])).toEqual([5]))
  it('modes are sorted ascending', () => expect(mode([3, 3, 1, 1, 2])).toEqual([1, 3]))
})

describe('oneVarStats: additional fields', () => {
  const data = [1, 2, 3, 4, 5]
  it('sumx2 = Σx²', () => expect(oneVarStats(data).sumx2).toBeCloseTo(1+4+9+16+25, 10))
  it('iqr = Q3 - Q1', () => {
    const r = oneVarStats(data)
    expect(r.iqr).toBeCloseTo(r.q3 - r.q1, 10)
  })
  it('range = max - min', () => expect(oneVarStats(data).range).toBeCloseTo(4, 10))
  it('sample variance = population variance * n/(n-1)', () => {
    const r = oneVarStats(data)
    expect(r.sampleVariance).toBeCloseTo(r.variance * 5 / 4, 10)
  })
  it('sample std dev = sqrt(sample variance)', () => {
    const r = oneVarStats(data)
    expect(r.sampleStddev).toBeCloseTo(Math.sqrt(r.sampleVariance), 10)
  })
  it('sample variance is NaN for n=1', () => {
    expect(oneVarStats([42]).sampleVariance).toBeNaN()
  })
  it('mode included in result', () => {
    expect(oneVarStats([1, 2, 2, 3]).mode).toEqual([2])
  })
})

describe('oneVarStats: CV, SEM, skewness, kurtosis', () => {
  it('CV = sampleStddev / mean', () => {
    const r = oneVarStats([2, 4, 4, 4, 5, 5, 7, 9])
    expect(r.cv).toBeCloseTo(r.sampleStddev / r.mean, 10)
  })
  it('CV is NaN when mean is zero', () => {
    expect(oneVarStats([-1, 0, 1]).cv).toBeNaN()
  })
  it('SEM = sampleStddev / sqrt(n)', () => {
    const r = oneVarStats([2, 4, 4, 4, 5, 5, 7, 9])
    expect(r.sem).toBeCloseTo(r.sampleStddev / Math.sqrt(r.n), 10)
  })
  it('SEM is NaN for n=1', () => {
    expect(oneVarStats([5]).sem).toBeNaN()
  })
  it('skewness is NaN for n < 3', () => {
    expect(oneVarStats([1, 2]).skewness).toBeNaN()
  })
  it('symmetric dataset has skewness near 0', () => {
    expect(oneVarStats([1, 2, 3, 4, 5]).skewness).toBeCloseTo(0, 8)
  })
  it('right-skewed dataset has positive skewness', () => {
    expect(oneVarStats([1, 1, 1, 1, 10]).skewness).toBeGreaterThan(0)
  })
  it('left-skewed dataset has negative skewness', () => {
    expect(oneVarStats([1, 10, 10, 10, 10]).skewness).toBeLessThan(0)
  })
  it('kurtosis is NaN for n < 4', () => {
    expect(oneVarStats([1, 2, 3]).kurtosis).toBeNaN()
  })
  it('normal-ish dataset has excess kurtosis near 0', () => {
    // uniform distribution on [1..6] has excess kurtosis -1.2 (platykurtic)
    const r = oneVarStats([1, 2, 3, 4, 5, 6])
    expect(r.kurtosis).toBeLessThan(0)
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

// ── multi-variable regression ────────────────────────────────────────────────

describe('multiVarStats: k=2 perfect fit', () => {
  // Perfect y = 1 + 2*x1 + 3*x2
  const data = [
    [1, 1, 6],
    [2, 1, 8],
    [1, 2, 9],
    [2, 2, 11],
    [3, 1, 10],
    [3, 2, 13],
  ]

  it('returns ok: true', () => expect(multiVarStats(data, 2).ok).toBe(true))
  it('b0 ≈ 1', () => expect(multiVarStats(data, 2).coeffs[0]).toBeCloseTo(1, 6))
  it('b1 ≈ 2', () => expect(multiVarStats(data, 2).coeffs[1]).toBeCloseTo(2, 6))
  it('b2 ≈ 3', () => expect(multiVarStats(data, 2).coeffs[2]).toBeCloseTo(3, 6))
  it('r² = 1 for perfect fit', () => expect(multiVarStats(data, 2).r2).toBeCloseTo(1, 8))
  it('adjR2 = 1 for perfect fit', () => expect(multiVarStats(data, 2).adjR2).toBeCloseTo(1, 6))
  it('n = 6', () => expect(multiVarStats(data, 2).n).toBe(6))
  it('k = 2', () => expect(multiVarStats(data, 2).k).toBe(2))
})

describe('multiVarStats: k=3', () => {
  // Perfect y = 1 + x1 + 2*x2 + 3*x3
  const data = Array.from({ length: 8 }, (_, i) => {
    const x1 = (i % 2) + 1, x2 = Math.floor(i / 2) % 2 + 1, x3 = Math.floor(i / 4) + 1
    return [x1, x2, x3, 1 + x1 + 2 * x2 + 3 * x3]
  })

  it('returns ok: true', () => expect(multiVarStats(data, 3).ok).toBe(true))
  it('b0 ≈ 1', () => expect(multiVarStats(data, 3).coeffs[0]).toBeCloseTo(1, 5))
  it('b1 ≈ 1', () => expect(multiVarStats(data, 3).coeffs[1]).toBeCloseTo(1, 5))
  it('b2 ≈ 2', () => expect(multiVarStats(data, 3).coeffs[2]).toBeCloseTo(2, 5))
  it('b3 ≈ 3', () => expect(multiVarStats(data, 3).coeffs[3]).toBeCloseTo(3, 5))
  it('r² = 1', () => expect(multiVarStats(data, 3).r2).toBeCloseTo(1, 8))
})

describe('multiVarStats: edge cases', () => {
  it('returns error when too few points for k=2', () => {
    const data = [[1, 1, 2], [2, 2, 4]]   // needs >= 4 points
    expect(multiVarStats(data, 2).ok).toBe(false)
  })
  it('error message mentions minimum required', () => {
    expect(multiVarStats([[1,1,2]], 2).error).toContain('4')
  })
  it('rows with NaN are filtered out', () => {
    const data = [
      [1, 1, 6], [2, 1, 8], [1, 2, 9], [2, 2, 11], [NaN, 1, 10], [3, 2, 13],
    ]
    expect(multiVarStats(data, 2).n).toBe(5)
  })
  it('collinear predictors return error', () => {
    // x2 = 2*x1 always: XtX is singular
    const data = [[1,2,3],[2,4,5],[3,6,7],[4,8,9],[5,10,11]]
    expect(multiVarStats(data, 2).ok).toBe(false)
  })
})
