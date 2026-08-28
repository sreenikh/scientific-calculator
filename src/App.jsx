import { useState, useCallback, useRef } from 'react'
import Screen from './components/Screen'
import Keypad from './components/Keypad'
import HistoryStrip from './components/HistoryStrip'
import ConstPanel from './components/ConstPanel'
import ConvPanel from './components/ConvPanel'
import SolvePanel from './components/SolvePanel'
import CalculusPanel from './components/CalculusPanel'
import ModePanel from './components/ModePanel'
import MatrixPanel from './components/MatrixPanel'
import OperationsPanel from './components/OperationsPanel'
import EquationPanel from './components/EquationPanel'
import StatPanel from './components/StatPanel'
import DistributionPanel from './components/DistributionPanel'
import BaseNPanel from './components/BaseNPanel'
import TablePanel from './components/TablePanel'
import GraphPanel from './components/GraphPanel'
import { evaluateExpression, formatValue, toDMS } from './engine/mathEngine'
import { formatAllBases, validateBaseDigits } from './engine/baseN'
import { trackEvent } from './analytics'
import './App.css'

const EMPTY_MATRIX_VARS = { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null, J: null }
// Memory slots K-T: distinct from matrix vars A-J, hex digits A-F, and math.js built-ins.
const EMPTY_MEM_VARS    = { K: null, L: null, M: null, N: null, O: null, P: null, Q: null, R: null, S: null, T: null }

// Format a numeric result in the active base (integers only; floats stay decimal).
function formatInBase(value, baseMode) {
  if (baseMode === 'dec') return null
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const rounded = Math.round(value)
  if (Math.abs(value - rounded) > 1e-9) return null
  if (Math.abs(rounded) > Number.MAX_SAFE_INTEGER) return null
  const bases = formatAllBases(BigInt(rounded))
  return bases[baseMode]
}

export default function App() {
  const [latex, setLatex] = useState('')
  const [asciiMath, setAsciiMath] = useState('')
  const [resultDisplay, setResultDisplay] = useState('0')
  const [error, setError] = useState(null)
  const [angleMode, setAngleMode] = useState('deg')
  const [shiftActive, setShiftActive] = useState(false)
  const [alphaActive, setAlphaActive] = useState(false)
  const [ans, setAns] = useState(0)
  const [panel, setPanel] = useState(null)
  const [history, setHistory] = useState([])
  const [complexMode, setComplexMode] = useState('rect')
  const [isLastComplex, setIsLastComplex] = useState(false)
  const [isLastMatrix, setIsLastMatrix] = useState(false)
  const [lastComplexValue, setLastComplexValue] = useState(null)
  const [matrixVars, setMatrixVars] = useState(EMPTY_MATRIX_VARS)
  const [memVars, setMemVars] = useState(EMPTY_MEM_VARS)
  const [stoActive, setStoActive] = useState(false)
  const [rclActive, setRclActive] = useState(false)
  const [baseMode, setBaseMode] = useState('dec')  // 'dec'|'hex'|'oct'|'bin'
  const [displayMode, setDisplayMode] = useState('math')  // 'math'|'line'
  const [dmsMode, setDmsMode] = useState(false)
  const [lastNumericValue, setLastNumericValue] = useState(null)
  const [pendingReset, setPendingReset] = useState(false)
  const screenRef = useRef(null)
  const resetTimerRef = useRef(null)

  const handleChange = useCallback((newLatex, newAscii) => {
    setLatex(newLatex)
    setAsciiMath(newAscii)
    setError(null)
  }, [])

  function resetAll() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    screenRef.current?.clear()
    screenRef.current?.setDisplayMode('math')
    setResultDisplay('0')
    setError(null)
    setAngleMode('deg')
    setAns(0)
    setHistory([])
    setComplexMode('rect')
    setIsLastComplex(false)
    setIsLastMatrix(false)
    setLastComplexValue(null)
    setLastNumericValue(null)
    setMatrixVars(EMPTY_MATRIX_VARS)
    setMemVars(EMPTY_MEM_VARS)
    setShiftActive(false)
    setAlphaActive(false)
    setStoActive(false)
    setRclActive(false)
    setBaseMode('dec')
    setDisplayMode('math')
    setDmsMode(false)
    setPanel(null)
    setPendingReset(false)
    trackEvent('master_reset')
  }

  function insert(fragment) {
    screenRef.current?.insert(fragment)
  }

  function evaluate() {
    const exprToUse = asciiMath || latex
    const baseErr = validateBaseDigits(exprToUse, baseMode)
    if (baseErr) { setError(baseErr); return }
    const vars = { Ans: ans }
    for (const [k, v] of Object.entries(memVars)) {
      if (v !== null) vars[k] = v
    }
    for (const [k, v] of Object.entries(matrixVars)) {
      if (v !== null) vars[k] = v
    }
    const result = evaluateExpression(exprToUse, { angleMode, vars, complexMode })
    trackEvent('expression_evaluated', { angle_mode: angleMode, base_mode: baseMode, success: result.ok })
    if (result.ok) {
      const baseFormatted = formatInBase(result.value, baseMode)
      const isNumeric = typeof result.value === 'number' && !result.isComplex && !result.isMatrix
      const dmsDisplay = dmsMode && isNumeric && baseFormatted === null
        ? toDMS(result.value)
        : null
      const display = baseFormatted !== null ? baseFormatted
        : dmsDisplay !== null ? dmsDisplay
        : result.display

      setResultDisplay(display)
      setError(null)
      setIsLastComplex(result.isComplex)
      setIsLastMatrix(result.isMatrix)
      setLastComplexValue(result.isComplex ? result.value : null)
      setLastNumericValue(isNumeric ? result.value : null)
      setAns(result.value)
      setHistory(h => {
        const entry = { expr: exprToUse, latex, display: result.isMatrix ? `[matrix]` : display }
        const next = [...h, entry]
        return next.length > 100 ? next.slice(-100) : next
      })
    } else {
      setError(result.error)
      setIsLastComplex(false)
      setIsLastMatrix(false)
      setLastComplexValue(null)
      setLastNumericValue(null)
    }
  }

  function handleAction(action) {
    if (pendingReset && action !== 'clear') {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      setPendingReset(false)
      setResultDisplay(r => r === 'Press AC again to reset all' ? '0' : r)
    }
    switch (action) {
      case 'toggleShift':
        setShiftActive(s => !s)
        setAlphaActive(false)
        setStoActive(false)
        setRclActive(false)
        break
      case 'toggleAlpha':
        setAlphaActive(a => !a)
        setShiftActive(false)
        setStoActive(false)
        setRclActive(false)
        break
      case 'consumeShift':
        setShiftActive(false)
        break
      case 'consumeAlpha':
        setAlphaActive(false)
        break
      case 'activateSto':
        setStoActive(true)
        setShiftActive(false)
        setRclActive(false)
        break
      case 'consumeSto':
        setStoActive(false)
        break
      case 'activateRcl':
        setRclActive(true)
        setAlphaActive(false)
        setStoActive(false)
        break
      case 'consumeRcl':
        setRclActive(false)
        break
      case 'toggleAngle': {
        const newAngle = angleMode === 'deg' ? 'rad' : 'deg'
        setAngleMode(newAngle)
        trackEvent('angle_mode_changed', { to: newAngle })
        break
      }
      case 'cycleBase': {
        const order = ['dec', 'hex', 'oct', 'bin']
        const newBase = order[(order.indexOf(baseMode) + 1) % order.length]
        setBaseMode(newBase)
        trackEvent('base_mode_changed', { to: newBase })
        if (newBase === 'dec') {
          if (!isLastMatrix) setResultDisplay(formatValue(ans, angleMode, complexMode))
        } else {
          const based = formatInBase(ans, newBase)
          if (based !== null) setResultDisplay(based)
        }
        break
      }
      case 'toggleDisplayMode': {
        const newMode = displayMode === 'math' ? 'line' : 'math'
        setDisplayMode(newMode)
        screenRef.current?.setDisplayMode(newMode)
        break
      }
      case 'toggleDms': {
        const next = !dmsMode
        setDmsMode(next)
        if (lastNumericValue !== null) {
          setResultDisplay(next ? toDMS(lastNumericValue) : formatValue(lastNumericValue, angleMode, complexMode))
        }
        break
      }
      case 'clear':
        if (pendingReset) {
          resetAll()
          break
        }
        if (latex === '') {
          setPendingReset(true)
          setError(null)
          setResultDisplay('Press AC again to reset all')
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
          resetTimerRef.current = setTimeout(() => {
            setPendingReset(false)
            setResultDisplay(r => r === 'Press AC again to reset all' ? '0' : r)
          }, 3000)
          break
        }
        screenRef.current?.clear()
        setResultDisplay('0')
        setError(null)
        setIsLastComplex(false)
        setIsLastMatrix(false)
        setLastNumericValue(null)
        break
      case 'resetAll':
        setPendingReset(true)
        setError(null)
        setResultDisplay('Press AC again to reset all')
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
        resetTimerRef.current = setTimeout(() => {
          setPendingReset(false)
          setResultDisplay(r => r === 'Press AC again to reset all' ? '0' : r)
        }, 3000)
        break
      case 'del':
        screenRef.current?.deleteBackward()
        break
      case 'evaluate':
        evaluate()
        break
      case 'openConst':    setPanel('const');    trackEvent('panel_open', { panel: 'const' });    break
      case 'openConv':     setPanel('conv');     trackEvent('panel_open', { panel: 'conv' });     break
      case 'openSolve':    setPanel('solve');    trackEvent('panel_open', { panel: 'solve' });    break
      case 'openDeriv':    setPanel('deriv');    trackEvent('panel_open', { panel: 'calculus_deriv' }); break
      case 'openInteg':    setPanel('integ');    trackEvent('panel_open', { panel: 'calculus_integ' }); break
      case 'openBaseN':    setPanel('basen');    trackEvent('panel_open', { panel: 'basen' });    break
      case 'openModeMenu': setPanel('mode');     trackEvent('panel_open', { panel: 'mode' });     break
      case 'openMatrix':   setPanel('matrix');   trackEvent('panel_open', { panel: 'matrix' });   break
      case 'openOps':      setPanel('ops');      trackEvent('panel_open', { panel: 'ops' });      break
      case 'openEquation': setPanel('equation'); trackEvent('panel_open', { panel: 'equation' }); break
      case 'openStats':    setPanel('stats');    trackEvent('panel_open', { panel: 'stats' });    break
      case 'openDist':     setPanel('dist');     trackEvent('panel_open', { panel: 'dist' });     break
      case 'openTable':    setPanel('table');    trackEvent('panel_open', { panel: 'table' });    break
      case 'openGraph':    setPanel('graph');    trackEvent('panel_open', { panel: 'graph' });    break
      default:
        if (/^storeMem_[K-T]$/.test(action)) {
          const letter = action[action.length - 1]
          setMemVars(mv => ({ ...mv, [letter]: ans }))
          setStoActive(false)
        }
        break
    }
  }

  function insertConstant(constant) {
    insert(String(constant.value))
    setPanel(null)
  }

  function restoreHistory(entry) {
    screenRef.current?.setContent(entry.latex)
  }

  function storeMatrix(slot, data) {
    setMatrixVars(mv => ({ ...mv, [slot]: data }))
  }

  function handleModeSelect(action) {
    setPanel(null)
    handleAction(action)
  }

  return (
    <div className="wrap">
      <div className="brand">
        <h1>Model FX-∞G</h1>
        <span>Graphing scientific</span>
      </div>

      <div className="device">
        <>
          <div className="screen-wrap">
            <Screen
              ref={screenRef}
              onChange={handleChange}
              resultDisplay={resultDisplay}
              error={error}
              angleMode={angleMode}
              shiftActive={shiftActive}
              alphaActive={alphaActive}
              stoActive={stoActive}
              rclActive={rclActive}
              memVars={memVars}
              isComplex={isLastComplex}
              isMatrix={isLastMatrix}
              complexMode={complexMode}
              baseMode={baseMode}
              displayMode={displayMode}
              dmsMode={dmsMode}
              isLastNumeric={lastNumericValue !== null}
              isPendingReset={pendingReset}
              onToggleDisplayMode={() => handleAction('toggleDisplayMode')}
              onToggleDms={() => handleAction('toggleDms')}
              onToggleComplex={() => {
                const newMode = complexMode === 'rect' ? 'polar' : 'rect'
                setComplexMode(newMode)
                if (lastComplexValue !== null) {
                  setResultDisplay(formatValue(lastComplexValue, angleMode, newMode))
                }
              }}
            />
          </div>

          <HistoryStrip entries={history} onRestore={restoreHistory} onClear={() => setHistory([])} />

          <Keypad
            shiftActive={shiftActive}
            alphaActive={alphaActive}
            stoActive={stoActive}
            rclActive={rclActive}
            onInsert={insert}
            onAction={handleAction}
          />
        </>

        {panel === 'const'  && <ConstPanel onClose={() => setPanel(null)} onSelect={insertConstant} />}
        {panel === 'conv'   && <ConvPanel  onClose={() => setPanel(null)} />}
        {panel === 'solve'  && <SolvePanel onClose={() => setPanel(null)} />}
        {(panel === 'deriv' || panel === 'integ') && (
          <CalculusPanel mode={panel} onClose={() => setPanel(null)} />
        )}
        {panel === 'mode'   && <ModePanel  onClose={() => setPanel(null)} onMode={handleModeSelect} />}
        {panel === 'ops' && (
          <OperationsPanel onClose={() => setPanel(null)} onInsert={insert} />
        )}
        {panel === 'equation' && <EquationPanel onClose={() => setPanel(null)} />}
        {panel === 'stats'    && <StatPanel    onClose={() => setPanel(null)} />}
        {panel === 'dist'     && <DistributionPanel onClose={() => setPanel(null)} />}
        {panel === 'table'    && <TablePanel   onClose={() => setPanel(null)} angleMode={angleMode} onInsert={insert} />}
        {panel === 'graph'    && <GraphPanel   onClose={() => setPanel(null)} angleMode={angleMode} />}
        {panel === 'basen'    && (
          <BaseNPanel
            onClose={() => setPanel(null)}
            baseMode={baseMode}
            onSetBase={setBaseMode}
          />
        )}
        {panel === 'matrix' && (
          <MatrixPanel
            onClose={() => setPanel(null)}
            matrixVars={matrixVars}
            onStore={storeMatrix}
          />
        )}
      </div>
    </div>
  )
}
