import { ROWS } from './keypadConfig.js'

const DIGIT_TO_VAR = { '1':'A','2':'B','3':'C','4':'D','5':'E','6':'F','7':'G','8':'H','9':'I','0':'J' }

export default function Keypad({ shiftActive, alphaActive, stoActive, onInsert, onAction }) {
  function press(key) {
    // STO mode: digit keys store ans to memory variable; anything else cancels STO and falls through.
    if (stoActive) {
      if (key.id in DIGIT_TO_VAR) {
        onAction('storeMem_' + DIGIT_TO_VAR[key.id])
        return
      }
      onAction('consumeSto')
      // Fall through so the key still does its normal thing.
    }

    // Check shift/alpha layers first so SHIFT+key correctly overrides primary action.
    if (shiftActive && key.shift) {
      if (key.shift.action) onAction(key.shift.action)
      else onInsert(key.shift.insert)
      onAction('consumeShift')
      return
    }
    if (alphaActive && key.alpha) {
      if (key.alpha.action) onAction(key.alpha.action)
      else onInsert(key.alpha.insert)
      onAction('consumeAlpha')
      return
    }
    if (key.action) {
      onAction(key.action)
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
