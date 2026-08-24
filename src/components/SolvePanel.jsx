import { useState } from 'react'
import { compileFn, newtonRaphson, secant, bisection } from '../engine/numeric'

export default function SolvePanel({ onClose }) {
  const [expr, setExpr] = useState('x^2 - 2')
  const [method, setMethod] = useState('newton')
  const [x0, setX0] = useState('1')
  const [x1, setX1] = useState('2')
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

    let out
    if (method === 'newton') {
      out = newtonRaphson(fn, parseFloat(x0) || 0)
    } else if (method === 'secant') {
      out = secant(fn, parseFloat(x0) || 0, parseFloat(x1) || 1)
    } else {
      out = bisection(fn, parseFloat(x0) || 0, parseFloat(x1) || 1)
    }

    if (!out.ok) setError(out.error)
    setResult(out)
  }

  return (
    <div className="overlay active">
      <div className="ov-head">
        <h3>Solve</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>
      <div className="ov-row">
        <span style={{ fontSize: 11 }}>f(x) =</span>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} />
      </div>
      <div className="ov-tabs">
        {['newton', 'secant', 'bisect'].map((m) => (
          <button key={m} className={m === method ? 'active' : ''} onClick={() => setMethod(m)}>
            {m === 'newton' ? 'Newton-Raphson' : m === 'secant' ? 'Secant' : 'Bisection'}
          </button>
        ))}
      </div>
      <div className="ov-row">
        <span style={{ fontSize: 11 }}>{method === 'bisect' ? 'a =' : 'x0 ='}</span>
        <input value={x0} onChange={(e) => setX0(e.target.value)} style={{ maxWidth: 60 }} />
        {method !== 'newton' && (
          <>
            <span style={{ fontSize: 11 }}>{method === 'bisect' ? 'b =' : 'x1 ='}</span>
            <input value={x1} onChange={(e) => setX1(e.target.value)} style={{ maxWidth: 60 }} />
          </>
        )}
        <button className="ov-close" onClick={run}>solve</button>
      </div>

      {error && <div className="ov-note" style={{ color: 'var(--amber)' }}>{error}</div>}

      {result && result.ok && (
        <div className="ov-result">root ≈ {result.root.toFixed(8)}</div>
      )}

      {result && result.steps && result.steps.length > 0 && (
        <table className="iter">
          <thead>
            <tr>
              <th>n</th>
              <th>x</th>
              <th>f(x)</th>
            </tr>
          </thead>
          <tbody>
            {result.steps.slice(0, 12).map((s) => (
              <tr key={s.n}>
                <td>{s.n}</td>
                <td>{(s.x ?? s.mid).toFixed(6)}</td>
                <td>{(s.fx ?? s.fm).toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="ov-note">
        Newton-Raphson works for most cases. Try secant or bisection if it fails to converge.
      </div>
    </div>
  )
}
