function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M6.5 16.5h11" />
      <path d="M8 16.5V11a4 4 0 1 1 8 0v5.5" />
      <path d="M5 18h14" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  )
}

function ThemeIcon({ themeMode }) {
  if (themeMode === 'dark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6" />
      <path d="M12 18.9v2.6" />
      <path d="M4.6 4.6 6.4 6.4" />
      <path d="m17.6 17.6 1.8 1.8" />
      <path d="M2.5 12h2.6" />
      <path d="M18.9 12h2.6" />
      <path d="m4.6 19.4 1.8-1.8" />
      <path d="m17.6 6.4 1.8-1.8" />
    </svg>
  )
}

export default function AppTopActions({
  isEnglish,
  themeMode,
  isAuthenticated,
  showNotificationCenter,
  unreadNotificationCount,
  onToggleTheme,
  onOpenNotifications,
}) {
  const themeLabel = themeMode === 'dark'
    ? (isEnglish ? 'Switch to light mode' : '라이트 모드로 전환')
    : (isEnglish ? 'Switch to dark mode' : '다크 모드로 전환')

  return (
    <div
      className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95"
      aria-label={isEnglish ? 'Global actions' : '빠른 메뉴'}
    >
      <button
        type="button"
        className="grid h-11 w-11 place-items-center rounded-lg text-gray-600 transition hover:bg-gray-50 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
        onClick={onToggleTheme}
        title={themeLabel}
        aria-label={themeLabel}
        data-testid="theme-toggle"
      >
        <ThemeIcon themeMode={themeMode} />
      </button>

      {isAuthenticated && (
        <button
          type="button"
          className={`relative grid h-11 w-11 place-items-center rounded-lg transition ${
            showNotificationCenter
              ? 'bg-emerald-500 text-white'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white'
          }`}
          onClick={onOpenNotifications}
          title={isEnglish ? 'Open notifications' : '알림 열기'}
          aria-label={isEnglish ? 'Open notifications' : '알림 열기'}
          data-testid="notification-trigger"
        >
          <BellIcon />
          {unreadNotificationCount > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
