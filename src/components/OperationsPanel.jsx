import { useState } from 'react'

const OPERATIONS = {
  Convert: [
    { label: 'fromDMS', desc: 'Degrees to decimal: fromDMS(d, m, s)', insert: '\\operatorname{fromDMS}(' },
  ],
  Math: [
    { label: 'abs',   desc: 'Absolute value (real numbers); complex magnitude',     insert: '\\operatorname{abs}('   },
    { label: 'mod',   desc: 'Modulo: remainder after division — mod(a, b)',          insert: '\\operatorname{mod}('   },
    { label: 'floor', desc: 'Round down to nearest integer',                         insert: '\\operatorname{floor}(' },
    { label: 'ceil',  desc: 'Round up to nearest integer',                           insert: '\\operatorname{ceil}('  },
    { label: 'round', desc: 'Round to nearest integer',                              insert: '\\operatorname{round}(' },
    { label: 'sign',  desc: 'Sign of a number: -1, 0, or 1',                        insert: '\\operatorname{sign}('  },
  ],
  Matrix: [
    { label: 'inv',       desc: 'Matrix inverse (square matrices)',     insert: '\\operatorname{inv}('       },
    { label: 'det',       desc: 'Determinant (square matrices)',        insert: '\\operatorname{det}('       },
    { label: 'trace',     desc: 'Sum of diagonal elements',            insert: '\\operatorname{trace}('     },
    { label: 'transpose', desc: 'Transpose rows and columns',          insert: '\\operatorname{transpose}(' },
    { label: 'size',      desc: 'Dimensions [rows, cols]',             insert: '\\operatorname{size}('      },
  ],
  Vector: [
    { label: 'dot',   desc: 'Dot product - any length, both same size',      insert: '\\operatorname{dot}('   },
    { label: 'cross', desc: 'Cross product - requires exactly 3 components', insert: '\\operatorname{cross}(' },
    { label: 'norm',  desc: 'Magnitude / length - any size vector',         insert: '\\operatorname{norm}('  },
  ],
  Complex: [
    { label: 'polar',  desc: 'From polar: polar(r, θ) - angle follows DEG/RAD mode', insert: '\\operatorname{polar}(' },
    { label: 'abs',    desc: 'Magnitude of a complex number',                             insert: '\\operatorname{abs}('  },
    { label: 'arg',    desc: 'Argument (angle) - follows DEG/RAD mode',                insert: '\\operatorname{arg}('  },
    { label: 'conj',   desc: 'Complex conjugate: a+bi -> a-bi',                        insert: '\\operatorname{conj}(' },
    { label: 're',     desc: 'Real part of a complex number',                          insert: '\\operatorname{re}('   },
    { label: 'im',     desc: 'Imaginary part of a complex number',                     insert: '\\operatorname{im}('   },
  ],
}

const TABS = Object.keys(OPERATIONS)

export default function OperationsPanel({ onClose, onInsert }) {
  const [tab, setTab] = useState(TABS[0])

  function handleSelect(op) {
    onInsert(op.insert)
    onClose()
  }

  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Operations</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>
      <div className="ov-tabs">
        {TABS.map(t => (
          <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="ov-list">
        {OPERATIONS[tab].map(op => (
          <div key={op.label} className="ov-item" onClick={() => handleSelect(op)}>
            <span className="sym">{op.label}</span>
            <span>{op.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
