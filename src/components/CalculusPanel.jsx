import { useState } from 'react'
import { compileFn, derivativeAt, integrate } from '../engine/numeric'

export default function CalculusPanel({ mode, onClose }) {
  const [expr, setExpr] = useState('x^3 - 2x')
  const [point, setPoint] = useState('2')
  const [a, setA] = useState('0')
  const [b, setB] = useState('2')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function run() {
    setError(null)
    setResult(null)
    let fn
    try {
      fn = compileFn(expr)
    } catch {
      setError('Could not parse f(x)')
      return
    }
    try {
      if (mode === 'deriv') {
        setResult(derivativeAt(fn, parseFloat(point) || 0))
      } else {
        setResult(integrate(fn, parseFloat(a) || 0, parseFloat(b) || 0))
      }
    } catch {
      setError('Could not evaluate - check domain and bounds')
    }
  }

  return (
    <div className="overlay active">
      <div className="ov-head">
        <h3>{mode === 'deriv' ? 'Differentiate' : 'Integrate'}</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>
      <div className="ov-row">
        <span style={{ fontSize: 11 }}>f(x) =</span>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} />
      </div>
      {mode === 'deriv' ? (
        <div className="ov-row">
          <span style={{ fontSize: 11 }}>at x =</span>
          <input value={point} onChange={(e) => setPoint(e.target.value)} style={{ maxWidth: 70 }} />
          <button className="ov-close" onClick={run}>compute</button>
        </div>
      ) : (
        <div className="ov-row">
          <span style={{ fontSize: 11 }}>from</span>
          <input value={a} onChange={(e) => setA(e.target.value)} style={{ maxWidth: 60 }} />
          <span style={{ fontSize: 11 }}>to</span>
          <input value={b} onChange={(e) => setB(e.target.value)} style={{ maxWidth: 60 }} />
          <button className="ov-close" onClick={run}>compute</button>
        </div>
      )}
      {error && <div className="ov-note" style={{ color: 'var(--amber)' }}>{error}</div>}
      {result !== null && !error && (
        <div className="ov-result">{mode === 'deriv' ? "f′(x) ≈ " : '≈ '}{Math.round(result * 1e6) / 1e6}</div>
      )}
      <div className="ov-note">
        {mode === 'deriv'
          ? 'Central difference, h = 1e-5.'
          : "Simpson's rule, n = 200 subintervals."}
      </div>
    </div>
  )
}
