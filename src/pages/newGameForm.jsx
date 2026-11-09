import { currentIsoTimestamp, dateForInput, timeForInput, toPostgresTimeWithZone } from '../utils/dateTime'

/** @typedef {{ id: number, created_at: string, username: string, email: string, game_date: string, time_start: string, duration: number, location: string, opponents: string[], teammate: string, win: boolean, scores: string[], note: string }} Game */
/** @typedef {{ game: Game | null, username: string, error: string, isSaving: boolean, onClose: () => void, onSave: (game: Game) => Promise<void> }} NewGameFormProps */

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

/** @param {NewGameFormProps} props */
function NewGameForm({ game, username, error, isSaving, onClose, onSave }) {
  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const dateValue = String(data.get('date'))
    const timeValue = String(data.get('time'))
    const result = String(data.get('result'))

    await onSave({
      id: game?.id ?? Date.now(),
      created_at: game?.created_at ?? currentIsoTimestamp(),
      username: game?.username ?? username,
      email: game?.email ?? '',
      game_date: dateValue,
      time_start: toPostgresTimeWithZone(dateValue, timeValue),
      teammate: String(data.get('teammate')),
      opponents: String(data.get('opponents')).split(',').map((name) => name.trim()).filter(Boolean),
      scores: String(data.get('scores')).split(',').map((score) => score.trim()).filter(Boolean),
      location: String(data.get('location')),
      win: result === 'Win',
      note: String(data.get('note')),
      duration: Number(data.get('duration')),
    })
  }

  return (
    <div
      className="dashboard-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dashboard-modal">
        <div className="dashboard-modal-header">
          <div>
            <p className="dashboard-modal-title">{game ? 'Edit game' : 'Post a game'}</p>
            <p className="dashboard-modal-description">
              {game ? 'Update the details for this match.' : 'Add the details from your latest match.'}
            </p>
          </div>
          <button
            aria-label="Close"
            className="dashboard-modal-close"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <form className="dashboard-game-form" onSubmit={handleSubmit}>
          {error && <p className="dashboard-form-error" role="alert">{error}</p>}
          <label className="form-field">
            <span>Date</span>
            <input defaultValue={dateForInput(game?.game_date)} name="date" required type="date" />
          </label>
          <label className="form-field">
            <span>Time</span>
            <input defaultValue={timeForInput(game?.time_start)} name="time" required type="time" />
          </label>
          <label className="form-field form-field-wide">
            <span>Teammate</span>
            <input defaultValue={game?.teammate ?? ''} name="teammate" placeholder="Who played on your side?" required />
          </label>
          <label className="form-field form-field-wide">
            <span>Opponents</span>
            <input defaultValue={game?.opponents.join(', ') ?? ''} name="opponents" placeholder="e.g. Morgan Lee, Casey Smith" required />
          </label>
          <label className="form-field">
            <span>Score</span>
            <input defaultValue={game?.scores.join(', ') ?? ''} name="scores" placeholder="11-8, 11-6" required />
          </label>
          <label className="form-field">
            <span>Location</span>
            <input defaultValue={game?.location ?? ''} name="location" placeholder="Court or club" required />
          </label>
          <label className="form-field">
            <span>Result</span>
            <select defaultValue={game ? (game.win ? 'Win' : 'Loss') : 'Win'} name="result">
              <option>Win</option>
              <option>Loss</option>
            </select>
          </label>
          <label className="form-field">
            <span>Duration (minutes)</span>
            <input defaultValue={game?.duration ?? 60} min="1" name="duration" required type="number" />
          </label>
          <label className="form-field form-field-wide">
            <span>Note <em>Optional</em></span>
            <textarea defaultValue={game?.note ?? ''} name="note" placeholder="Anything worth remembering?" rows={3} />
          </label>
          <div className="dashboard-form-actions">
            <button className="dashboard-form-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="dashboard-form-submit" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : game ? 'Save changes' : 'Add to game log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewGameForm
