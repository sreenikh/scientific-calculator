import { useState, useCallback, useRef } from 'react'
import Screen from './components/Screen'
import Keypad from './components/Keypad'
import ConstPanel from './components/ConstPanel'
import ConvPanel from './components/ConvPanel'
import SolvePanel from './components/SolvePanel'
import CalculusPanel from './components/CalculusPanel'
import { evaluateExpression } from './engine/mathEngine'
import './App.css'

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
    const result = evaluateExpression(exprToUse, { angleMode, vars: { Ans: ans } })
    if (result.ok) {
      setResultDisplay(result.display)
      setError(null)
      if (typeof result.value === 'number') setAns(result.value)
    } else {
      setError(result.error)
    }
  }

  function handleAction(action) {
    switch (action) {
      case 'toggleShift':
        setShiftActive((s) => !s)
        setAlphaActive(false)
        break
      case 'toggleAlpha':
        setAlphaActive((a) => !a)
        setShiftActive(false)
        break
      case 'consumeShift':
        setShiftActive(false)
        break
      case 'consumeAlpha':
        setAlphaActive(false)
        break
      case 'toggleAngle':
        setAngleMode((m) => (m === 'deg' ? 'rad' : 'deg'))
        break
      case 'clear':
        screenRef.current?.clear()
        setResultDisplay('0')
        setError(null)
        break
      case 'del':
        screenRef.current?.deleteBackward()
        break
      case 'evaluate':
        evaluate()
        break
      case 'openConst':
        setPanel('const')
        break
      case 'openConv':
        setPanel('conv')
        break
      case 'openSolve':
        setPanel('solve')
        break
      case 'openDeriv':
        setPanel('deriv')
        break
      case 'openInteg':
        setPanel('integ')
        break
      case 'openBaseN':
        setPanel('basen')
        break
      case 'openModeMenu':
        // Phase 3 placeholder
        break
      default:
        break
    }
  }

  function insertConstant(constant) {
    insert(String(constant.value))
    setPanel(null)
  }

  return (
    <div className="wrap">
      <div className="brand">
        <h1>Model FX-∞G</h1>
        <span>Graphing scientific</span>
      </div>

      <div className="device">
        <div className="screen-wrap">
          <Screen
            ref={screenRef}
            onChange={handleChange}
            resultDisplay={resultDisplay}
            error={error}
            angleMode={angleMode}
            shiftActive={shiftActive}
            alphaActive={alphaActive}
          />
        </div>

        <Keypad shiftActive={shiftActive} alphaActive={alphaActive} onInsert={insert} onAction={handleAction} />

        {panel === 'const' && <ConstPanel onClose={() => setPanel(null)} onSelect={insertConstant} />}
        {panel === 'conv' && <ConvPanel onClose={() => setPanel(null)} />}
        {panel === 'solve' && <SolvePanel onClose={() => setPanel(null)} />}
        {(panel === 'deriv' || panel === 'integ') && (
          <CalculusPanel mode={panel} onClose={() => setPanel(null)} />
        )}
      </div>
    </div>
  )
}
