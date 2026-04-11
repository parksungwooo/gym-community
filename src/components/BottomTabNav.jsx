function TabIcon({ type }) {
  const iconClass = 'h-5 w-5 fill-none stroke-current stroke-2'

  switch (type) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5" />
        </svg>
      )
    case 'community':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M16.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M4.5 19a4.5 4.5 0 0 1 9 0" />
          <path d="M14 18.5a3.5 3.5 0 0 1 6 0" />
        </svg>
      )
    case 'progress':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
          <path d="M6 19V10" />
          <path d="M12 19V5" />
          <path d="M18 19v-7" />
          <path d="M4 19.5h16" />
        </svg>
      )
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
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
    <nav
      className="grid grid-cols-4 gap-1 rounded-3xl border border-gray-100 bg-white/95 p-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95"
      data-testid="bottom-tab-nav"
    >
      {tabs.map((tab) => {
        const isActive = currentView === tab.key

        return (
          <button
            key={tab.key}
            type="button"
            className={`grid min-h-14 place-items-center gap-1 rounded-lg px-2 py-2 text-xs font-black transition ${
              isActive
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-100 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
            onClick={() => onChangeView(tab.key)}
            data-testid={`tab-${tab.key}`}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <TabIcon type={tab.key} />
            <span className="leading-none">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
