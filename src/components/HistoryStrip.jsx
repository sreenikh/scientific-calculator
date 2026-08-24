export default function HistoryStrip({ entries, onRestore }) {
  if (!entries.length) return null
  return (
    <div className="history-strip">
      {[...entries].reverse().map((e, i) => (
        <div key={i} className="history-entry" onClick={() => onRestore(e.latex)}>
          <span className="he-expr">{e.expr}</span>
          <span className="he-result">{e.display}</span>
        </div>
      ))}
    </div>
  )
}
