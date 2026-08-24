import { useState } from 'react'
import { math } from '../engine/mathEngine'

const OPS = [
  { id: 'det',       label: 'DET',      matrices: 1, needsSquare: true  },
  { id: 'inv',       label: 'INV',      matrices: 1, needsSquare: true  },
  { id: 'transpose', label: 'TRANS',    matrices: 1, needsSquare: false },
  { id: 'eigen',     label: 'EIGENVAL', matrices: 1, needsSquare: true  },
  { id: 'add',       label: 'ADD',      matrices: 2, needsSquare: false },
  { id: 'multiply',  label: 'MULTIPLY', matrices: 2, needsSquare: false },
  { id: 'dot',       label: 'DOT',      matrices: 2, needsSquare: false },
  { id: 'cross',     label: 'CROSS',    matrices: 2, needsSquare: false },
]

function makeGrid(r, c) {
  return Array.from({ length: r }, () => Array(c).fill(''))
}

function resizeGrid(grid, r, c) {
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => grid[i]?.[j] ?? '')
  )
}

function parseGrid(grid) {
  return grid.map(row =>
    row.map(cell => {
      const v = parseFloat(cell)
      if (isNaN(v)) throw new Error('All cells must be filled with numbers')
      return v
    })
  )
}

function formatResult(val) {
  if (val === null || val === undefined) return ''
  const type = math.typeOf(val)
  if (type === 'number') return math.format(val, { precision: 10 })
  if (type === 'Complex') return math.format(val, { precision: 10 })
  const arr = val?.toArray ? val.toArray() : val
  if (Array.isArray(arr)) {
    if (Array.isArray(arr[0])) {
      return arr
        .map(row => '[ ' + row.map(v => math.format(v, { precision: 6 })).join('   ') + ' ]')
        .join('\n')
    }
    return arr.map((v, i) => `λ${i + 1} = ${math.format(v, { precision: 10 })}`).join('\n')
  }
  return math.format(val, { precision: 10 })
}

function SizePicker({ rows, cols, onRows, onCols, label }) {
  const sizes = [1, 2, 3, 4]
  return (
    <div className="mat-size-row">
      <span className="mat-size-label">{label}</span>
      <select value={rows} onChange={e => onRows(Number(e.target.value))}>
        {sizes.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="mat-size-x">×</span>
      <select value={cols} onChange={e => onCols(Number(e.target.value))}>
        {sizes.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

function MatrixGrid({ grid, rows, cols, onChange }) {
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

export default function MatrixPanel({ onClose }) {
  const [op, setOp] = useState('det')
  const [rowsA, setRowsA] = useState(2)
  const [colsA, setColsA] = useState(2)
  const [rowsB, setRowsB] = useState(2)
  const [colsB, setColsB] = useState(2)
  const [gridA, setGridA] = useState(() => makeGrid(2, 2))
  const [gridB, setGridB] = useState(() => makeGrid(2, 2))
  const [result, setResult] = useState('')
  const [err, setErr] = useState('')

  const currentOp = OPS.find(o => o.id === op)
  const twoMatrix = currentOp?.matrices === 2

  function changeRowsA(r) { setRowsA(r); setGridA(g => resizeGrid(g, r, colsA)) }
  function changeColsA(c) { setColsA(c); setGridA(g => resizeGrid(g, rowsA, c)) }
  function changeRowsB(r) { setRowsB(r); setGridB(g => resizeGrid(g, r, colsB)) }
  function changeColsB(c) { setColsB(c); setGridB(g => resizeGrid(g, rowsB, c)) }

  function updateA(i, j, v) {
    setGridA(g => g.map((row, ri) => ri === i ? row.map((cell, ci) => ci === j ? v : cell) : row))
  }
  function updateB(i, j, v) {
    setGridB(g => g.map((row, ri) => ri === i ? row.map((cell, ci) => ci === j ? v : cell) : row))
  }

  function compute() {
    setErr('')
    setResult('')
    try {
      const A = parseGrid(gridA)
      const matA = math.matrix(A)
      let res

      if (op === 'det') {
        if (rowsA !== colsA) throw new Error('DET requires a square matrix')
        res = math.det(matA)
      } else if (op === 'inv') {
        if (rowsA !== colsA) throw new Error('INV requires a square matrix')
        res = math.inv(matA)
      } else if (op === 'transpose') {
        res = math.transpose(matA)
      } else if (op === 'eigen') {
        if (rowsA !== colsA) throw new Error('Eigenvalues require a square matrix')
        const { values } = math.eigs(matA)
        res = values
      } else if (op === 'add') {
        const B = parseGrid(gridB)
        if (rowsA !== rowsB || colsA !== colsB) throw new Error('ADD requires identical dimensions')
        res = math.add(matA, math.matrix(B))
      } else if (op === 'multiply') {
        const B = parseGrid(gridB)
        if (colsA !== rowsB) throw new Error(`MULTIPLY: A has ${colsA} cols but B has ${rowsB} rows`)
        res = math.multiply(matA, math.matrix(B))
      } else if (op === 'dot') {
        const vecA = A.flat()
        const vecB = parseGrid(gridB).flat()
        if (vecA.length !== vecB.length) throw new Error('DOT: vectors must have the same length')
        res = math.dot(vecA, vecB)
      } else if (op === 'cross') {
        const vecA = A.flat()
        const vecB = parseGrid(gridB).flat()
        if (vecA.length !== 3 || vecB.length !== 3) throw new Error('CROSS requires 3-element vectors (1×3 or 3×1)')
        res = math.cross(vecA, vecB)
      }

      setResult(formatResult(res))
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Matrix / Vector</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      <div className="mat-ops">
        {OPS.map(o => (
          <button
            key={o.id}
            className={'ov-tabs-btn' + (op === o.id ? ' active' : '')}
            onClick={() => { setOp(o.id); setResult(''); setErr('') }}
          >
            {o.label}
          </button>
        ))}
      </div>

      <SizePicker label="A" rows={rowsA} cols={colsA} onRows={changeRowsA} onCols={changeColsA} />
      <MatrixGrid grid={gridA} rows={rowsA} cols={colsA} onChange={updateA} />

      {twoMatrix && (
        <>
          <SizePicker label="B" rows={rowsB} cols={colsB} onRows={changeRowsB} onCols={changeColsB} />
          <MatrixGrid grid={gridB} rows={rowsB} cols={colsB} onChange={updateB} />
        </>
      )}

      <button className="ov-close mat-compute" onClick={compute}>compute</button>

      {err && <div className="ov-note" style={{ color: '#A32D2D' }}>{err}</div>}
      {result && <pre className="mat-result">{result}</pre>}
    </div>
  )
}
