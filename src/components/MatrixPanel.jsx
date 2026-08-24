import { useState } from 'react'

const SLOTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

function makeGrid(r, c) {
  return Array.from({ length: r }, () => Array(c).fill(''))
}

function resizeGrid(grid, r, c) {
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => grid[i]?.[j] ?? '')
  )
}

function slotDims(arr) {
  if (!arr) return null
  return `${arr.length}x${arr[0].length}`
}

function MatrixGrid({ grid, cols, onChange }) {
  return (
    <div className="mat-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {grid.map((row, i) =>
        row.map((cell, j) => (
          <input
            key={`${i}-${j}`}
            className="mat-cell"
            type="number"
            value={cell}
            onChange={e => onChange(i, j, e.target.value)}
            placeholder="0"
          />
        ))
      )}
    </div>
  )
}

export default function MatrixPanel({ onClose, matrixVars, onStore }) {
  const [slot, setSlot] = useState('A')
  const [rows, setRows] = useState(2)
  const [cols, setCols] = useState(2)
  const [grid, setGrid] = useState(() => makeGrid(2, 2))

  function changeRows(r) { setRows(r); setGrid(g => resizeGrid(g, r, cols)) }
  function changeCols(c) { setCols(c); setGrid(g => resizeGrid(g, rows, c)) }

  function updateCell(i, j, v) {
    setGrid(g => g.map((row, ri) =>
      ri === i ? row.map((cell, ci) => ci === j ? v : cell) : row
    ))
  }

  function handleStore() {
    const parsed = grid.map(row =>
      row.map(cell => {
        const v = parseFloat(cell)
        return isNaN(v) ? 0 : v
      })
    )
    onStore(slot, parsed)
  }

  function handleRecall() {
    const stored = matrixVars[slot]
    if (!stored) return
    const r = stored.length
    const c = stored[0].length
    setRows(r)
    setCols(c)
    setGrid(stored.map(row => row.map(String)))
  }

  function handleClear() {
    onStore(slot, null)
  }

  const stored = matrixVars[slot]

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Matrix</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      <div className="mat-slots">
        {SLOTS.map(s => (
          <button
            key={s}
            className={'mat-slot-btn' + (slot === s ? ' active' : '') + (matrixVars[s] ? ' has-data' : '')}
            onClick={() => setSlot(s)}
          >
            {s}
            {matrixVars[s] && <span className="mat-slot-dim">{slotDims(matrixVars[s])}</span>}
          </button>
        ))}
      </div>

      <div className="mat-size-row">
        <span className="mat-size-label">{slot}</span>
        <select value={rows} onChange={e => changeRows(Number(e.target.value))}>
          {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="mat-size-x">x</span>
        <select value={cols} onChange={e => changeCols(Number(e.target.value))}>
          {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {stored && (
          <button className="ov-close mat-btn-sm" onClick={handleRecall}>recall</button>
        )}
        {stored && (
          <button className="ov-close mat-btn-sm" onClick={handleClear}>clear</button>
        )}
      </div>

      <MatrixGrid grid={grid} cols={cols} onChange={updateCell} />

      <button className="mat-store-btn" onClick={handleStore}>
        Store to {slot}
      </button>

      <div className="mat-hint">
        <span className="mat-hint-label">In main field:</span>
        {' '} inv(A), A*B, det(A), transpose(B), A-B, 2*C, A^2
      </div>

      {Object.entries(matrixVars).some(([, v]) => v) && (
        <div className="mat-stored-list">
          {SLOTS.filter(s => matrixVars[s]).map(s => (
            <div key={s} className="mat-stored-item">
              <span className="mat-stored-name">{s} ({slotDims(matrixVars[s])})</span>
              <span className="mat-stored-preview">
                {'[' + matrixVars[s].map(r => r.map(v =>
                  Number.isInteger(v) ? v : v.toPrecision(4)
                ).join(' ')).join(' | ') + ']'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
