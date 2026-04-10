import { supabase } from '../lib/supabaseClient'
import { fetchFeedPostSummary } from './feedService'
import { assertServiceSuccess } from './serviceErrors'

function trimNotificationText(text, maxLength = 80) {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`
}

export async function createNotification({
  userId,
  actorUserId,
  type,
  title,
  body,
  entityType = null,
  entityId = null,
  metadata = {},
}) {
  if (!userId || !actorUserId || userId === actorUserId) return null

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      actor_user_id: actorUserId,
      type,
      title,
      body,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    })
    .select('id,user_id,actor_user_id,type,title,body,entity_type,entity_id,metadata,read_at,created_at')
    .single()

  assertServiceSuccess(error, 'notifications.insert')

  return data
}

export async function createFollowNotification(actorUserId, targetUserId) {
  return createNotification({
    userId: targetUserId,
    actorUserId,
    type: 'follow',
    title: '새 팔로워',
    body: '회원님을 새로 팔로우했어요.',
    entityType: 'user',
    entityId: targetUserId,
  })
}

export async function createLikeNotification(actorUserId, postId) {
  const post = await fetchFeedPostSummary(postId)

  if (!post?.user_id || post.user_id === actorUserId) {
    return null
  }

  return createNotification({
    userId: post.user_id,
    actorUserId,
    type: 'like',
    title: '새 좋아요',
    body: '회원님의 게시글에 좋아요를 눌렀어요.',
    entityType: 'feed_post',
    entityId: post.id,
    metadata: {
      postType: post.type,
      postPreview: trimNotificationText(post.content),
    },
  })
}

export async function createCommentNotification(actorUserId, postId, commentContent) {
  const post = await fetchFeedPostSummary(postId)

  if (!post?.user_id || post.user_id === actorUserId) {
    return null
  }

  return createNotification({
    userId: post.user_id,
    actorUserId,
    type: 'comment',
    title: '새 댓글',
    body: '회원님의 게시글에 댓글을 남겼어요.',
    entityType: 'feed_post',
    entityId: post.id,
    metadata: {
      postType: post.type,
      postPreview: trimNotificationText(post.content),
      commentPreview: trimNotificationText(commentContent, 100),
    },
  })
}

export async function fetchNotifications(userId, limit = 30) {
  if (!userId) {
    return {
      notifications: [],
      unreadCount: 0,
    }
  }

  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 30))

  const { data, error } = await supabase.rpc('get_notification_inbox', {
    limit_count: safeLimit,
  })

  assertServiceSuccess(error, 'rpc.get_notification_inbox')

  const notifications = (data ?? []).map((item) => ({
    ...item,
    actorDisplayName: item.actor_display_name ?? null,
    actorAvatarEmoji: item.actor_avatar_emoji ?? 'RUN',
    actorAvatarUrl: item.actor_avatar_url ?? null,
    unread: !item.read_at,
  }))

  return {
    notifications,
    unreadCount: Number(notifications[0]?.unread_count ?? 0),
  }
}

export async function fetchUnreadNotificationCount(userId) {
  if (!userId) {
    return 0
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  assertServiceSuccess(error, 'notifications.count_unread')

  return count ?? 0
}

export async function markNotificationRead(userId, notificationId) {
  if (!userId || !notificationId) {
    return null
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', notificationId)
    .is('read_at', null)
    .select('id,read_at')
    .maybeSingle()

  assertServiceSuccess(error, 'notifications.mark_read')

  return data
}

export async function markAllNotificationsRead(userId) {
  if (!userId) {
    return
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  assertServiceSuccess(error, 'notifications.mark_all_read')
}
