import { useState } from 'react'
import { polyRoots, solveLinearSystem } from '../engine/numeric'
import { math } from '../engine/mathEngine'

const SUPERSCRIPTS = ['', '', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰']
const SUBSCRIPTS   = ['₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₁₀']

function fmtNum(n) {
  const s = math.format(n, { precision: 8 })
  return s
}

function fmtRoot(root) {
  const re = (root && root.re !== undefined) ? root.re : Number(root)
  const im = (root && root.im !== undefined) ? root.im : 0
  if (Math.abs(im) < 1e-8 * Math.max(Math.abs(re), 1)) return fmtNum(re)
  const sign = im >= 0 ? ' + ' : ' - '
  return `${fmtNum(re)}${sign}${fmtNum(Math.abs(im))}i`
}

function makeMatA(n) {
  return Array.from({ length: n }, () => Array(n).fill(''))
}
function resizeMatA(prev, n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => prev[i]?.[j] ?? '')
  )
}
function makeVecB(n) { return Array(n).fill('') }
function resizeVecB(prev, n) {
  return Array.from({ length: n }, (_, i) => prev[i] ?? '')
}

export default function EquationPanel({ onClose }) {
  const [tab, setTab] = useState('Polynomial')

  // Polynomial
  const [degree, setDegree] = useState(2)
  const [coeffs, setCoeffs] = useState(Array(3).fill(''))
  const [polyRoots_,  setPolyRoots]  = useState(null)
  const [polyError,   setPolyError]  = useState(null)

  // Linear system
  const [size,      setSize]      = useState(2)
  const [matA,      setMatA]      = useState(makeMatA(2))
  const [vecB,      setVecB]      = useState(makeVecB(2))
  const [linResult, setLinResult] = useState(null)
  const [linError,  setLinError]  = useState(null)

  function changeDegree(d) {
    setDegree(d)
    setCoeffs(prev => {
      const len = d + 1
      return len > prev.length
        ? [...prev, ...Array(len - prev.length).fill('')]
        : prev.slice(0, len)
    })
    setPolyRoots(null)
    setPolyError(null)
  }

  function changeSize(n) {
    setSize(n)
    setMatA(prev => resizeMatA(prev, n))
    setVecB(prev => resizeVecB(prev, n))
    setLinResult(null)
    setLinError(null)
  }

  function updateCoeff(i, v) {
    setCoeffs(prev => prev.map((c, idx) => idx === i ? v : c))
  }

  function updateCell(i, j, v) {
    setMatA(prev => prev.map((row, ri) =>
      ri === i ? row.map((c, ci) => ci === j ? v : c) : row
    ))
  }

  function updateB(i, v) {
    setVecB(prev => prev.map((c, idx) => idx === i ? v : c))
  }

  function solvePoly() {
    setPolyError(null)
    setPolyRoots(null)
    const parsed = coeffs.map(c => {
      const v = parseFloat(c)
      return isNaN(v) ? 0 : v
    })
    if (parsed[0] === 0) {
      setPolyError('Leading coefficient cannot be zero')
      return
    }
    try {
      const roots = polyRoots(parsed)
      setPolyRoots(roots)
    } catch (e) {
      setPolyError(e.message || 'Could not compute roots')
    }
  }

  function solveLinear() {
    setLinError(null)
    setLinResult(null)
    const A = matA.map(row => row.map(c => { const v = parseFloat(c); return isNaN(v) ? 0 : v }))
    const b = vecB.map(c => { const v = parseFloat(c); return isNaN(v) ? 0 : v })
    const result = solveLinearSystem(A, b)
    if (result.ok) setLinResult(result.solution)
    else setLinError(result.error)
  }

  const powerLabel = (i) => {
    const p = degree - i
    if (p === 0) return 'const'
    if (p === 1) return 'x'
    return `x${SUPERSCRIPTS[p] || ('^' + p)}`
  }

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Equation</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>

      <div className="ov-tabs">
        {['Polynomial', 'Linear System'].map(t => (
          <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Polynomial' && (
        <div>
          <div className="eq-degree-row">
            <span className="eq-label">Degree</span>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
              <button
                key={d}
                className={'eq-deg-btn' + (degree === d ? ' active' : '')}
                onClick={() => changeDegree(d)}
              >{d}</button>
            ))}
          </div>

          <div className="eq-coeffs">
            {coeffs.map((c, i) => (
              <div key={i} className="eq-coeff-row">
                <span className="eq-coeff-label">{powerLabel(i)}</span>
                <input
                  className="eq-coeff-input"
                  type="number"
                  value={c}
                  onChange={e => updateCoeff(i, e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <button className="eq-solve-btn" onClick={solvePoly}>Solve</button>

          {polyError && <div className="eq-error">{polyError}</div>}
          {polyRoots_ && (
            <div className="eq-results">
              {polyRoots_.map((r, i) => (
                <div key={i} className="eq-result-row">
                  <span className="eq-result-label">x{SUBSCRIPTS[i] ?? (i + 1)}</span>
                  <span className="eq-result-val">{fmtRoot(r)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Linear System' && (
        <div>
          <div className="eq-degree-row">
            <span className="eq-label">Size</span>
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={'eq-deg-btn' + (size === n ? ' active' : '')}
                onClick={() => changeSize(n)}
              >{n}x{n}</button>
            ))}
          </div>

          <div className="eq-aug-note">Enter coefficients [A | b] for Ax = b</div>

          <div className="eq-aug-table">
            {matA.map((row, i) => (
              <div key={i} className="eq-aug-row">
                {row.map((cell, j) => (
                  <input
                    key={j}
                    className="eq-aug-cell"
                    type="number"
                    value={cell}
                    onChange={e => updateCell(i, j, e.target.value)}
                    placeholder="0"
                  />
                ))}
                <span className="eq-aug-sep">|</span>
                <input
                  className="eq-aug-cell"
                  type="number"
                  value={vecB[i]}
                  onChange={e => updateB(i, e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <button className="eq-solve-btn" onClick={solveLinear}>Solve</button>

          {linError && <div className="eq-error">{linError}</div>}
          {linResult && (
            <div className="eq-results">
              {linResult.map((v, i) => (
                <div key={i} className="eq-result-row">
                  <span className="eq-result-label">x{SUBSCRIPTS[i] ?? (i + 1)}</span>
                  <span className="eq-result-val">{fmtNum(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
