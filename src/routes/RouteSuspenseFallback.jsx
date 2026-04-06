export default function RouteSuspenseFallback({ label = 'Loading...' }) {
  return (
    <section className="card skeleton-screen-card route-skeleton-card">
      <div className="skeleton-copy">
        <span className="skeleton-line short" />
        <span className="skeleton-line long" />
      </div>
      <div className="skeleton-grid">
        <span className="skeleton-panel" />
        <span className="skeleton-panel" />
      </div>
      <p className="subtext skeleton-status-text">{label}</p>
    </section>
  )
}
