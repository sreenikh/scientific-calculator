import { useState } from 'react'

const OPERATIONS = {
  Matrix: [
    { label: 'inv',       desc: 'Matrix inverse (square matrices)',     insert: '\\operatorname{inv}('       },
    { label: 'det',       desc: 'Determinant (square matrices)',        insert: '\\operatorname{det}('       },
    { label: 'trace',     desc: 'Sum of diagonal elements',            insert: '\\operatorname{trace}('     },
    { label: 'transpose', desc: 'Transpose rows and columns',          insert: '\\operatorname{transpose}(' },
    { label: 'size',      desc: 'Dimensions [rows, cols]',             insert: '\\operatorname{size}('      },
  ],
  Vector: [
    { label: 'dot',   desc: 'Dot product of two vectors',  insert: '\\operatorname{dot}('   },
    { label: 'cross', desc: 'Cross product (3D vectors)',   insert: '\\operatorname{cross}(' },
    { label: 'norm',  desc: 'Magnitude / length',          insert: '\\operatorname{norm}('  },
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
