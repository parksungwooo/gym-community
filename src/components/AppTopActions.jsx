function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
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
  return (
    <div className="app-floating-actions" aria-label={isEnglish ? 'Global actions' : '빠른 메뉴'}>
      <div className="app-action-dock">
        <button
          type="button"
          className="theme-toggle-btn icon-only"
          onClick={onToggleTheme}
          title={themeMode === 'dark'
            ? (isEnglish ? 'Switch to light mode' : '라이트 모드로 전환')
            : (isEnglish ? 'Switch to dark navy mode' : '네이비 다크로 전환')}
          aria-label={isEnglish
            ? `Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`
            : `${themeMode === 'dark' ? '라이트' : '다크'} 테마로 전환`}
          data-testid="theme-toggle"
        >
          <span className="theme-toggle-icon"><ThemeIcon themeMode={themeMode} /></span>
          <span className="sr-only">
            {themeMode === 'dark'
              ? (isEnglish ? 'Dark navy' : '네이비 다크')
              : (isEnglish ? 'Light mode' : '라이트 모드')}
          </span>
        </button>
        {isAuthenticated && (
          <button
            type="button"
            className={`notification-trigger icon-only ${showNotificationCenter ? 'active' : ''}`}
            onClick={onOpenNotifications}
            title={isEnglish ? 'Open notifications' : '알림 열기'}
            aria-label={isEnglish ? 'Open notifications' : '알림 열기'}
            data-testid="notification-trigger"
          >
            <span className="notification-trigger-icon"><BellIcon /></span>
            <span className="sr-only">{isEnglish ? 'Notifications' : '알림'}</span>
            {unreadNotificationCount > 0 && (
              <span className="notification-trigger-badge">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
