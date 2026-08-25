import { useState, useRef, useEffect } from 'react'
import { evaluateBaseExpr, formatAllBases } from '../engine/baseN'

const BASE_LABELS = { hex: 'HEX', oct: 'OCT', bin: 'BIN' }
const BASE_NUM    = { hex: 16, oct: 8, bin: 2 }

const KEY_ROWS = {
  hex: [
    [
      {l:'A',v:'A'},{l:'B',v:'B'},{l:'C',v:'C'},
      {l:'D',v:'D'},{l:'E',v:'E'},{l:'F',v:'F'},
    ],
    [
      {l:'7',v:'7'},{l:'8',v:'8'},{l:'9',v:'9'},
      {l:'AND',v:' AND '},{l:'OR',v:' OR '},{l:'NOT',v:'NOT '},
    ],
    [
      {l:'4',v:'4'},{l:'5',v:'5'},{l:'6',v:'6'},
      {l:'XOR',v:' XOR '},{l:'<<',v:' << '},{l:'>>',v:' >> '},
    ],
    [
      {l:'1',v:'1'},{l:'2',v:'2'},{l:'3',v:'3'},
      {l:'(',v:'('},{l:')',v:')'},
    ],
    [
      {l:'0',v:'0'},{l:'+',v:'+'},{l:'-',v:'-'},
      {l:'*',v:'*'},{l:'/',v:'/'},
    ],
    [
      {l:'DEL',a:'del'},{l:'CLR',a:'clr'},{l:'=',a:'eval'},
    ],
  ],
  oct: [
    [
      {l:'7',v:'7'},{l:'AND',v:' AND '},{l:'OR',v:' OR '},{l:'NOT',v:'NOT '},
    ],
    [
      {l:'4',v:'4'},{l:'5',v:'5'},{l:'6',v:'6'},{l:'XOR',v:' XOR '},
    ],
    [
      {l:'1',v:'1'},{l:'2',v:'2'},{l:'3',v:'3'},{l:'<<',v:' << '},
    ],
    [
      {l:'0',v:'0'},{l:'(',v:'('},{l:')',v:')'},{l:'>>',v:' >> '},
    ],
    [
      {l:'+',v:'+'},{l:'-',v:'-'},{l:'*',v:'*'},{l:'/',v:'/'},
    ],
    [
      {l:'DEL',a:'del'},{l:'CLR',a:'clr'},{l:'=',a:'eval'},
    ],
  ],
  bin: [
    [
      {l:'AND',v:' AND '},{l:'OR',v:' OR '},{l:'XOR',v:' XOR '},{l:'NOT',v:'NOT '},
    ],
    [
      {l:'<<',v:' << '},{l:'>>',v:' >> '},{l:'(',v:'('},{l:')',v:')'},
    ],
    [
      {l:'+',v:'+'},{l:'-',v:'-'},{l:'*',v:'*'},{l:'/',v:'/'},
    ],
    [
      {l:'0',v:'0'},{l:'1',v:'1'},{l:'DEL',a:'del'},{l:'CLR',a:'clr'},
    ],
    [
      {l:'=',a:'eval'},
    ],
  ],
}

export default function BaseNCalculator({ baseMode, onCycleBase, angleMode, shiftActive, alphaActive }) {
  const [expr,   setExpr]   = useState('')
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState(null)
  const inputRef = useRef(null)

  const baseNum   = BASE_NUM[baseMode]
  const baseLabel = BASE_LABELS[baseMode]
  const rows      = KEY_ROWS[baseMode]

  useEffect(() => {
    inputRef.current?.focus()
  }, [baseMode])

  function evaluate() {
    const r = evaluateBaseExpr(expr, baseNum)
    if (r.ok) {
      setResult(formatAllBases(r.value))
      setError(null)
    } else {
      setError(r.error)
      setResult(null)
    }
  }

  function handleKey(key) {
    if (key.a === 'eval') { evaluate(); return }
    if (key.a === 'clr')  { setExpr(''); setResult(null); setError(null); inputRef.current?.focus(); return }
    if (key.a === 'del')  {
      setExpr(e => e.slice(0, -1))
      setResult(null); setError(null)
      inputRef.current?.focus(); return
    }
    setExpr(e => e + key.v)
    setResult(null); setError(null)
    inputRef.current?.focus()
  }

  function handleInputKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); evaluate() }
  }

  const allDisplayed = result
    ? [
        { label: 'BIN', val: result.bin },
        { label: 'OCT', val: result.oct },
        { label: 'DEC', val: result.dec },
        { label: 'HEX', val: result.hex },
      ]
    : null

  return (
    <div className="bn-calc-wrap">
      {/* Status bar */}
      <div className="bn-calc-status">
        <span className={angleMode === 'deg' ? 'on' : 'dot'}>DEG</span>
        <span className={angleMode === 'rad' ? 'on' : 'dot'}>RAD</span>
        <span className={shiftActive ? 'on shift-flag' : 'dot'}>SHIFT</span>
        <span className={alphaActive ? 'on alpha-flag' : 'dot'}>ALPHA</span>
        <button className="bn-base-cycle" onClick={onCycleBase} title="Cycle base mode">
          {baseLabel}
        </button>
      </div>

      {/* Expression + result display */}
      <div className="bn-calc-screen">
        <input
          ref={inputRef}
          className="bn-calc-expr-input"
          value={expr}
          onChange={e => { setExpr(e.target.value); setResult(null); setError(null) }}
          onKeyDown={handleInputKey}
          placeholder={'Enter expression in ' + baseLabel + '...'}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {error && <div className="bn-calc-error-line">{error}</div>}
        {allDisplayed && !error && (
          <div className="bn-calc-result-block">
            {allDisplayed.map(row => (
              <div key={row.label} className={'bn-calc-result-row' + (row.label === baseLabel ? ' bn-result-active' : '')}>
                <span className="bn-result-base-label">{row.label}</span>
                <span className="bn-result-value">{row.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keypad */}
      <div className="bn-calc-keys">
        {rows.map((row, ri) => (
          <div key={ri} className="bn-calc-krow">
            {row.map((key, ki) => (
              <button
                key={ki}
                className={
                  'key bn-calc-key' +
                  (key.a === 'eval' ? ' bn-key-eval' : '') +
                  (key.a === 'clr' || key.a === 'del' ? ' bn-key-util' : '') +
                  (['AND','OR','XOR','NOT','<<','>>'].includes(key.l) ? ' bn-key-bit' : '')
                }
                onClick={() => handleKey(key)}
              >
                {key.l}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
