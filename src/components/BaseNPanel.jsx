import { useState, useCallback } from 'react'
import { kmapDims, kmapHeaders, kmapMinterm, karnaughMinimize } from '../engine/baseN'

const CELL_LABELS = ['0', '1', 'X']
const CELL_NEXT   = { 0: 1, 1: 2, 2: 0 }

function cellClass(val) {
  if (val === 1) return 'kmap-cell kmap-cell-one'
  if (val === 2) return 'kmap-cell kmap-cell-dc'
  return 'kmap-cell'
}

// Grid view for 2-6 variables
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

// Flat minterm list for 7-8 variables (128 or 256 minterms)
function KmapFlat({ vars, cells, onToggle }) {
  const total = 1 << vars
  const perRow = vars === 7 ? 8 : 16
  const rows = []
  for (let i = 0; i < total; i += perRow) rows.push(cells.slice(i, i + perRow).map((v, j) => ({ idx: i + j, val: v })))
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

export default function BaseNPanel({ onClose }) {
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

  function minimize() {
    setResult(karnaughMinimize(vars, cells))
  }

  function clearAll() {
    setCells(Array(1 << vars).fill(0)); setResult(null)
  }

  const usesGrid = vars <= 6

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>K-Map</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

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

      {usesGrid ? (
        <>
          <KmapGrid vars={vars} cells={cells} onToggle={toggleCell} />
          <div className="bn-kmap-legend">
            <span><span className="kmap-cell-zero-inline">0</span> = 0</span>
            <span><span className="kmap-cell-one-inline">1</span> = 1</span>
            <span><span className="kmap-cell-dc-inline">X</span> = don't care</span>
          </div>
        </>
      ) : (
        <>
          <div className="bn-section-label">Minterms ({1 << vars} total - click to cycle 0/1/X)</div>
          <KmapFlat vars={vars} cells={cells} onToggle={toggleCell} />
          <div className="bn-kmap-legend">
            <span><span className="kmap-cell-zero-inline">0</span></span>
            <span><span className="kmap-cell-one-inline">1</span></span>
            <span><span className="kmap-cell-dc-inline">X</span> don't care</span>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '0.4vw', marginTop: '0.8dvh' }}>
        <button className="stat-compute-btn" style={{ flex: 1 }} onClick={minimize}>Minimize</button>
        <button className="ov-close" onClick={clearAll}>clear</button>
      </div>

      {result !== null && (
        <div className="bn-kmap-result">
          <div className="bn-section-label">Minimal SOP</div>
          <div className="bn-kmap-expr">{result}</div>
        </div>
      )}
    </div>
  )
}
