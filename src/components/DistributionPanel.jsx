import { useState } from 'react'
import { normalPdf, normalCdf, normalInv, binomialPdf, binomialCdf } from '../engine/distributions'
import { math } from '../engine/mathEngine'

function fmt(n) {
  if (n === undefined || n === null) return ''
  if (Number.isNaN(n)) return 'Error'
  if (!isFinite(n)) return n > 0 ? '+inf' : '-inf'
  return math.format(n, { precision: 10 })
}

function Field({ label, value, onChange, placeholder, step }) {
  return (
    <div className="dist-field">
      <span className="dist-field-label">{label}</span>
      <input
        className="dist-field-input"
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
      />
    </div>
  )
}

export default function DistributionPanel({ onClose }) {
  const [tab,    setTab]    = useState('normal')
  const [fn,     setFn]     = useState('pdf')
  const [result, setResult] = useState(null)

  // Normal params
  const [mu,    setMu]    = useState('0')
  const [sigma, setSigma] = useState('1')
  const [nx,    setNx]    = useState('')
  const [np,    setNp]    = useState('')

  // Binomial params
  const [bn,  setBn]  = useState('')
  const [bp,  setBp]  = useState('')
  const [bk,  setBk]  = useState('')

  function switchTab(t) {
    setTab(t)
    setFn('pdf')
    setResult(null)
  }

  function switchFn(f) {
    setFn(f)
    setResult(null)
  }

  function compute() {
    if (tab === 'normal') {
      const muV    = parseFloat(mu)
      const sigmaV = parseFloat(sigma)
      if (fn === 'pdf') {
        const xV = parseFloat(nx)
        setResult({ label: 'P(X = ' + nx + ')', value: normalPdf(xV, muV, sigmaV) })
      } else if (fn === 'cdf') {
        const xV = parseFloat(nx)
        setResult({ label: 'P(X ≤ ' + nx + ')', value: normalCdf(xV, muV, sigmaV) })
      } else {
        const pV = parseFloat(np)
        setResult({ label: 'x at P = ' + np, value: normalInv(pV, muV, sigmaV) })
      }
    } else {
      const nV = parseInt(bn, 10)
      const pV = parseFloat(bp)
      const kV = parseInt(bk, 10)
      if (fn === 'pdf') {
        setResult({ label: 'P(X = ' + bk + ')', value: binomialPdf(kV, nV, pV) })
      } else {
        setResult({ label: 'P(X ≤ ' + bk + ')', value: binomialCdf(kV, nV, pV) })
      }
    }
  }

  const normalFns  = [
    { id: 'pdf', label: 'pdf'  },
    { id: 'cdf', label: 'cdf'  },
    { id: 'inv', label: 'inv'  },
  ]
  const binomFns = [
    { id: 'pdf', label: 'pdf' },
    { id: 'cdf', label: 'cdf' },
  ]
  const fns = tab === 'normal' ? normalFns : binomFns

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Distributions</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      <div className="ov-tabs">
        <button className={tab === 'normal' ? 'active' : ''} onClick={() => switchTab('normal')}>Normal</button>
        <button className={tab === 'binomial' ? 'active' : ''} onClick={() => switchTab('binomial')}>Binomial</button>
      </div>

      <div className="dist-section-label">Parameters</div>

      {tab === 'normal' && (
        <>
          <Field label="μ (mean)"  value={mu}    onChange={setMu}    placeholder="0" step="any" />
          <Field label="σ (std dev)" value={sigma} onChange={setSigma} placeholder="1" step="any" />
        </>
      )}

      {tab === 'binomial' && (
        <>
          <Field label="n (trials)"  value={bn} onChange={setBn} placeholder="10" step="1" />
          <Field label="p (prob)"    value={bp} onChange={setBp} placeholder="0.5" step="any" />
        </>
      )}

      <div className="dist-section-label">Function</div>
      <div className="dist-fn-row">
        {fns.map(f => (
          <button
            key={f.id}
            className={'dist-fn-btn' + (fn === f.id ? ' active' : '')}
            onClick={() => switchFn(f.id)}
          >{f.label}</button>
        ))}
      </div>

      <div className="dist-fn-desc">{fnDesc(tab, fn)}</div>

      {tab === 'normal' && fn !== 'inv' && (
        <Field label="x" value={nx} onChange={v => { setNx(v); setResult(null) }} placeholder="0" step="any" />
      )}
      {tab === 'normal' && fn === 'inv' && (
        <Field label="p (0 to 1)" value={np} onChange={v => { setNp(v); setResult(null) }} placeholder="0.95" step="any" />
      )}
      {tab === 'binomial' && (
        <Field label="k (count)" value={bk} onChange={v => { setBk(v); setResult(null) }} placeholder="5" step="1" />
      )}

      <button className="stat-compute-btn" onClick={compute}>Compute</button>

      {result && (
        <div className="dist-result">
          <div className="dist-result-label">{result.label}</div>
          <div className="dist-result-value">{fmt(result.value)}</div>
        </div>
      )}

      {result && result.value !== null && !Number.isNaN(result.value) && tab === 'normal' && fn === 'cdf' && (
        <div className="dist-result dist-result-complement">
          <div className="dist-result-label">P(X &gt; {nx})</div>
          <div className="dist-result-value">{fmt(1 - result.value)}</div>
        </div>
      )}
    </div>
  )
}

function fnDesc(tab, fn) {
  if (tab === 'normal') {
    if (fn === 'pdf') return 'Probability density at x'
    if (fn === 'cdf') return 'P(X ≤ x) -- cumulative probability'
    if (fn === 'inv') return 'x such that P(X ≤ x) = p -- inverse cdf'
  }
  if (tab === 'binomial') {
    if (fn === 'pdf') return 'P(X = k) -- exact probability'
    if (fn === 'cdf') return 'P(X ≤ k) -- cumulative probability'
  }
  return ''
}
