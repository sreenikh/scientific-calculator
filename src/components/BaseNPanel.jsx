import { useState, useCallback } from 'react'
import {
  evaluateBaseExpr, formatAllBases,
  kmapDims, kmapHeaders, kmapMinterm, karnaughMinimize,
} from '../engine/baseN'

const BASE_OPTS = [
  { label: 'DEC', base: 10, key: 'dec' },
  { label: 'HEX', base: 16, key: 'hex' },
  { label: 'OCT', base: 8,  key: 'oct' },
  { label: 'BIN', base: 2,  key: 'bin' },
]

// ---------- Numbers tab ----------

function NumbersTab({ baseMode, onSetBase }) {
  const [expr,   setExpr]   = useState('')
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState(null)

  const active = BASE_OPTS.find(b => b.key === baseMode) || BASE_OPTS[0]

  function switchBase(opt) {
    onSetBase(opt.key)
    setExpr('')
    setResult(null)
    setError(null)
  }

  function evaluate() {
    const r = evaluateBaseExpr(expr, active.base)
    if (r.ok) {
      setResult(formatAllBases(r.value))
      setError(null)
    } else {
      setError(r.error)
      setResult(null)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); evaluate() }
  }

  const displayRows = result
    ? [
        { label: 'BIN', val: result.bin },
        { label: 'OCT', val: result.oct },
        { label: 'DEC', val: result.dec },
        { label: 'HEX', val: result.hex },
      ]
    : null

  return (
    <>
      <div className="bn-section-label">Base (sets calculator mode)</div>
      <div className="bn-base-row">
        {BASE_OPTS.map(opt => (
          <button
            key={opt.key}
            className={'bn-base-btn' + (baseMode === opt.key ? ' active' : '')}
            onClick={() => switchBase(opt)}
          >{opt.label}</button>
        ))}
      </div>
      <div className="bn-section-label">Expression in {active.label}</div>
      <input
        className="bn-input"
        placeholder={'e.g. FF + 1A  OR  NOT 255  OR  1010 AND 1100'}
        value={expr}
        onChange={e => { setExpr(e.target.value); setResult(null); setError(null) }}
        onKeyDown={handleKey}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div className="bn-op-hint">
        Ops: + - * / % AND OR XOR NOT &amp; | ^ ~ &lt;&lt; &gt;&gt; ( )
      </div>
      <button className="stat-compute-btn" style={{ marginTop: '0.5dvh' }} onClick={evaluate}>= Evaluate</button>
      {error && <div className="bn-error">{error}</div>}
      {displayRows && !error && (
        <div className="bn-display">
          {displayRows.map(row => (
            <div key={row.label} className={'bn-row' + (row.label === active.label ? ' bn-row-active' : '')}>
              <span className="bn-base-label">{row.label}</span>
              <span className="bn-value">{row.val}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ---------- K-map tab ----------

const CELL_LABELS = ['0', '1', 'X']
const CELL_NEXT   = { 0: 1, 1: 2, 2: 0 }

function cellClass(val) {
  if (val === 1) return 'kmap-cell kmap-cell-one'
  if (val === 2) return 'kmap-cell kmap-cell-dc'
  return 'kmap-cell'
}

function KmapGrid({ vars, cells, onToggle }) {
  const dims    = kmapDims(vars)
  const headers = kmapHeaders(vars)
  if (!dims || !headers) return null
  return (
    <div className="kmap-wrap">
      <table className="kmap-table">
        <thead>
          <tr>
            <th className="kmap-th-corner">
              <span className="kmap-corner-row">{headers.rowLabel}</span>
              <span className="kmap-corner-col">{headers.colLabel}</span>
            </th>
            {headers.colVals.map(v => <th key={v} className="kmap-th">{v}</th>)}
          </tr>
        </thead>
        <tbody>
          {headers.rowVals.map((rv, row) => (
            <tr key={rv}>
              <th className="kmap-th">{rv}</th>
              {headers.colVals.map((cv, col) => {
                const idx = kmapMinterm(vars, row, col)
                const val = cells[idx]
                return (
                  <td key={cv} className={cellClass(val)} onClick={() => onToggle(idx)}>
                    {CELL_LABELS[val]}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KmapFlat({ vars, cells, onToggle }) {
  const total  = 1 << vars
  const perRow = vars === 7 ? 8 : 16
  const rows   = []
  for (let i = 0; i < total; i += perRow)
    rows.push(cells.slice(i, i + perRow).map((v, j) => ({ idx: i + j, val: v })))
  return (
    <div className="kmap-flat-wrap">
      {rows.map((row, ri) => (
        <div key={ri} className="kmap-flat-row">
          <span className="kmap-flat-row-label">{ri * perRow}</span>
          {row.map(({ idx, val }) => (
            <button
              key={idx}
              className={'kmap-flat-cell' + (val === 1 ? ' kmap-cell-one' : val === 2 ? ' kmap-cell-dc' : '')}
              onClick={() => onToggle(idx)}
              title={'m' + idx}
            >
              {CELL_LABELS[val]}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

function KmapTab() {
  const [vars,   setVars]   = useState(2)
  const [cells,  setCells]  = useState(() => Array(4).fill(0))
  const [result, setResult] = useState(null)

  function changeVars(v) {
    setVars(v); setCells(Array(1 << v).fill(0)); setResult(null)
  }

  const toggleCell = useCallback((idx) => {
    setCells(prev => {
      const next = [...prev]
      next[idx] = CELL_NEXT[next[idx]]
      return next
    })
    setResult(null)
  }, [])

  return (
    <>
      <div className="bn-section-label">Variables</div>
      <div className="bn-base-row" style={{ flexWrap: 'wrap', gap: '0.3vw' }}>
        {[2, 3, 4, 5, 6, 7, 8].map(v => (
          <button
            key={v}
            className={'bn-base-btn' + (vars === v ? ' active' : '')}
            style={{ minWidth: '2vw', flex: 'none', padding: '0.4dvh 0.6vw' }}
            onClick={() => changeVars(v)}
          >{v}</button>
        ))}
      </div>

      {vars <= 6 ? (
        <KmapGrid vars={vars} cells={cells} onToggle={toggleCell} />
      ) : (
        <>
          <div className="bn-section-label">Minterms ({1 << vars} total)</div>
          <KmapFlat vars={vars} cells={cells} onToggle={toggleCell} />
        </>
      )}

      <div className="bn-kmap-legend">
        <span><span className="kmap-cell-zero-inline">0</span></span>
        <span><span className="kmap-cell-one-inline">1</span></span>
        <span><span className="kmap-cell-dc-inline">X</span> don't care</span>
      </div>

      <div style={{ display: 'flex', gap: '0.4vw', marginTop: '0.8dvh' }}>
        <button className="stat-compute-btn" style={{ flex: 1 }}
          onClick={() => setResult(karnaughMinimize(vars, cells))}>Minimize</button>
        <button className="ov-close"
          onClick={() => { setCells(Array(1 << vars).fill(0)); setResult(null) }}>clear</button>
      </div>

      {result !== null && (
        <div className="bn-kmap-result">
          <div className="bn-section-label">Minimal SOP</div>
          <div className="bn-kmap-expr">{result}</div>
        </div>
      )}
    </>
  )
}

// ---------- Panel wrapper ----------

export default function BaseNPanel({ onClose, baseMode, onSetBase }) {
  const [tab, setTab] = useState('numbers')

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Base-N</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      <div className="ov-tabs">
        <button className={tab === 'numbers' ? 'active' : ''} onClick={() => setTab('numbers')}>Numbers</button>
        <button className={tab === 'kmap'    ? 'active' : ''} onClick={() => setTab('kmap')}>K-map</button>
      </div>

      {tab === 'numbers' && <NumbersTab baseMode={baseMode} onSetBase={onSetBase} />}
      {tab === 'kmap'    && <KmapTab />}
    </div>
  )
}
