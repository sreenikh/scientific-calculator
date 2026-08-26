import { useState } from 'react'
import { compileFn } from '../engine/numeric'

const MAX_ROWS = 500

function buildTable(fExpr, gExpr, start, end, step, angleMode) {
  const rows = []
  const fn = compileFn(fExpr, 'x', angleMode)
  const gn = gExpr.trim() ? compileFn(gExpr, 'x', angleMode) : null

  let x = start
  while (rows.length < MAX_ROWS && x <= end + Math.abs(step) * 1e-9) {
    const fx = fn(x)
    const gx = gn ? gn(x) : null
    rows.push({ x, fx, gx })
    x = Math.round((x + step) * 1e12) / 1e12
  }
  return rows
}

function fmtNum(v) {
  if (typeof v !== 'number') return '-'
  if (!isFinite(v)) return v > 0 ? '+inf' : '-inf'
  if (isNaN(v)) return 'undef'
  return v.toPrecision(8).replace(/\.?0+$/, '')
}

export default function TablePanel({ onClose, angleMode = 'rad', onInsert }) {
  const [fExpr, setFExpr] = useState('x^2')
  const [gExpr, setGExpr] = useState('')
  const [start, setStart]  = useState('-5')
  const [end,   setEnd]    = useState('5')
  const [step,  setStep]   = useState('1')
  const [rows,  setRows]   = useState(null)
  const [error, setError]  = useState(null)
  const [copied, setCopied] = useState(null)

  function generate() {
    setError(null)
    setRows(null)
    setCopied(null)
    const s = parseFloat(start)
    const e = parseFloat(end)
    const st = parseFloat(step)
    if (isNaN(s) || isNaN(e) || isNaN(st) || st <= 0) {
      setError('Start, end, and step must be valid numbers; step must be positive')
      return
    }
    if (e < s) { setError('End must be >= start'); return }
    if ((e - s) / st > MAX_ROWS) {
      setError(`Too many rows (max ${MAX_ROWS}). Increase step or narrow range.`)
      return
    }
    try {
      setRows(buildTable(fExpr.trim(), gExpr.trim(), s, e, st, angleMode))
    } catch {
      setError('Could not evaluate expression. Check f(x) syntax.')
    }
  }

  function copyValue(v, key) {
    const s = fmtNum(v)
    if (s === '-' || s === 'undef') return
    onInsert(s)
    setCopied(key)
    setTimeout(() => setCopied(k => k === key ? null : k), 1200)
  }

  const hasG = gExpr.trim().length > 0

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Table</h3>
        <span className="tbl-mode-badge">{angleMode.toUpperCase()}</span>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      <div className="ov-row">
        <span className="tbl-label">f(x)</span>
        <input className="tbl-input" value={fExpr} onChange={e => setFExpr(e.target.value)} />
      </div>
      <div className="ov-row">
        <span className="tbl-label">g(x)</span>
        <input className="tbl-input" placeholder="optional" value={gExpr} onChange={e => setGExpr(e.target.value)} />
      </div>
      <div className="ov-row">
        <span className="tbl-label">Start</span>
        <input className="tbl-num" value={start} onChange={e => setStart(e.target.value)} />
        <span className="tbl-label">End</span>
        <input className="tbl-num" value={end} onChange={e => setEnd(e.target.value)} />
        <span className="tbl-label">Step</span>
        <input className="tbl-num" value={step} onChange={e => setStep(e.target.value)} />
        <button className="ov-close tbl-go" onClick={generate}>go</button>
      </div>

      {error && <div className="ov-note tbl-error">{error}</div>}

      {rows && (
        <>
          <div className="ov-note tbl-hint">Click any f(x) or g(x) value to insert it into the expression field.</div>
          <div className="tbl-scroll">
            <table className="tbl-table">
              <thead>
                <tr>
                  <th>x</th>
                  <th>f(x)</th>
                  {hasG && <th>g(x)</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{fmtNum(r.x)}</td>
                    <td
                      className={'tbl-val' + (copied === `f${i}` ? ' tbl-copied' : '')}
                      onClick={() => copyValue(r.fx, `f${i}`)}
                    >{fmtNum(r.fx)}</td>
                    {hasG && (
                      <td
                        className={'tbl-val' + (copied === `g${i}` ? ' tbl-copied' : '')}
                        onClick={() => copyValue(r.gx, `g${i}`)}
                      >{fmtNum(r.gx)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
