import { useState, useCallback } from 'react'
import {
  parseBase, formatBin, formatOct, formatDec, formatHex,
  bitwiseOp, kmapDims, kmapHeaders, kmapMinterm, karnaughMinimize,
} from '../engine/baseN'

const BASES = [
  { label: 'BIN', base: 2 },
  { label: 'OCT', base: 8 },
  { label: 'DEC', base: 10 },
  { label: 'HEX', base: 16 },
]

const OPS = [
  { id: 'AND', label: 'AND', needsB: true },
  { id: 'OR',  label: 'OR',  needsB: true },
  { id: 'XOR', label: 'XOR', needsB: true },
  { id: 'NOT', label: 'NOT', needsB: false },
  { id: 'LSH', label: '<<',  needsB: true },
  { id: 'RSH', label: '>>',  needsB: true },
]

function BaseDisplay({ n }) {
  if (n === null) return null
  return (
    <div className="bn-display">
      <div className="bn-row"><span className="bn-base-label">BIN</span><span className="bn-value">{formatBin(n)}</span></div>
      <div className="bn-row"><span className="bn-base-label">OCT</span><span className="bn-value">{formatOct(n)}</span></div>
      <div className="bn-row"><span className="bn-base-label">DEC</span><span className="bn-value">{formatDec(n)}</span></div>
      <div className="bn-row"><span className="bn-base-label">HEX</span><span className="bn-value">{formatHex(n)}</span></div>
    </div>
  )
}

// ---------- Numbers tab ----------

function NumbersTab() {
  const [inputBase, setInputBase] = useState(10)
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const [op, setOp]         = useState(null)
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState(null)

  const parsedA = parseBase(inputA, inputBase)
  const needsB  = op && OPS.find(o => o.id === op)?.needsB

  function compute() {
    setError(null)
    setResult(null)
    if (parsedA === null) { setError('Invalid value for A'); return }
    if (!op) { setResult(parsedA); return }
    if (needsB) {
      const bVal = parseBase(inputB, 10)
      if (bVal === null) { setError('Invalid value for B'); return }
      const r = bitwiseOp(op, parsedA, bVal)
      if (r === null) { setError('Unknown operation'); return }
      setResult(r)
    } else {
      const r = bitwiseOp(op, parsedA, 0)
      setResult(r)
    }
  }

  return (
    <>
      <div className="bn-section-label">Input base</div>
      <div className="bn-base-row">
        {BASES.map(b => (
          <button
            key={b.base}
            className={'bn-base-btn' + (inputBase === b.base ? ' active' : '')}
            onClick={() => { setInputBase(b.base); setInputA(''); setResult(null); setError(null) }}
          >{b.label}</button>
        ))}
      </div>

      <div className="bn-section-label">A</div>
      <input
        className="bn-input"
        placeholder={inputBase === 16 ? 'e.g. FF' : inputBase === 2 ? 'e.g. 1010' : 'e.g. 42'}
        value={inputA}
        onChange={e => { setInputA(e.target.value); setResult(null); setError(null) }}
        spellCheck={false}
      />

      {parsedA !== null && !op && (
        <BaseDisplay n={parsedA} />
      )}

      <div className="bn-section-label">Operation</div>
      <div className="bn-op-row">
        {OPS.map(o => (
          <button
            key={o.id}
            className={'bn-op-btn' + (op === o.id ? ' active' : '')}
            onClick={() => { setOp(op === o.id ? null : o.id); setResult(null); setError(null) }}
          >{o.label}</button>
        ))}
      </div>

      {op && needsB && (
        <>
          <div className="bn-section-label">B {op === 'LSH' || op === 'RSH' ? '(shift count, decimal)' : '(decimal)'}</div>
          <input
            className="bn-input"
            placeholder="0"
            value={inputB}
            onChange={e => { setInputB(e.target.value); setResult(null); setError(null) }}
            spellCheck={false}
          />
        </>
      )}

      <button className="stat-compute-btn" style={{ marginTop: '0.8dvh' }} onClick={compute}>Compute</button>

      {error && <div className="bn-error">{error}</div>}
      {result !== null && !error && (
        <>
          <div className="bn-section-label">Result</div>
          <BaseDisplay n={result} />
        </>
      )}
    </>
  )
}

// ---------- K-map tab ----------

const CELL_LABELS = ['0', '1', 'X']
const CELL_NEXT = { 0: 1, 1: 2, 2: 0 }

function KmapTab() {
  const [vars, setVars]   = useState(2)
  const [cells, setCells] = useState(() => Array(4).fill(0))
  const [result, setResult] = useState(null)

  const dims = kmapDims(vars)
  const headers = kmapHeaders(vars)

  function changeVars(v) {
    setVars(v)
    setCells(Array(1 << v).fill(0))
    setResult(null)
  }

  function toggleCell(row, col) {
    const idx = kmapMinterm(vars, row, col)
    setCells(prev => {
      const next = [...prev]
      next[idx] = CELL_NEXT[next[idx]]
      return next
    })
    setResult(null)
  }

  function minimize() {
    setResult(karnaughMinimize(vars, cells))
  }

  function cellClass(val) {
    if (val === 1) return 'kmap-cell kmap-cell-one'
    if (val === 2) return 'kmap-cell kmap-cell-dc'
    return 'kmap-cell'
  }

  return (
    <>
      <div className="bn-section-label">Variables</div>
      <div className="bn-base-row">
        {[2, 3, 4].map(v => (
          <button
            key={v}
            className={'bn-base-btn' + (vars === v ? ' active' : '')}
            onClick={() => changeVars(v)}
          >{v}</button>
        ))}
      </div>

      <div className="kmap-wrap">
        <table className="kmap-table">
          <thead>
            <tr>
              <th className="kmap-th-corner">
                <span className="kmap-corner-row">{headers.rowLabel}</span>
                <span className="kmap-corner-col">{headers.colLabel}</span>
              </th>
              {headers.colVals.map(v => (
                <th key={v} className="kmap-th">{v}</th>
              ))}
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
                    <td key={cv} className={cellClass(val)} onClick={() => toggleCell(row, col)}>
                      {CELL_LABELS[val]}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bn-kmap-legend">
        <span><span className="kmap-cell kmap-cell-zero-inline">0</span> minterm = 0</span>
        <span><span className="kmap-cell kmap-cell-one-inline">1</span> minterm = 1</span>
        <span><span className="kmap-cell kmap-cell-dc-inline">X</span> don't care</span>
      </div>

      <button className="stat-compute-btn" style={{ marginTop: '0.8dvh' }} onClick={minimize}>Minimize</button>

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

export default function BaseNPanel({ onClose }) {
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

      {tab === 'numbers' && <NumbersTab />}
      {tab === 'kmap'    && <KmapTab />}
    </div>
  )
}
