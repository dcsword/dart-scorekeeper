import React, { useMemo, useState } from 'react'
import { api } from './api.js'
import PlayerPanel from './components/PlayerPanel.jsx'
import TurnHistory from './components/TurnHistory.jsx'

export default function App() {
  const [match, setMatch] = useState(null)
  const [playersCount, setPlayersCount] = useState(2)
  const [p1, setP1] = useState('Player 1')
  const [p2, setP2] = useState('Player 2')
  const [startScore, setStartScore] = useState(501)
  const [doubleOut, setDoubleOut] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasMatch = Boolean(match?.id)

  async function createMatch() {
    setError('')
    setLoading(true)
    try {
      const payload = {
        startScore,
        playersCount,
        doubleOut,
        players: playersCount === 1 ? [{ name: p1 }] : [{ name: p1 }, { name: p2 }]
      }
      const m = await api.createMatch(payload)
      setMatch(m)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function refresh(id) {
    const m = await api.getMatch(id)
    setMatch(m)
  }

  async function submitTurn(playerId, darts) {
    setError('')
    if (!match?.id) return
    try {
      await api.addTurn(match.id, { playerId, darts })
      await refresh(match.id)
    } catch (e) {
      setError(e.message)
    }
  }

  async function undo() {
    setError('')
    if (!match?.id) return
    try {
      await api.undo(match.id)
      await refresh(match.id)
    } catch (e) {
      setError(e.message)
    }
  }

  function reset() {
    setMatch(null)
    setError('')
  }

  const winner = useMemo(() => {
    if (!match?.players) return null
    return match.players.find(p => p.score === 0) || null
  }, [match])

  const currentPlayerId = useMemo(() => {
    if (!match?.players?.length) return null
    const idx = match.currentPlayerIndex || 0
    return match.players[idx]?.id || match.players[0].id
  }, [match])

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <h1>Dart Scorekeeper</h1>
          <span className="badge">501-style • persistent history</span>
        </div>
        <div className="row">
          {hasMatch ? (
            <>
              <span className="badge">Match ID: {match.id.slice(0, 6)}…</span>
              <button onClick={reset}>New match</button>
            </>
          ) : (
            <span className="badge">Black + Red UI</span>
          )}
        </div>
      </div>

      {!hasMatch ? (
        <div className="card">
          <div className="cardHeader">
            <h2>Create match</h2>
            <span className="badge">1 or 2 players • Double-out optional</span>
          </div>
          <div className="cardBody">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="field" style={{ minWidth: 220 }}>
                <label>Players</label>
                <select value={playersCount} onChange={e => setPlayersCount(Number(e.target.value))}>
                  <option value={1}>1 Player</option>
                  <option value={2}>2 Players</option>
                </select>
              </div>

              <div className="field" style={{ minWidth: 220 }}>
                <label>Starting score</label>
                <input inputMode="numeric" value={startScore} onChange={e => setStartScore(Number(e.target.value || 0))} />
              </div>

              <div className="field" style={{ minWidth: 220 }}>
                <label>Finish rule</label>
                <select value={doubleOut ? 'double' : 'any'} onChange={e => setDoubleOut(e.target.value === 'double')}>
                  <option value="double">Double-out</option>
                  <option value="any">Any-out</option>
                </select>
              </div>
            </div>

            <div className="split" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Player 1</label>
                <input value={p1} onChange={e => setP1(e.target.value)} placeholder="Name" />
              </div>
              {playersCount === 2 && (
                <div className="field">
                  <label>Player 2</label>
                  <input value={p2} onChange={e => setP2(e.target.value)} placeholder="Name" />
                </div>
              )}
            </div>

            <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btnPrimary" onClick={createMatch} disabled={loading} style={{ minWidth: 160 }}>
                {loading ? 'Creating…' : 'Start match'}
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="footer">
              <div>
                Tip: Checkout early? Leave unused darts blank.
              </div>
              <div>
                Double-out inputs: <span className="badge">D20</span> <span className="badge">T20</span> <span className="badge">DBULL</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid">
          <div className="card">
            <div className="cardHeader">
              <h2>Scoreboard</h2>
              {winner ? (
                <span className="badge" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#86efac' }}>
                  Winner: {winner.name}
                </span>
              ) : (
                <span className="badge">Turn order enforced</span>
              )}
            </div>
            <div className="cardBody">
              <div className={match.playersCount === 1 ? '' : 'split'}>
                <PlayerPanel
                  player={match.players[0]}
                  startScore={match.startScore}
                  doubleOut={match.doubleOut}
                  isCurrent={currentPlayerId === match.players[0].id}
                  onSubmitTurn={submitTurn}
                  accent="red"
                />
                {match.playersCount === 2 && (
                  <PlayerPanel
                    player={match.players[1]}
                    startScore={match.startScore}
                    doubleOut={match.doubleOut}
                    isCurrent={currentPlayerId === match.players[1].id}
                    onSubmitTurn={submitTurn}
                    accent="pink"
                  />
                )}
              </div>
              {error && <div className="error">{error}</div>}
            </div>
          </div>

          <TurnHistory match={match} onUndo={undo} />
        </div>
      )}

      <div className="footer" style={{ marginTop: 16 }}>
        <div>React + Node + Postgres (Prisma). 🎯</div>
        <div>Later: Capacitor (iOS) / Tauri (Windows).</div>
      </div>
    </div>
  )
}
