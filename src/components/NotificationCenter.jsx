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
      <section className="notification-center-card" onClick={(event) => event.stopPropagation()}>
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
          <button type="button" className="ghost-btn" onClick={onClose}>
            {isEnglish ? 'Close' : '닫기'}
          </button>
        </div>

        <div className="notification-center-actions">
          <button type="button" className="ghost-btn" onClick={onRefresh} disabled={loading}>
            {loading ? (isEnglish ? 'Refreshing...' : '새로고침 중...') : (isEnglish ? 'Refresh' : '새로고침')}
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={onMarkAllRead}
            disabled={loading || unreadCount === 0}
          >
            {isEnglish ? 'Mark All Read' : '모두 읽음'}
          </button>
        </div>

        {loading ? (
          <div className="skeleton-stack">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton-card feed">
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
          <div className="empty-state-card cool notification-empty">
            <span className="empty-state-badge">{isEnglish ? 'Quiet' : '조용함'}</span>
            <strong>{isEnglish ? 'No notifications yet.' : '알림이 아직 없어요.'}</strong>
            <p>
              {isEnglish
                ? 'Follows, likes, and comments appear here.'
                : '팔로우, 좋아요, 댓글이 여기에 와요.'}
            </p>
            <div className="state-action-row notification-empty-actions">
              <button type="button" className="ghost-btn" onClick={onRefresh} disabled={loading}>
                {loading ? (isEnglish ? 'Refreshing...' : '새로고침 중...') : (isEnglish ? 'Refresh' : '새로고침')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
