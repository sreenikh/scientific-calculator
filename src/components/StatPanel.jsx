import { useState } from 'react'
import { oneVarStats, twoVarStats, percentile } from '../engine/stats'
import { math } from '../engine/mathEngine'

const MODELS = [
  { id: 'linear',      label: 'Linear'  },
  { id: 'quadratic',   label: 'Quad'    },
  { id: 'exponential', label: 'Exp'     },
  { id: 'power',       label: 'Power'   },
]

function fmt(n) {
  if (Number.isNaN(n)) return 'NaN'
  if (!isFinite(n)) return n > 0 ? '∞' : '-∞'
  return math.format(n, { precision: 8 })
}

function makeRows(n) {
  return Array.from({ length: n }, () => ({ x: '', y: '' }))
}

export default function StatPanel({ onClose }) {
  const [tab,     setTab]     = useState('1var')
  const [model,   setModel]   = useState('linear')
  const [rows,    setRows]    = useState(makeRows(6))
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)
  const [customP, setCustomP] = useState(['', ''])

  function updateCell(i, field, val) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
    setResult(null)
    setError(null)
  }

  function addRows() {
    setRows(prev => [...prev, ...makeRows(4)])
  }

  function deleteRow(i) {
    setRows(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)
  }

  function compute() {
    setResult(null)
    setError(null)
    if (tab === '1var') {
      const xs = rows.map(r => parseFloat(r.x)).filter(v => !isNaN(v))
      const r = oneVarStats(xs)
      if (r.ok) setResult(r)
      else setError(r.error)
    } else {
      const pairs = rows
        .map(r => ({ x: parseFloat(r.x), y: parseFloat(r.y) }))
        .filter(p => !isNaN(p.x) && !isNaN(p.y))
      const r = twoVarStats(pairs.map(p => p.x), pairs.map(p => p.y), model)
      if (r.ok) setResult(r)
      else setError(r.error)
    }
  }

  function switchTab(t) {
    setTab(t)
    setResult(null)
    setError(null)
  }

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Statistics</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      <div className="ov-tabs">
        <button className={tab === '1var' ? 'active' : ''} onClick={() => switchTab('1var')}>1-Variable</button>
        <button className={tab === '2var' ? 'active' : ''} onClick={() => switchTab('2var')}>2-Variable</button>
      </div>

      {tab === '2var' && (
        <div className="stat-model-row">
          {MODELS.map(m => (
            <button
              key={m.id}
              className={'stat-model-btn' + (model === m.id ? ' active' : '')}
              onClick={() => { setModel(m.id); setResult(null); setError(null) }}
            >{m.label}</button>
          ))}
        </div>
      )}

      <div className="stat-data-header">
        <span className="stat-hdr-num"></span>
        <span className="stat-hdr-cell">x</span>
        {tab === '2var' && <span className="stat-hdr-cell">y</span>}
        <span className="stat-hdr-del"></span>
      </div>

      <div className="stat-data-list">
        {rows.map((row, i) => (
          <div key={i} className="stat-row">
            <span className="stat-row-num">{i + 1}</span>
            <input
              className="stat-cell"
              type="number"
              value={row.x}
              onChange={e => updateCell(i, 'x', e.target.value)}
              placeholder="0"
            />
            {tab === '2var' && (
              <input
                className="stat-cell"
                type="number"
                value={row.y}
                onChange={e => updateCell(i, 'y', e.target.value)}
                placeholder="0"
              />
            )}
            <button
              className="stat-row-del"
              onClick={() => deleteRow(i)}
              disabled={rows.length <= 1}
            >x</button>
          </div>
        ))}
      </div>

      <button className="stat-add-btn" onClick={addRows}>+ Add rows</button>
      <button className="stat-compute-btn" onClick={compute}>Compute</button>

      {error && <div className="eq-error">{error}</div>}

      {result && tab === '1var' && (
        <div className="stat-results">
          {[
            ['n',      result.n],
            ['Σx',     result.sum],
            ['x̅',      result.mean],
            ['Median', result.median],
            ['Q1',     result.q1],
            ['Q3',     result.q3],
            ['s',      result.stddev],
            ['s²',     result.variance],
            ['Min',    result.min],
            ['Max',    result.max],
          ].map(([label, val]) => (
            <div key={label} className="stat-result-row">
              <span className="stat-result-label">{label}</span>
              <span className="stat-result-val">{fmt(val)}</span>
            </div>
          ))}

          <div className="stat-pct-header">Percentiles</div>
          {[10, 25, 50, 75, 90].map(p => (
            <div key={p} className="stat-result-row">
              <span className="stat-result-label stat-pct-label">P{p}</span>
              <span className="stat-result-val">{fmt(percentile(result.sorted, p))}</span>
            </div>
          ))}
          {customP.map((pStr, i) => {
            const p = parseFloat(pStr)
            const valid = !isNaN(p) && p >= 0 && p <= 100
            return (
              <div key={i} className="stat-pct-custom-row">
                <span className="stat-result-label">
                  P<input
                    className="stat-pct-input"
                    type="number"
                    min="0"
                    max="100"
                    value={pStr}
                    onChange={e => setCustomP(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                    placeholder="0-100"
                  />
                </span>
                <span className="stat-result-val">
                  {valid ? fmt(percentile(result.sorted, p)) : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {result && tab === '2var' && (
        <div className="stat-results">
          <div className="stat-result-eq">{modelEquation(result)}</div>
          {modelRows(result).map(([label, val]) => (
            <div key={label} className="stat-result-row">
              <span className="stat-result-label">{label}</span>
              <span className="stat-result-val">{fmt(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function modelEquation(r) {
  const a = fmt(r.a), b = fmt(r.b)
  if (r.model === 'linear')      return `y = ${a} + ${b}x`
  if (r.model === 'quadratic')   return `y = ${a} + ${b}x + ${fmt(r.c)}x²`
  if (r.model === 'exponential') return `y = ${a} · e^(${b}x)`
  if (r.model === 'power')       return `y = ${a} · x^(${b})`
  return ''
}

function modelRows(r) {
  const rows = [['a', r.a], ['b', r.b]]
  if (r.model === 'quadratic') rows.push(['c', r.c])
  if (r.r !== undefined)       rows.push(['r', r.r])
  rows.push(['r²', r.r2])
  return rows
}
