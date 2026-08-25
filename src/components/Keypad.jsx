import { ROWS } from './keypadConfig.js'

const DIGIT_TO_MEM = { '1':'K','2':'L','3':'M','4':'N','5':'O','6':'P','7':'Q','8':'R','9':'S','0':'T' }

export default function Keypad({ shiftActive, alphaActive, stoActive, rclActive, onInsert, onAction }) {
  function press(key) {
    // STO mode: digit keys store ans to memory slot K-T; anything else cancels STO and falls through.
    if (stoActive) {
      if (key.id in DIGIT_TO_MEM) {
        onAction('storeMem_' + DIGIT_TO_MEM[key.id])
        return
      }
      onAction('consumeSto')
      // Fall through so the key still does its normal thing.
    }
    // RCL mode: digit keys insert memory slot letter K-T into expression; anything else cancels.
    if (rclActive) {
      if (key.id in DIGIT_TO_MEM) {
        onInsert(DIGIT_TO_MEM[key.id])
        onAction('consumeRcl')
        return
      }
      onAction('consumeRcl')
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
    if ((stoActive || rclActive) && key.rcl) return key.rcl.label
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
