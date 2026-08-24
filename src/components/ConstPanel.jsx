import { useState } from 'react'
import { CONSTANTS, CONSTANT_CATEGORY_NAMES } from '../engine/constants'

export default function ConstPanel({ onClose, onSelect }) {
  const [category, setCategory] = useState(CONSTANT_CATEGORY_NAMES[0])

  return (
    <div className="overlay active">
      <div className="ov-head">
        <h3>Constants</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>
      <div className="ov-tabs">
        {CONSTANT_CATEGORY_NAMES.map((name) => (
          <button key={name} className={name === category ? 'active' : ''} onClick={() => setCategory(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="ov-list">
        {CONSTANTS[category].map((c) => (
          <div className="ov-item" key={c.sym} onClick={() => onSelect(c)}>
            <span className="sym">{c.sym}</span>
            <span>{c.name}</span>
            <span className="val">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
