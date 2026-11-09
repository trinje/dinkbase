export function formatGameDate(gameDate) {
  const [year, month, day] = gameDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMonthYear(gameDate) {
  const [year, month, day] = gameDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function formatGameTime(timeStart) {
  const match = timeStart.match(/^(\d{2}):(\d{2})/)
  if (!match) return timeStart
  const hour = Number(match[1])
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function dateForInput(date) {
  if (date) return date
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function timeForInput(timeStart) {
  if (!timeStart) return '18:00'
  const match = timeStart.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : '18:00'
}

export function toPostgresTimeWithZone(dateValue, timeValue) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const [hour, minute] = timeValue.split(':').map(Number)
  const localDateTime = new Date(year, month - 1, day, hour, minute)
  const offsetMinutes = localDateTime.getTimezoneOffset()
  const offsetSign = offsetMinutes <= 0 ? '+' : '-'
  const absoluteOffset = Math.abs(offsetMinutes)
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0')
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, '0')

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${offsetSign}${offsetHours}:${offsetRemainder}`
}

export function currentIsoTimestamp() {
  return new Date().toISOString()
}
