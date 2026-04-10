function TabIcon({ type }) {
  switch (type) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5" />
        </svg>
      )
    case 'community':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M16.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M4.5 19a4.5 4.5 0 0 1 9 0" />
          <path d="M14 18.5a3.5 3.5 0 0 1 6 0" />
        </svg>
      )
    case 'progress':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 19V10" />
          <path d="M12 19V5" />
          <path d="M18 19v-7" />
          <path d="M4 19.5h16" />
        </svg>
      )
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      )
    default:
      return null
  }
}

export default function BottomTabNav({ tabs, currentView, onChangeView }) {
  return (
    <nav className="tab-nav" data-testid="bottom-tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab-btn ${currentView === tab.key ? 'active' : ''}`}
          onClick={() => onChangeView(tab.key)}
          data-testid={`tab-${tab.key}`}
          aria-label={tab.label}
          aria-current={currentView === tab.key ? 'page' : undefined}
        >
          <span className="tab-icon"><TabIcon type={tab.key} /></span>
          <span className="tab-text">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
