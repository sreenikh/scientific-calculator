import { math } from './mathEngine'

// ── Normal distribution ──────────────────────────────────────────────────────

export function normalPdf(x, mu, sigma) {
  if (sigma <= 0) return NaN
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

export function normalCdf(x, mu, sigma) {
  if (sigma <= 0) return NaN
  const z = (x - mu) / (sigma * Math.SQRT2)
  return 0.5 * (1 + math.erf(z))
}

// Acklam's rational approximation, max error ~1.15e-9
function standardNormalInv(p) {
  const a = [-3.969683028665376e+01,  2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01,  2.506628277459239e+00]
  const b = [-5.447609879822406e+01,  1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00,  4.374664141464968e+00,  2.938163982698783e+00]
  const d = [ 7.784695709041462e-03,  3.223785886130946e-01,  2.445134137142996e+00,
               3.754408661907416e+00]
  const pLo = 0.02425
  const pHi = 1 - pLo
  let q, r
  if (p < pLo) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
  }
  if (p <= pHi) {
    q = p - 0.5; r = q * q
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
  }
  q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
}

export function normalInv(p, mu, sigma) {
  if (p <= 0 || p >= 1 || sigma <= 0) return NaN
  return mu + sigma * standardNormalInv(p)
}

// ── Binomial distribution ────────────────────────────────────────────────────

// Log of C(n, k) via lgamma to avoid integer overflow for large n
function logBinomCoeff(n, k) {
  return math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)
}

export function binomialPdf(k, n, p) {
  k = Math.round(k)
  if (!Number.isInteger(n) || n < 1 || k < 0 || k > n || p < 0 || p > 1) return NaN
  if (p === 0) return k === 0 ? 1 : 0
  if (p === 1) return k === n ? 1 : 0
  const logP = logBinomCoeff(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p)
  return Math.exp(logP)
}

export function binomialCdf(k, n, p) {
  k = Math.floor(k)
  if (!Number.isInteger(n) || n < 1 || k < 0 || p < 0 || p > 1) return NaN
  if (k >= n) return 1
  let sum = 0
  for (let i = 0; i <= k; i++) sum += binomialPdf(i, n, p)
  return Math.min(1, sum)
}
