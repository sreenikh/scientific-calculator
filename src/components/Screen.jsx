import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { MathfieldElement } from 'mathlive'

MathfieldElement.fontsDirectory = 'https://unpkg.com/mathlive/dist/fonts'
MathfieldElement.soundsDirectory = null

// Uncontrolled field: MathLive owns cursor state. React reads via input events;
// keypad writes via MathLive's insert/deleteBackward commands exposed through ref.
const Screen = forwardRef(function Screen(
  { onChange, resultDisplay, error, angleMode, shiftActive, alphaActive,
    isComplex, isMatrix, complexMode, onToggleComplex },
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
  }))

  const showToggle = isComplex && !error
  const multiLine = isMatrix && !error

  return (
    <div className="screen">
      <div className="screen-status">
        <span className={angleMode === 'deg' ? 'on' : 'dot'}>DEG</span>
        <span className={angleMode === 'rad' ? 'on' : 'dot'}>RAD</span>
        <span className={shiftActive ? 'on shift-flag' : 'dot'}>SHIFT</span>
        <span className={alphaActive ? 'on alpha-flag' : 'dot'}>ALPHA</span>
      </div>

      <math-field
        ref={fieldRef}
        class="mathfield"
        virtual-keyboard-mode="off"
      ></math-field>

      <div className="display-row">
        {showToggle && (
          <button className="complex-toggle" onClick={onToggleComplex}>
            {complexMode === 'rect' ? 'RECT' : 'POLAR'}
          </button>
        )}
        <div className={
          'display-line' +
          (error ? ' has-error' : '') +
          (multiLine ? ' is-matrix' : '')
        }>
          {error ? error : resultDisplay}
        </div>
      </div>
    </div>
  )
})

export default Screen
