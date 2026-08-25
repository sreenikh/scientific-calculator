const MODES = [
  { num: 1, label: 'EQUATION',     desc: 'Polynomial roots, linear systems',  action: 'openEquation' },
  { num: 2, label: 'MATRIX / VECTOR', desc: 'Define A-J; 1-row = vector, else matrix', action: 'openMatrix' },
  { num: 3, label: 'STATISTICS',   desc: '1-var stats; linear/quad/exp/power regression', action: 'openStats' },
  { num: 4, label: 'DISTRIBUTION', desc: 'Normal (pdf/cdf/inv) and Binomial (pdf/cdf)', action: 'openDist' },
  { num: 5, label: 'K-MAP',        desc: 'Karnaugh map minimization (2-8 variables)', action: 'openKMap' },
]

export default function ModePanel({ onClose, onMode }) {
  return (
    <div className="overlay">
      <div className="ov-head">
        <h3>Mode</h3>
        <button className="ov-close" onClick={onClose}>close</button>
      </div>
      <div className="mode-list">
        {MODES.map(m => (
          <button
            key={m.num}
            className={'mode-item' + (m.action ? '' : ' mode-item-disabled')}
            onClick={() => m.action && onMode(m.action)}
            disabled={!m.action}
          >
            <span className="mode-num">{m.num}</span>
            <span className="mode-label">{m.label}</span>
            <span className="mode-desc">{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
