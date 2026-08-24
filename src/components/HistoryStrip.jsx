export default function HistoryStrip({ entries, onRestore, onClear }) {
  if (!entries.length) return null
  const reversed = [...entries].reverse()
  return (
    <div className="history-wrap">
      <div className="history-header">
        <span className="history-label">History</span>
        <button className="history-clear" onClick={onClear}>clear</button>
      </div>
      <div className="history-strip">
        {reversed.map((e, i) => {
          const idx = entries.length - i
          return (
            <div key={i} className="history-entry" onClick={() => onRestore(e)}>
              <span className="he-idx">#{idx}</span>
              <span className="he-expr">{e.expr}</span>
              <span className="he-result">{e.display}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
