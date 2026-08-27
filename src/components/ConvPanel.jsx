import { useMemo, useState } from 'react'
import { UNIT_CATEGORIES, CATEGORY_NAMES, convert } from '../engine/units'

export default function ConvPanel({ onClose }) {
  const [category, setCategory] = useState(CATEGORY_NAMES[0])
  const [value, setValue] = useState('1')

  const unitList = useMemo(() => {
    const cat = UNIT_CATEGORIES[category]
    return cat.special ? cat.units : Object.keys(cat.units)
  }, [category])

  const [fromUnit, setFromUnit] = useState(unitList[0])
  const [toUnit, setToUnit] = useState(unitList[1] || unitList[0])

  function changeCategory(name) {
    setCategory(name)
    const cat = UNIT_CATEGORIES[name]
    const units = cat.special ? cat.units : Object.keys(cat.units)
    setFromUnit(units[0])
    setToUnit(units[1] || units[0])
  }

  const numericValue = parseFloat(value) || 0
  let result = null
  try {
    result = convert(category, numericValue, fromUnit, toUnit)
  } catch {
    result = null
  }

  return (
    <div className="overlay active">
      <div className="ov-head">
        <h3>Unit convert</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>
      <div className="ov-tabs">
        {CATEGORY_NAMES.map((name) => (
          <button key={name} className={name === category ? 'active' : ''} onClick={() => changeCategory(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="ov-row">
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
          {unitList.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <span>→</span>
        <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
          {unitList.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="ov-result">
        {result === null ? '--' : Math.round(result * 1e6) / 1e6} {result === null ? '' : toUnit}
      </div>
      <div className="ov-note">16 categories, 90+ units. Temperature uses affine conversion.</div>
    </div>
  )
}
