import React, { useMemo, useState } from 'react'

export default function PlayerPanel({
  player,
  startScore,
  isCurrent,
  doubleOut,
  onSubmitTurn,
  accent = 'red'
}) {
  const [d1, setD1] = useState('')
  const [d2, setD2] = useState('')
  const [d3, setD3] = useState('')
  const [busy, setBusy] = useState(false)

  const previewTotal = useMemo(() => {
    // Lightweight preview: sum numeric values; notation is handled on the backend.
    const vals = [d1, d2, d3].map(v => {
      if (v === '') return 0
      const n = Number(v)
      return Number.isFinite(n) ? Math.max(0, Math.min(60, Math.floor(n))) : 0
    })
    return vals.reduce((a, b) => a + b, 0)
  }, [d1, d2, d3])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSubmitTurn(player.id, [d1, d2, d3])
      setD1(''); setD2(''); setD3('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="playerCard" style={{ opacity: isCurrent ? 1 : 0.7 }}>
      <div className="playerTop">
        <div className="playerName" title={player.name}>
          <span className="dot" style={{ background: accent === 'red' ? 'var(--red)' : 'var(--red2)' }} />
          <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</b>
          {isCurrent && <span className="turnTag">Your turn</span>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="score">{player.score}</div>
          <div className="scoreSub">Start: {startScore}{doubleOut ? ' • Double-out' : ''}</div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="dartsRow">
          <input className="small" placeholder="D1 (e.g. 20 or T20)" value={d1} onChange={e => setD1(e.target.value)} />
          <input className="small" placeholder="D2 (blank if not thrown)" value={d2} onChange={e => setD2(e.target.value)} />
          <input className="small" placeholder="D3 (blank if not thrown)" value={d3} onChange={e => setD3(e.target.value)} />
        </div>

        <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
          <div className="kpi" style={{ flex: 1 }}>
            <div>
              <b>Preview</b>
              <div><span>{player.score} − ~{previewTotal} = </span><b>{Math.max(0, player.score - previewTotal)}</b></div>
            </div>
            <span>visit</span>
          </div>
          <button className="btnPrimary" type="submit" disabled={busy || !isCurrent} style={{ minWidth: 140 }}>
            {busy ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </form>

      <div className="hint">
        Leave D2/D3 blank if not thrown. For double-out, the last thrown dart must be <b>D..</b> or <b>DBULL</b>.
      </div>
    </div>
  )
}
