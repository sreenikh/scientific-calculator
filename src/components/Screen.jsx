import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { MathfieldElement } from 'mathlive'

MathfieldElement.fontsDirectory = 'https://unpkg.com/mathlive/dist/fonts'
MathfieldElement.soundsDirectory = null

// Uncontrolled field: MathLive owns cursor state. React reads via input events;
// keypad writes via MathLive's insert/deleteBackward commands exposed through ref.
const Screen = forwardRef(function Screen(
  { onChange, resultDisplay, error, angleMode, shiftActive, alphaActive,
    stoActive, rclActive, memVars,
    isComplex, isMatrix, complexMode, onToggleComplex, baseMode,
    displayMode, dmsMode, isLastNumeric, onToggleDisplayMode, onToggleDms,
    isPendingReset, multiRoots, onSelectRoot },
  ref
) {
  const fieldRef = useRef(null)

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    field.smartFence = true
    field.smartSuperscript = true
    field.mathVirtualKeyboardPolicy = 'manual'
    field.menuItems = []
    const handler = () => {
      onChange(field.getValue('latex'), field.getValue('ascii-math'))
    }
    field.addEventListener('input', handler)
    return () => field.removeEventListener('input', handler)
  }, [onChange])

  useImperativeHandle(ref, () => ({
    insert(fragment) {
      const field = fieldRef.current
      if (!field || !fragment) return
      field.focus()
      field.insert(fragment, { focus: true })
    },
    deleteBackward() {
      const field = fieldRef.current
      if (!field) return
      field.focus()
      field.executeCommand('deleteBackward')
    },
    clear() {
      const field = fieldRef.current
      if (!field) return
      field.setValue('', { silenceNotifications: true })
      onChange('', '')
    },
    setContent(latex) {
      const field = fieldRef.current
      if (!field) return
      field.focus()
      field.setValue(latex, { silenceNotifications: true })
      onChange(field.getValue('latex'), field.getValue('ascii-math'))
    },
    setDisplayMode(mode) {
      const field = fieldRef.current
      if (!field) return
      field.defaultMode = mode === 'line' ? 'text' : 'math'
    },
  }))

  const showComplexToggle = isComplex && !error
  const showDmsToggle = isLastNumeric && !error && !isComplex && !isMatrix
  const multiLine = isMatrix && !error
  const setMemLetters = memVars
    ? Object.entries(memVars).filter(([, v]) => v !== null).map(([k]) => k)
    : []

  return (
    <div className="screen">
      <div className="screen-status">
        <span className={angleMode === 'deg' ? 'on' : 'dot'}>DEG</span>
        <span className={angleMode === 'rad' ? 'on' : 'dot'}>RAD</span>
        <span className={shiftActive ? 'on shift-flag' : 'dot'}>SHIFT</span>
        <span className={alphaActive ? 'on alpha-flag' : 'dot'}>ALPHA</span>
        {stoActive && <span className="on sto-flag">STO</span>}
        {rclActive && <span className="on rcl-flag">RCL</span>}
        {setMemLetters.map(l => (
          <span key={l} className="on mem-flag">{l}</span>
        ))}
        {baseMode && baseMode !== 'dec' && (
          <span className="on base-flag">{baseMode.toUpperCase()}</span>
        )}
      </div>

      <math-field
        ref={fieldRef}
        class="mathfield"
        virtual-keyboard-mode="off"
      ></math-field>

      <div className="display-row">
        <div className="display-toggles">
          <button className={`disp-toggle${displayMode === 'line' ? ' active' : ''}`} onClick={onToggleDisplayMode}>
            {displayMode === 'math' ? 'MATH' : 'LINE'}
          </button>
          {showDmsToggle && (
            <button className={`disp-toggle${dmsMode ? ' active' : ''}`} onClick={onToggleDms}>
              DMS
            </button>
          )}
          {showComplexToggle && (
            <button className="disp-toggle" onClick={onToggleComplex}>
              {complexMode === 'rect' ? 'RECT' : 'POLAR'}
            </button>
          )}
        </div>
        <div className={
          'display-line' +
          (error ? ' has-error' : '') +
          (multiLine ? ' is-matrix' : '') +
          (isPendingReset ? ' is-confirm' : '')
        }>
          {error ? error : resultDisplay}
          {isPendingReset && (
            <div className="confirm-hint">Or wait 3 seconds to cancel</div>
          )}
        </div>
      </div>

      {multiRoots && (
        <div className="multi-roots">
          <span className="multi-roots-label">All roots (click to select as Ans)</span>
          <div className="multi-roots-list">
            {multiRoots.map((root, i) => (
              <button key={i} className="root-row" onClick={() => onSelectRoot(i)}>
                <span className="root-idx">Root {i + 1}</span>
                <span className="root-val">{root.display}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default Screen
