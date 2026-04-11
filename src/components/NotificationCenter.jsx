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
      className={`grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl border p-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/10 ${notification.unread ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-700/20' : 'border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-neutral-950'}`}
      onClick={() => onOpen(notification)}
    >
      <UserAvatar
        className="h-12 w-12 rounded-2xl"
        imageUrl={notification.actorAvatarUrl}
        fallback={notification.actorAvatarEmoji || 'RUN'}
        alt={actorName}
      />
      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-emerald-700 shadow-sm dark:bg-neutral-900 dark:text-emerald-200">{getNotificationLabel(notification.type, isEnglish)}</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {formatDateTimeByLanguage(notification.created_at, language, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <strong className="truncate text-base font-black text-gray-950 dark:text-white">{actorName}</strong>
        <p className="m-0 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">{notification.body}</p>
        <span className="truncate text-xs font-bold text-gray-700 dark:text-gray-200">{getNotificationPreview(notification, isEnglish)}</span>
      </div>
      {notification.unread && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-700 dark:bg-emerald-300" aria-hidden="true" />}
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
    <div className="fixed inset-0 z-50 grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="grid w-full max-w-md gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Inbox' : '알림함'}</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'Notifications' : '알림'}</h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {unreadCount > 0
                ? (isEnglish ? `${unreadCount} unread` : `안 읽은 알림 ${unreadCount}개`)
                : (isEnglish ? 'All caught up.' : '모두 확인했어요.')}
            </p>
          </div>
          <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onClose}>
            {isEnglish ? 'Close' : '닫기'}
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onRefresh} disabled={loading}>
            {loading ? (isEnglish ? 'Refreshing...' : '새로고침 중...') : (isEnglish ? 'Refresh' : '새로고침')}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
            onClick={onMarkAllRead}
            disabled={loading || unreadCount === 0}
          >
            {isEnglish ? 'Mark All Read' : '모두 읽음'}
          </button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="grid gap-3 rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid flex-1 gap-2">
                    <span className="h-3 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                    <span className="h-3 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                  </div>
                  <span className="h-8 w-16 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
                </div>
                <span className="h-3 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                <span className="h-3 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : notifications.length ? (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onOpen={onOpenNotification} />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
            <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{isEnglish ? 'Quiet' : '조용함'}</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white">{isEnglish ? 'No notifications yet.' : '알림이 아직 없어요.'}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {isEnglish
                ? 'Follows, likes, and comments appear here.'
                : '팔로우, 좋아요, 댓글이 여기에 와요.'}
            </p>
            <div className="grid">
              <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onRefresh} disabled={loading}>
                {loading ? (isEnglish ? 'Refreshing...' : '새로고침 중...') : (isEnglish ? 'Refresh' : '새로고침')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
