import { ROWS } from './keypadConfig.js'

export default function Keypad({ shiftActive, alphaActive, onInsert, onAction }) {
  function press(key) {
    if (key.action) {
      onAction(key.action)
      return
    }
    if (shiftActive && key.shift) {
      onInsert(key.shift.insert)
      onAction('consumeShift')
      return
    }
    if (alphaActive && key.alpha) {
      onInsert(key.alpha.insert)
      onAction('consumeAlpha')
      return
    }
    onInsert(key.insert)
  }

  function labelFor(key) {
    if (shiftActive && key.shift) return key.shift.label
    if (alphaActive && key.alpha) return key.alpha.label
    return key.label
  }

  return (
    <div className="keys">
      {ROWS.map((row, i) => (
        <div className="krow" key={i}>
          {row.map((key) => (
            <button
              key={key.id}
              className={
                'key' +
                (key.mod ? ' mod' : '') +
                (key.wide ? ' wide' : '') +
                (key.id === 'shift' && shiftActive ? ' active-shift' : '') +
                (key.id === 'alpha' && alphaActive ? ' active-alpha' : '')
              }
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => press(key)}
            >
              {key.shift && (
                <span className="leg">
                  <span className="sh">{key.shift.label}</span>
                  {key.alpha && <span className="al">{key.alpha.label}</span>}
                </span>
              )}
              {!key.shift && key.alpha && (
                <span className="leg">
                  <span className="al">{key.alpha.label}</span>
                </span>
              )}
              {labelFor(key)}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
