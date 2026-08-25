import { useState, useRef, useEffect } from 'react'
import { evaluateBaseExpr, formatAllBases } from '../engine/baseN'

const BASE_OPTS = [
  { label: 'DEC', key: 'dec', base: 10 },
  { label: 'HEX', key: 'hex', base: 16 },
  { label: 'OCT', key: 'oct', base: 8  },
  { label: 'BIN', key: 'bin', base: 2  },
]

// Which digit keys are active per base
const VALID_HEX  = new Set(['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'])
const VALID_OCT  = new Set(['0','1','2','3','4','5','6','7'])
const VALID_BIN  = new Set(['0','1'])
const VALID_DEC  = new Set(['0','1','2','3','4','5','6','7','8','9'])

function validDigits(key) {
  if (key === 'hex') return VALID_HEX
  if (key === 'oct') return VALID_OCT
  if (key === 'bin') return VALID_BIN
  return VALID_DEC
}

// Keypad definition.  v = string to append; a = action
const ROWS = [
  [
    { l: 'A', v: 'A' }, { l: 'B', v: 'B' }, { l: 'C', v: 'C' },
    { l: 'DEL', a: 'del' }, { l: 'AC', a: 'clr' },
  ],
  [
    { l: 'D', v: 'D' }, { l: 'E', v: 'E' }, { l: 'F', v: 'F' },
    { l: '(', v: '(' }, { l: ')', v: ')' },
  ],
  [
    { l: 'AND', v: ' AND ' }, { l: 'OR', v: ' OR ' },
    { l: 'XOR', v: ' XOR ' }, { l: 'NOT', v: ' NOT ' },
  ],
  [
    { l: '<<', v: ' << ' }, { l: '>>', v: ' >> ' },
    { l: '7', v: '7' }, { l: '8', v: '8' }, { l: '9', v: '9' },
  ],
  [
    { l: '+', v: '+' }, { l: '-', v: '-' },
    { l: '4', v: '4' }, { l: '5', v: '5' }, { l: '6', v: '6' },
  ],
  [
    { l: '*', v: '*' }, { l: '/', v: '/' },
    { l: '1', v: '1' }, { l: '2', v: '2' }, { l: '3', v: '3' },
  ],
  [
    { l: '%', v: ' % ' }, { l: '0', v: '0' }, { l: '=', a: 'eval' },
  ],
]

export default function BaseNCalculator({ baseMode, onCycleBase, onOpenPanel, shiftActive, alphaActive }) {
  const [expr,   setExpr]   = useState('')
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState(null)
  const inputRef = useRef(null)

  const activeOpt = BASE_OPTS.find(b => b.key === baseMode) || BASE_OPTS[0]
  const allowed   = validDigits(baseMode)

  useEffect(() => { inputRef.current?.focus() }, [baseMode])

  function evaluate() {
    const r = evaluateBaseExpr(expr, activeOpt.base)
    if (r.ok) { setResult(formatAllBases(r.value)); setError(null) }
    else       { setError(r.error); setResult(null) }
  }

  function pressKey(key) {
    if (key.a === 'eval') { evaluate(); return }
    if (key.a === 'clr')  { setExpr(''); setResult(null); setError(null); inputRef.current?.focus(); return }
    if (key.a === 'del')  { setExpr(e => e.trimEnd().replace(/\S+\s*$/, s => s.slice(0, -1)).trimEnd()); setResult(null); setError(null); inputRef.current?.focus(); return }
    setExpr(e => e + key.v)
    setResult(null); setError(null)
    inputRef.current?.focus()
  }

  function isDisabled(key) {
    if (key.a) return false  // action keys always active
    // Hex digit keys A-F
    if (/^[A-F]$/.test(key.l)) return !allowed.has(key.l)
    // Digit keys 0-9
    if (/^\d$/.test(key.l)) return !allowed.has(key.l)
    return false
  }

  function keyClass(key) {
    let cls = 'bn-kp-btn'
    if (key.a === 'eval') cls += ' bn-kp-eval'
    else if (key.a === 'clr' || key.a === 'del') cls += ' bn-kp-util'
    else if (/^[A-F]$/.test(key.l)) cls += ' bn-kp-hex'
    else if (['AND','OR','XOR','NOT','<<','>>'].includes(key.l)) cls += ' bn-kp-bit'
    else if (['+','-','*','/','%'].includes(key.l)) cls += ' bn-kp-op'
    return cls
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
    <div className="bn-kp-wrap">
      {/* Status bar: base toggles + shift/alpha */}
      <div className="bn-kp-status">
        {BASE_OPTS.map(opt => (
          <button
            key={opt.key}
            className={'bn-kp-base-btn' + (baseMode === opt.key ? ' active' : '')}
            onClick={() => onCycleBase(opt.key)}
            title={opt.key === 'dec' ? 'Return to scientific calculator' : 'Switch to ' + opt.label + ' mode'}
          >{opt.label}</button>
        ))}
        <span className="bn-kp-spacer" />
        <span className={shiftActive ? 'on shift-flag' : 'dot'}>SHIFT</span>
        <span className={alphaActive ? 'on alpha-flag' : 'dot'}>ALPHA</span>
      </div>

      {/* Expression input */}
      <div className="bn-kp-screen">
        <input
          ref={inputRef}
          className="bn-kp-expr"
          value={expr}
          onChange={e => { setExpr(e.target.value); setResult(null); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); evaluate() } }}
          placeholder={activeOpt.label + ' expression...  (use 0x / 0b / 0o prefix for mixed base)'}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {error && <div className="bn-kp-error">{error}</div>}
        {displayRows && !error && (
          <div className="bn-kp-result-block">
            {displayRows.map(row => (
              <div key={row.label} className={'bn-kp-result-row' + (row.label === activeOpt.label ? ' active' : '')}>
                <span className="bn-kp-rlabel">{row.label}</span>
                <span className="bn-kp-rval">{row.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keypad */}
      <div className="bn-kp-keys">
        {ROWS.map((row, ri) => (
          <div key={ri} className="bn-kp-row">
            {row.map((key, ki) => (
              <button
                key={ki}
                className={keyClass(key)}
                disabled={isDisabled(key)}
                onClick={() => pressKey(key)}
              >{key.l}</button>
            ))}
          </div>
        ))}
        {/* Bottom action bar */}
        <div className="bn-kp-row">
          <button className="bn-kp-btn bn-kp-bit" onClick={onOpenPanel}>K-MAP</button>
          <button className="bn-kp-btn bn-kp-util" style={{ flex: 2 }}>
            <span style={{ fontSize: '0.85dvh', color: 'var(--steel)' }}>0b binary | 0x hex | 0o octal</span>
          </button>
        </div>
      </div>
    </div>
  )
}
