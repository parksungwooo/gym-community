import UserAvatar from './UserAvatar'
import { formatDateTimeByLanguage, useI18n } from '../i18n.js'

function getNotificationLabel(type, isEnglish) {
  switch (type) {
    case 'follow':
      return isEnglish ? 'Follow' : '팔로우'
    case 'like':
      return isEnglish ? 'Like' : '좋아요'
    case 'comment':
      return isEnglish ? 'Comment' : '댓글'
    default:
      return isEnglish ? 'Update' : '알림'
  }
}

function getNotificationPreview(notification, isEnglish) {
  if (notification.type === 'comment' && notification.metadata?.commentPreview) {
    return notification.metadata.commentPreview
  }

  if (notification.metadata?.postPreview) {
    return notification.metadata.postPreview
  }

  return isEnglish ? 'Open community to see activity.' : '커뮤니티에서 확인해보세요.'
}

function NotificationRow({ notification, onOpen }) {
  const { language, isEnglish } = useI18n()
  const actorName = notification.actorDisplayName || (isEnglish ? 'Someone' : '누군가')

  return (
    <button
      type="button"
      className={`notification-row ${notification.unread ? 'unread' : ''}`}
      onClick={() => onOpen(notification)}
    >
      <UserAvatar
        className="notification-avatar"
        imageUrl={notification.actorAvatarUrl}
        fallback={notification.actorAvatarEmoji || 'RUN'}
        alt={actorName}
      />
      <div className="notification-copy">
        <div className="notification-topline">
          <span className="notification-type-chip">{getNotificationLabel(notification.type, isEnglish)}</span>
          <span className="notification-time">
            {formatDateTimeByLanguage(notification.created_at, language, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <strong>{actorName}</strong>
        <p>{notification.body}</p>
        <span className="notification-preview">{getNotificationPreview(notification, isEnglish)}</span>
      </div>
      {notification.unread && <span className="notification-unread-dot" aria-hidden="true" />}
    </button>
  )
}

export default function NotificationCenter({
  open,
  loading,
  notifications,
  unreadCount,
  onClose,
  onRefresh,
  onMarkAllRead,
  onOpenNotification,
}) {
  const { isEnglish } = useI18n()

  if (!open) return null

  return (
    <div className="notification-center-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="grid w-full max-w-md gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="notification-center-header">
          <div>
            <span className="auth-modal-kicker">{isEnglish ? 'Inbox' : '알림함'}</span>
            <h2>{isEnglish ? 'Notifications' : '알림'}</h2>
            <p className="subtext">
              {unreadCount > 0
                ? (isEnglish ? `${unreadCount} unread` : `안 읽은 알림 ${unreadCount}개`)
                : (isEnglish ? 'All caught up.' : '모두 확인했어요.')}
            </p>
          </div>
          <button type="button" className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-600 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-300 dark:hover:text-white" onClick={onClose}>
            {isEnglish ? 'Close' : '닫기'}
          </button>
        </div>

        <div className="notification-center-actions">
          <button type="button" className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-600 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-300 dark:hover:text-white" onClick={onRefresh} disabled={loading}>
            {loading ? (isEnglish ? 'Refreshing...' : '새로고침 중...') : (isEnglish ? 'Refresh' : '새로고침')}
          </button>
          <button
            type="button"
            className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
            onClick={onMarkAllRead}
            disabled={loading || unreadCount === 0}
          >
            {isEnglish ? 'Mark All Read' : '모두 읽음'}
          </button>
        </div>

        {loading ? (
          <div className="skeleton-stack">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="grid gap-3 rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
                <div className="skeleton-row spread">
                  <div className="skeleton-copy">
                    <span className="skeleton-line medium" />
                    <span className="skeleton-line short" />
                  </div>
                  <span className="skeleton-chip" />
                </div>
                <span className="skeleton-line long" />
                <span className="skeleton-line long" />
              </div>
            ))}
          </div>
        ) : notifications.length ? (
          <div className="notification-list">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onOpen={onOpenNotification} />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
            <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{isEnglish ? 'Quiet' : '조용함'}</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white">{isEnglish ? 'No notifications yet.' : '알림이 아직 없어요.'}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-500 dark:text-gray-400">
              {isEnglish
                ? 'Follows, likes, and comments appear here.'
                : '팔로우, 좋아요, 댓글이 여기에 와요.'}
            </p>
            <div className="state-action-row notification-empty-actions">
              <button type="button" className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-600 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-300 dark:hover:text-white" onClick={onRefresh} disabled={loading}>
                {loading ? (isEnglish ? 'Refreshing...' : '새로고침 중...') : (isEnglish ? 'Refresh' : '새로고침')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
