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

export { EmptyIcon, Icon, LogoMark, ResultPill, StatCard }
