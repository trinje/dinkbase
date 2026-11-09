
import { useEffect, useMemo, useState } from 'react'
import NewGameForm from './newGameForm'
import { formatGameDate, formatGameTime, formatMonthYear } from '../utils/dateTime'
import { supabase } from '../utils/supabase'
import './dashboard.css'

function teammateFor(game) {
  return game.teammate || 'Not recorded'
}

function Icon({
  children,
  size = 20,
  className = '',
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  )
}

function LogoMark() {
  return (
    <div className="dashboard-logo-mark">
      <Icon size={22}>
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="9.2" cy="9.2" r="1" fill="currentColor" />
        <circle cx="14.8" cy="9.2" r="1" fill="currentColor" />
        <circle cx="9.2" cy="14.8" r="1" fill="currentColor" />
        <circle cx="14.8" cy="14.8" r="1" fill="currentColor" />
      </Icon>
    </div>
  )
}

function StatCard({
  eyebrow,
  value,
  detail,
  accent,
  icon,
}) {
  const accentClasses = {
    green: 'dashboard-stat-icon-green',
    blue: 'dashboard-stat-icon-blue',
    sand: 'dashboard-stat-icon-sand',
  }

  return (
    <article className="dashboard-stat-card">
      <div className={`dashboard-stat-icon ${accentClasses[accent]}`}>{icon}</div>
      <p className="dashboard-stat-eyebrow">{eyebrow}</p>
      <p className="dashboard-stat-value">{value}</p>
      <p className="dashboard-stat-detail">{detail}</p>
    </article>
  )
}

function ResultPill({ result }) {
  return (
    <span
      className={`dashboard-result-pill ${result === 'Win' ? 'is-win' : 'is-loss'}`}
    >
      {result}
    </span>
  )
}

function EmptyIcon() {
  return (
    <Icon size={46} className="dashboard-empty-icon">
      <path d="M7 3.5h10v17H7z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 7h5M9.5 10.5h5M9.5 14h3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </Icon>
  )
}

function Dashboard() {

  const [tab, setTab] = useState('overview')
  const [username] = useState(() => localStorage.getItem('dinkbase.username') ?? '')
  const [games, setGames] = useState([])
  const [gamesError, setGamesError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSavingGame, setIsSavingGame] = useState(false)
  const [deletingGameId, setDeletingGameId] = useState(null)
  const [isLoadingGames, setIsLoadingGames] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGame, setEditingGame] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadGames() {
      if (!username) {
        setGames([])
        setIsLoadingGames(false)
        return
      }

      setIsLoadingGames(true)
      setGamesError('')

      try {
        const { data, error } = await supabase
          .from('game_entries')
          .select('*')
          .eq('username', username)
          .order('game_date', { ascending: false })

        if (error) throw error
        if (isMounted) setGames(data ?? [])
      } catch (error) {
        console.error('Error loading game entries:', error)
        if (isMounted) setGamesError('Could not load your games. Please try again later.')
      } finally {
        if (isMounted) setIsLoadingGames(false)
      }
    }

    loadGames()

    return () => {
      isMounted = false
    }
  }, [username])

  const latestGame = games[0]
  const wins = games.filter((game) => game.win).length
  const winRate = games.length ? Math.round((wins / games.length) * 100) : 0
  const minutes = games.reduce((total, game) => total + game.duration, 0)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  const mostPlayedLocation = useMemo(() => {
    const counts = games.reduce((all, game) => {
      all[game.location] = (all[game.location] || 0) + 1
      return all
    }, {})
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No location'
  }, [games])

  function openNewGame() {
    setEditingGame(null)
    setSaveError('')
    setShowForm(true)
  }

  function openEditGame(game) {
    setEditingGame(game)
    setSaveError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingGame(null)
  }

  function logOut() {
    localStorage.removeItem('dinkbase.username')
    window.location.assign('/')
  }

  async function deleteGame(game) {
    const confirmed = window.confirm(`Delete the game from ${formatGameDate(game.game_date)}? This action cannot be undone.`)
    if (!confirmed) return

    setGamesError('')
    setDeletingGameId(game.id)

    try {
      const { data, error } = await supabase
        .from('game_entries')
        .delete()
        .eq('id', game.id)
        .eq('username', username)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('No matching game entry was deleted.')

      setGames((current) => current.filter((item) => item.id !== game.id))
    } catch (error) {
      console.error('Error deleting game entry:', error)
      setGamesError('Could not delete this game. Please try again later.')
    } finally {
      setDeletingGameId(null)
    }
  }

  async function saveGame(savedGame) {
    setSaveError('')
    setIsSavingGame(true)

    const row = {
      username,
      game_date: savedGame.game_date,
      time_start: savedGame.time_start,
      duration: savedGame.duration,
      location: savedGame.location,
      opponents: savedGame.opponents,
      teammate: savedGame.teammate,
      win: savedGame.win,
      scores: savedGame.scores,
      note: savedGame.note,
    }

    try {
      const { data, error } = editingGame
        ? await supabase
            .from('game_entries')
            .update(row)
            .eq('id', editingGame.id)
            .eq('username', username)
            .select()
            .maybeSingle()
        : await supabase
            .from('game_entries')
            .insert(row)
            .select()
            .single()

      if (error) throw error
      if (!data) throw new Error('No game row was returned after saving.')

      setGames((current) => {
        const updated = editingGame
          ? current.map((game) => (game.id === data.id ? data : game))
          : [data, ...current]
        return updated.sort((a, b) => b.game_date.localeCompare(a.game_date))
      })
      closeForm()
      setTab('games')
    } catch (error) {
      console.error('Error saving game entry:', error)
      setSaveError('Could not save this game. Please check the details and try again.')
    } finally {
      setIsSavingGame(false)
    }
  }

  return (
     <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <button className="dashboard-brand" onClick={() => setTab('overview')}>
            <LogoMark />
            <div className="dashboard-brand-copy">
              <p className="dashboard-brand-name">Dinkbase</p>
              <p className="dashboard-brand-caption">PICKLEBALL TRACKER</p>
            </div>
          </button>
          <div className="dashboard-header-actions">
            <div className="dashboard-user">
              <p className="dashboard-user-name">{username ? `@${username}` : 'Not signed in'}</p>
              <p className="dashboard-user-status">SIGNED IN</p>
            </div>
              <button className="dashboard-logout-button" onClick={logOut} type="button">
                Log out
              </button>
            <button
              aria-label="Post game"
              className="dashboard-post-button"
              onClick={openNewGame}
            >
              <Icon size={17}>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </Icon>
              <span className="dashboard-post-label">Post game</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <nav className="dashboard-tabs" aria-label="Main navigation">
          {['overview', 'games'].map((item) => (
            <button
              className={`dashboard-tab${tab === item ? ' is-active' : ''}`}
              key={item}
              onClick={() => setTab(item)}
            >
              {item === 'games' ? `Game log · ${games.length}` : item}
            </button>
          ))}
        </nav>

        {gamesError && <p className="dashboard-load-error" role="alert">{gamesError}</p>}

        {tab === 'overview' ? (
          <section>
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">
                  {latestGame
                    ? formatMonthYear(latestGame.game_date)
                    : 'No games yet'}
                </p>
                <h1 className="dashboard-page-title">
                  Your month on the court
                </h1>
              </div>
              <p className="dashboard-section-description">
                A quick look at how you’ve been playing this month.
              </p>
            </div>

            <div className="dashboard-stats">
              <StatCard
                accent="green"
                detail={`${wins} wins · ${games.length - wins} losses`}
                eyebrow="Win rate"
                value={`${winRate}%`}
                icon={
                  <Icon size={20}>
                    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </Icon>
                }
              />
              <StatCard
                accent="blue"
                detail={`Across ${games.length} sessions`}
                eyebrow="Time played"
                value={`${hours}h ${remainingMinutes}m`}
                icon={
                  <Icon size={20}>
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 7.5v5l3 1.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </Icon>
                }
              />
              <StatCard
                accent="sand"
                detail={`${games.filter((game) => game.location === mostPlayedLocation).length} games this month`}
                eyebrow="Top location"
                value={mostPlayedLocation}
                icon={
                  <Icon size={20}>
                    <path d="M19 10c0 4.5-7 10-7 10S5 14.5 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
                  </Icon>
                }
              />
            </div>

            <div className="dashboard-latest">
              <div className="dashboard-latest-inner">
                <div>
                  <p className="dashboard-latest-eyebrow">Latest result</p>
                  <h2 className="dashboard-latest-title">
                    {latestGame
                      ? `A ${latestGame.win ? 'win' : 'loss'} at ${latestGame.location}`
                      : 'No games posted yet'}
                  </h2>
                  <p className="dashboard-latest-description">
                    {latestGame
                      ? `${formatGameDate(latestGame.game_date)} · ${latestGame.opponents.join(' & ')} · ${latestGame.scores.join(', ')}`
                      : 'Post your first match to see it here.'}
                  </p>
                </div>
                <button
                  className="dashboard-latest-button"
                  onClick={() => setTab('games')}
                >
                  View game log
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="dashboard-section-heading dashboard-games-heading">
              <div>
                <p className="dashboard-eyebrow">All activity</p>
                <h1 className="dashboard-page-title">Game log</h1>
              </div>
            </div>

            {isLoadingGames ? (
              <p role="status">Loading games…</p>
            ) : games.length ? (
              <>
                <div className="dashboard-game-table-wrap">
                  <table className="dashboard-game-table">
                    <thead>
                      <tr>
                        <th className="column-date">Date &amp; time</th>
                        <th className="column-teammate">Teammate</th>
                        <th className="column-opponents">Opponents</th>
                        <th className="column-score">Score</th>
                        <th className="column-location">Location</th>
                        <th className="column-result">Result</th>
                        <th className="column-note">Note</th>
                        <th className="column-actions"><span className="visually-hidden">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game) => (
                        <tr key={game.id}>
                          <td>
                            <p className="game-date">{formatGameDate(game.game_date)}</p>
                            <p className="game-time">{formatGameTime(game.time_start)}</p>
                          </td>
                          <td className="game-cell-primary">{teammateFor(game)}</td>
                          <td className="game-cell-primary">{game.opponents.join(' & ')}</td>
                          <td className="game-cell-strong">{game.scores.join(', ')}</td>
                          <td className="game-cell-location">{game.location}</td>
                          <td><ResultPill result={game.win ? 'Win' : 'Loss'} /></td>
                          <td className="game-cell-note">{game.note || '—'}</td>
                          <td className="game-cell-actions">
                            <div className="game-actions">
                              <button
                                aria-label={`Edit game from ${formatGameDate(game.game_date)}`}
                                className="game-action-button edit"
                                onClick={() => openEditGame(game)}
                              >
                                <Icon size={16}>
                                  <path d="m5 16.5.8-3.3L15.6 3.4a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2l-9.8 9.8-3.3.8.5-3.3 9.6-9.6 2.3 2.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                </Icon>
                              </button>
                              <button
                                aria-label={`Delete game from ${formatGameDate(game.game_date)}`}
                                className="game-action-button delete"
                                disabled={deletingGameId === game.id}
                                onClick={() => deleteGame(game)}
                              >
                                <Icon size={16}>
                                  <path d="M5.5 7h13M9 7V4.5h6V7m2 0-.7 12H7.7L7 7m3.5 3.5v5m3-5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                </Icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="dashboard-game-cards">
                  {games.map((game) => (
                    <article className="dashboard-game-card" key={game.id}>
                      <div className="dashboard-game-card-header">
                        <div>
                          <p className="game-card-date">{formatGameDate(game.game_date)}</p>
                          <p className="game-card-meta">{formatGameTime(game.time_start)} · {game.location}</p>
                        </div>
                        <div className="game-card-actions">
                          <ResultPill result={game.win ? 'Win' : 'Loss'} />
                          <button
                            aria-label={`Edit game from ${formatGameDate(game.game_date)}`}
                            className="game-action-button edit"
                            onClick={() => openEditGame(game)}
                          >
                            <Icon size={16}>
                              <path d="m5 16.5.8-3.3L15.6 3.4a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2l-9.8 9.8-3.3.8.5-3.3 9.6-9.6 2.3 2.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            </Icon>
                          </button>
                          <button
                            aria-label={`Delete game from ${formatGameDate(game.game_date)}`}
                            className="game-action-button delete"
                            disabled={deletingGameId === game.id}
                            onClick={() => deleteGame(game)}
                          >
                            <Icon size={16}>
                              <path d="M5.5 7h13M9 7V4.5h6V7m2 0-.7 12H7.7L7 7m3.5 3.5v5m3-5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            </Icon>
                          </button>
                        </div>
                      </div>
                      <div className="game-card-teammate">
                        <p className="game-card-label">Teammate</p>
                        <p className="game-card-value">{teammateFor(game)}</p>
                      </div>
                      <div className="game-card-details">
                        <div>
                          <p className="game-card-label">Opponents</p>
                          <p className="game-card-value">{game.opponents.join(' & ')}</p>
                        </div>
                        <div className="game-card-score">
                          <p className="game-card-label">Score</p>
                          <p className="game-card-value game-card-score-value">{game.scores.join(', ')}</p>
                        </div>
                      </div>
                      {game.note && <p className="game-card-note">{game.note}</p>}
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="dashboard-empty-state">
                <div>
                  <div className="dashboard-empty-icon-wrap"><EmptyIcon /></div>
                  <p className="dashboard-empty-title">No games posted yet</p>
                  <p className="dashboard-empty-description">Post your first match to start tracking.</p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {showForm && (
        <NewGameForm
          game={editingGame}
          error={saveError}
          isSaving={isSavingGame}
          onClose={closeForm}
          onSave={saveGame}
          username={username}
        />
      )}
    </div>
  )
}

export default Dashboard
