import { describe, it, expect } from 'vitest'
import { normalPdf, normalCdf, normalInv, binomialPdf, binomialCdf } from '../distributions.js'

// ── Normal: pdf ──────────────────────────────────────────────────────────────

describe('normalPdf', () => {
  it('standard normal at x=0: 1/sqrt(2pi)', () => {
    expect(normalPdf(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 10)
  })
  it('symmetric: pdf(-x) = pdf(x)', () => {
    expect(normalPdf(-1, 0, 1)).toBeCloseTo(normalPdf(1, 0, 1), 10)
  })
  it('N(5,2): peak at mean', () => {
    expect(normalPdf(5, 5, 2)).toBeGreaterThan(normalPdf(3, 5, 2))
  })
  it('sigma <= 0 returns NaN', () => {
    expect(normalPdf(0, 0, 0)).toBeNaN()
    expect(normalPdf(0, 0, -1)).toBeNaN()
  })
})

// ── Normal: cdf ──────────────────────────────────────────────────────────────

describe('normalCdf', () => {
  it('P(X <= mean) = 0.5', () => {
    expect(normalCdf(0, 0, 1)).toBeCloseTo(0.5, 10)
    expect(normalCdf(5, 5, 2)).toBeCloseTo(0.5, 10)
  })
  it('P(X <= mean + sigma) ≈ 0.8413', () => {
    expect(normalCdf(1, 0, 1)).toBeCloseTo(0.8413, 4)
  })
  it('P(X <= mean - sigma) ≈ 0.1587', () => {
    expect(normalCdf(-1, 0, 1)).toBeCloseTo(0.1587, 4)
  })
  it('P(X <= mean + 2*sigma) ≈ 0.9772', () => {
    expect(normalCdf(2, 0, 1)).toBeCloseTo(0.9772, 4)
  })
  it('cdf is monotone increasing', () => {
    expect(normalCdf(1, 0, 1)).toBeGreaterThan(normalCdf(0, 0, 1))
  })
  it('complement: cdf(x) + cdf(-x) = 1 for standard normal', () => {
    expect(normalCdf(1.5, 0, 1) + normalCdf(-1.5, 0, 1)).toBeCloseTo(1, 10)
  })
  it('sigma <= 0 returns NaN', () => {
    expect(normalCdf(0, 0, 0)).toBeNaN()
  })
})

// ── Normal: inverse cdf ──────────────────────────────────────────────────────

describe('normalInv', () => {
  it('inv(0.5) = mean', () => {
    expect(normalInv(0.5, 0, 1)).toBeCloseTo(0, 10)
    expect(normalInv(0.5, 5, 2)).toBeCloseTo(5, 10)
  })
  it('inv(0.8413) ≈ 1 for standard normal', () => {
    expect(normalInv(0.8413, 0, 1)).toBeCloseTo(1, 3)
  })
  it('inv(0.1587) ≈ -1 for standard normal', () => {
    expect(normalInv(0.1587, 0, 1)).toBeCloseTo(-1, 3)
  })
  it('inv(0.975) ≈ 1.96 (95% CI boundary)', () => {
    expect(normalInv(0.975, 0, 1)).toBeCloseTo(1.96, 2)
  })
  it('roundtrip: inv(cdf(x)) ≈ x', () => {
    const x = 1.23
    expect(normalInv(normalCdf(x, 0, 1), 0, 1)).toBeCloseTo(x, 8)
  })
  it('p <= 0 returns NaN', () => expect(normalInv(0, 0, 1)).toBeNaN())
  it('p >= 1 returns NaN', () => expect(normalInv(1, 0, 1)).toBeNaN())
  it('sigma <= 0 returns NaN', () => expect(normalInv(0.5, 0, 0)).toBeNaN())
})

// ── Binomial: pdf ────────────────────────────────────────────────────────────

describe('binomialPdf', () => {
  it('B(10, 0.5): P(X=5) ≈ 0.2461', () => {
    expect(binomialPdf(5, 10, 0.5)).toBeCloseTo(0.24609375, 8)
  })
  it('B(1, 0.3): P(X=0) = 0.7', () => {
    expect(binomialPdf(0, 1, 0.3)).toBeCloseTo(0.7, 10)
  })
  it('B(1, 0.3): P(X=1) = 0.3', () => {
    expect(binomialPdf(1, 1, 0.3)).toBeCloseTo(0.3, 10)
  })
  it('probabilities sum to 1 for small n', () => {
    const n = 5, p = 0.4
    const total = [0,1,2,3,4,5].reduce((s, k) => s + binomialPdf(k, n, p), 0)
    expect(total).toBeCloseTo(1, 10)
  })
  it('p=0: P(X=0)=1, P(X>0)=0', () => {
    expect(binomialPdf(0, 5, 0)).toBe(1)
    expect(binomialPdf(1, 5, 0)).toBe(0)
  })
  it('p=1: P(X=n)=1, P(X<n)=0', () => {
    expect(binomialPdf(5, 5, 1)).toBe(1)
    expect(binomialPdf(4, 5, 1)).toBe(0)
  })
  it('k > n returns NaN', () => expect(binomialPdf(6, 5, 0.5)).toBeNaN())
  it('k < 0 returns NaN', () => expect(binomialPdf(-1, 5, 0.5)).toBeNaN())
  it('large n: B(100, 0.5) P(X=50) is valid probability', () => {
    const v = binomialPdf(50, 100, 0.5)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(1)
  })
})

// ── Binomial: cdf ────────────────────────────────────────────────────────────

describe('binomialCdf', () => {
  it('P(X <= n) = 1', () => {
    expect(binomialCdf(10, 10, 0.5)).toBe(1)
  })
  it('P(X <= 0) = P(X=0)', () => {
    expect(binomialCdf(0, 10, 0.5)).toBeCloseTo(binomialPdf(0, 10, 0.5), 10)
  })
  it('B(10, 0.5): P(X <= 5) ≈ 0.6230', () => {
    expect(binomialCdf(5, 10, 0.5)).toBeCloseTo(0.623046875, 8)
  })
  it('cdf is non-decreasing', () => {
    expect(binomialCdf(4, 10, 0.3)).toBeLessThanOrEqual(binomialCdf(5, 10, 0.3))
  })
  it('cdf(floor(k)) = cdf(k) for non-integer k', () => {
    expect(binomialCdf(4.9, 10, 0.5)).toBeCloseTo(binomialCdf(4, 10, 0.5), 10)
  })
})
