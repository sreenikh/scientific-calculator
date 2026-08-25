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
import BaseNCalculator from './components/BaseNCalculator'
import { evaluateExpression, formatValue } from './engine/mathEngine'
import './App.css'

const EMPTY_MATRIX_VARS = { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null, J: null }

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
  const [baseMode, setBaseMode] = useState('dec')  // 'dec'|'hex'|'oct'|'bin'
  const screenRef = useRef(null)

  const handleChange = useCallback((newLatex, newAscii) => {
    setLatex(newLatex)
    setAsciiMath(newAscii)
    setError(null)
  }, [])

  function insert(fragment) {
    screenRef.current?.insert(fragment)
  }

  function evaluate() {
    const exprToUse = asciiMath || latex
    // Inject stored matrices (plain 2D arrays) alongside Ans into scope.
    // buildScope converts them to math.js matrices automatically.
    const vars = { Ans: ans }
    for (const [k, v] of Object.entries(matrixVars)) {
      if (v !== null) vars[k] = v
    }
    const result = evaluateExpression(exprToUse, { angleMode, vars, complexMode })
    if (result.ok) {
      setResultDisplay(result.display)
      setError(null)
      setIsLastComplex(result.isComplex)
      setIsLastMatrix(result.isMatrix)
      setLastComplexValue(result.isComplex ? result.value : null)
      setAns(result.value)
      setHistory(h => {
        const entry = { expr: exprToUse, latex, display: result.isMatrix ? `[matrix]` : result.display }
        const next = [...h, entry]
        return next.length > 100 ? next.slice(-100) : next
      })
    } else {
      setError(result.error)
      setIsLastComplex(false)
      setIsLastMatrix(false)
      setLastComplexValue(null)
    }
  }

  function handleAction(action) {
    switch (action) {
      case 'toggleShift':
        setShiftActive(s => !s)
        setAlphaActive(false)
        break
      case 'toggleAlpha':
        setAlphaActive(a => !a)
        setShiftActive(false)
        break
      case 'consumeShift':
        setShiftActive(false)
        break
      case 'consumeAlpha':
        setAlphaActive(false)
        break
      case 'toggleAngle':
        setAngleMode(m => m === 'deg' ? 'rad' : 'deg')
        break
      case 'clear':
        screenRef.current?.clear()
        setResultDisplay('0')
        setError(null)
        setIsLastComplex(false)
        setIsLastMatrix(false)
        break
      case 'del':
        screenRef.current?.deleteBackward()
        break
      case 'evaluate':
        evaluate()
        break
      case 'openConst':   setPanel('const');    break
      case 'openConv':    setPanel('conv');     break
      case 'openSolve':   setPanel('solve');    break
      case 'openDeriv':   setPanel('deriv');    break
      case 'openInteg':   setPanel('integ');    break
      case 'cycleBase': {
        const cycle = { dec: 'hex', hex: 'oct', oct: 'bin', bin: 'dec' }
        setBaseMode(m => cycle[m])
        setPanel(null)
        break
      }
      case 'openModeMenu': setPanel('mode');   break
      case 'openMatrix':  setPanel('matrix');   break
      case 'openOps':     setPanel('ops');      break
      case 'openEquation': setPanel('equation'); break
      case 'openStats':    setPanel('stats');    break
      case 'openDist':     setPanel('dist');     break
      case 'openKMap':     setPanel('kmap');     break
      default: break
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
        {baseMode !== 'dec' ? (
          <BaseNCalculator
            baseMode={baseMode}
            onCycleBase={() => handleAction('cycleBase')}
            angleMode={angleMode}
            shiftActive={shiftActive}
            alphaActive={alphaActive}
          />
        ) : (
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
                isComplex={isLastComplex}
                isMatrix={isLastMatrix}
                complexMode={complexMode}
                baseMode={baseMode}
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
              onInsert={insert}
              onAction={handleAction}
            />
          </>
        )}

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
        {panel === 'kmap'     && <BaseNPanel        onClose={() => setPanel(null)} />}
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
