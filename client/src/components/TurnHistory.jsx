import React from 'react'

function formatDarts(darts) {
  if (!Array.isArray(darts)) return ''
  return darts
    .map(d => (d.raw && d.raw !== '' ? d.raw : (d.thrown ? (d.points ?? 0) : '—')))
    .join(' + ')
}

export default function TurnHistory({ match, onUndo }) {
  const turns = [...(match?.turns || [])].slice().reverse();
  return (
    <div className="card">
      <div className="cardHeader">
        <h2>History</h2>
        <button className="btnGhost" onClick={onUndo} disabled={!match?.turns?.length}>Undo last</button>
      </div>
      <div className="cardBody">
        {!turns.length ? (
          <div className="hint">No turns yet. Enter darts to start scoring.</div>
        ) : (
          <div className="list">
            {turns.map(t => {
              const p = match.players.find(x => x.id === t.playerId)
              const label = p?.name || 'Player'
              return (
                <div key={t.id} className="turn">
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <b>{label}</b>
                      <small>{new Date(t.createdAt).toLocaleTimeString()}</small>
                    </div>
                    <small>
                      {t.scoreBefore} − ({formatDarts(t.darts)}) = <b>{t.scoreAfter}</b>
                      {t.busted && t.bustReason ? ` • ${t.bustReason}` : ''}
                    </small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={"pill " + (t.busted ? 'pillBust' : '')}>
                      {t.busted ? 'BUST' : `−${t.total}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="hint" style={{ marginTop: 12 }}>
          Double-out input: use <b>D20</b>, <b>T20</b>, <b>SBULL</b> (25), <b>DBULL</b> (50). Leave remaining darts blank if not thrown.
        </div>
      </div>
    </div>
  )
}
