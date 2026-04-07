import { supabase } from '../lib/supabaseClient'
import { getLevelValue } from '../utils/level'

const WORKOUT_MET_MAP = {
  러닝: 9.8,
  웨이트: 6,
  스트레칭: 2.8,
  요가: 3,
  필라테스: 3.8,
  사이클: 7.5,
  운동: 4.5,
  기타: 4.5,
  '빠른 체크인': 2,
}

function getWorkoutMet(workoutType) {
  return WORKOUT_MET_MAP[workoutType] ?? WORKOUT_MET_MAP.운동
}

function calculateEstimatedCalories(workoutType, durationMinutes, weightKg) {
  const parsedDuration = Number(durationMinutes)
  const parsedWeight = Number(weightKg)

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) return null
  if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) return null

  const met = getWorkoutMet(workoutType?.trim() || '운동')
  return Math.round(met * parsedWeight * (parsedDuration / 60))
}

function trimNotificationText(text, maxLength = 80) {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}...`
}

async function fetchFeedPostSummary(postId) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('id,user_id,type,content')
    .eq('id', postId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

async function _fetchProfilesByIds(userIds) {
  const safeIds = [...new Set((userIds ?? []).filter(Boolean))]

  if (!safeIds.length) {
    return {}
  }

  const { data, error } = await supabase
    .from('users')
    .select('id,display_name,avatar_emoji,avatar_url')
    .in('id', safeIds)

  if (error) {
    throw error
  }

  return (data ?? []).reduce((acc, profile) => {
    acc[profile.id] = profile
    return acc
  }, {})
}

export async function upsertUser(userId) {
  const { error } = await supabase.from('users').upsert(
    {
      id: userId,
    },
    {
      onConflict: 'id',
      ignoreDuplicates: true,
    },
  )

  if (error) {
    throw error
  }
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id,display_name,avatar_emoji,avatar_url,weekly_goal,height_cm,target_weight_kg,bio,fitness_tags,default_share_to_feed,reminder_enabled,reminder_time,total_xp,weekly_points,activity_level,activity_level_label,streak_days,last_activity_date,is_admin,created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function updateUserProfile(userId, profile) {
  const fitnessTags = Array.isArray(profile.fitnessTags)
    ? profile.fitnessTags.filter(Boolean).slice(0, 4)
    : []
  const avatarUrl = Object.prototype.hasOwnProperty.call(profile, 'avatarFile')
    ? await resolveProfileAvatar(userId, profile.avatarFile)
    : profile.avatarUrl

  const payload = {
    display_name: profile.displayName?.trim() || null,
    avatar_emoji: profile.avatarEmoji?.trim() || null,
    avatar_url: avatarUrl || null,
    weekly_goal: Number(profile.weeklyGoal) || 4,
    height_cm: Number(profile.heightCm) > 0 ? Number(profile.heightCm) : null,
    target_weight_kg: Number(profile.targetWeightKg) > 0 ? Number(profile.targetWeightKg) : null,
    bio: profile.bio?.trim() || null,
    fitness_tags: fitnessTags,
    default_share_to_feed: profile.defaultShareToFeed !== false,
    reminder_enabled: profile.reminderEnabled === true,
    reminder_time: typeof profile.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(profile.reminderTime)
      ? profile.reminderTime
      : '19:00',
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('id,display_name,avatar_emoji,avatar_url,weekly_goal,height_cm,target_weight_kg,bio,fitness_tags,default_share_to_feed,reminder_enabled,reminder_time,total_xp,weekly_points,activity_level,activity_level_label,streak_days,last_activity_date,is_admin,created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function fetchWeightLogs(userId) {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('id,weight_kg,recorded_at,created_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(12)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchRecentActivityEvents(userId, limit = 12) {
  const safeLimit = Math.min(40, Math.max(1, Number(limit) || 12))

  const { data, error } = await supabase
    .from('xp_events')
    .select('id,event_type,xp_amount,weekly_points,reference_type,reference_id,week_key,metadata,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchAchievementBadges(userId) {
  const { data, error } = await supabase
    .from('user_badges')
    .select('id,badge_key,metadata,awarded_at')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function saveWeightLog(userId, weightKg) {
  const parsedWeight = Number(weightKg)

  if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
    throw new Error('몸무게를 올바르게 입력해주세요.')
  }

  const { data, error } = await supabase
    .from('weight_logs')
    .insert({
      user_id: userId,
      weight_kg: parsedWeight,
    })
    .select('id,weight_kg,recorded_at,created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function followUser(userId, targetUserId) {
  if (!targetUserId || userId === targetUserId) return null

  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: userId,
      following_id: targetUserId,
    })
    .select('id,follower_id,following_id,created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function unfollowUser(userId, targetUserId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', userId)
    .eq('following_id', targetUserId)

  if (error) {
    throw error
  }
}

export async function fetchFollowingIds(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => item.following_id)
}

export async function fetchBlockedIds(userId) {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId)

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => item.blocked_id)
}

export async function fetchMatePosts(currentUserId, limit = 24) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 24))

  const { data, error } = await supabase.rpc('get_public_mate_posts', {
    viewer_user_id: currentUserId ?? null,
    limit_count: safeLimit,
  })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createMatePost(userId, draft = {}) {
  const title = draft.title?.trim()
  const workoutType = draft.workoutType?.trim() || '러닝'
  const locationLabel = draft.locationLabel?.trim()
  const timeSlot = draft.timeSlot?.trim() || 'weekday_evening'
  const difficulty = draft.difficulty?.trim() || 'beginner'
  const capacity = Math.min(20, Math.max(1, Number(draft.capacity) || 2))
  const body = draft.body?.trim() || null

  if (!title) {
    throw new Error('메이트 모집 제목을 입력해주세요.')
  }

  if (!locationLabel) {
    throw new Error('만날 지역이나 장소를 입력해주세요.')
  }

  const { error } = await supabase
    .from('mate_posts')
    .insert({
      user_id: userId,
      title,
      workout_type: workoutType,
      location_label: locationLabel,
      time_slot: timeSlot,
      difficulty,
      capacity,
      body,
      status: 'open',
    })

  if (error) {
    throw error
  }

  return { ok: true }
}

export async function toggleMatePostInterest(userId, postId, isInterested) {
  if (!userId || !postId) return null

  if (isInterested) {
    const { error } = await supabase
      .from('mate_post_interests')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return null
  }

  const { data, error } = await supabase
    .from('mate_post_interests')
    .insert({
      post_id: postId,
      user_id: userId,
    })
    .select('id,post_id,user_id,created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateMatePostStatus(userId, postId, status = 'closed') {
  const { error } = await supabase
    .from('mate_posts')
    .update({ status })
    .eq('id', postId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return { ok: true }
}

export async function blockUser(userId, targetUserId) {
  if (!targetUserId || userId === targetUserId) return null

  const { data, error } = await supabase
    .from('blocks')
    .insert({
      blocker_id: userId,
      blocked_id: targetUserId,
    })
    .select('id,blocker_id,blocked_id,created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function unblockUser(userId, targetUserId) {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', userId)
    .eq('blocked_id', targetUserId)

  if (error) {
    throw error
  }
}

export async function submitReport(reporterId, report) {
  const reason = report.reason?.trim()

  if (!reason) {
    throw new Error('신고 사유를 선택해주세요.')
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      target_user_id: report.targetUserId ?? null,
      post_id: report.postId ?? null,
      reason,
      details: report.details?.trim() || null,
    })
    .select('id,reporter_id,target_user_id,post_id,reason,details,created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function fetchModerationReports(status = 'open', limit = 30) {
  const { data, error } = await supabase.rpc('get_moderation_reports', {
    status_filter: status,
    limit_count: Math.min(50, Math.max(1, Number(limit) || 30)),
  })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function resolveModerationReport(reportId, status, resolutionNote = '') {
  const { data, error } = await supabase.rpc('resolve_report', {
    report_id: reportId,
    next_status: status,
    review_note: resolutionNote?.trim() || null,
  })

  if (error) {
    throw error
  }

  return data
}

export async function fetchFollowStats(userId) {
  const [{ count: followerCount, error: followerError }, { count: followingCount, error: followingError }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])

  if (followerError) {
    throw followerError
  }

  if (followingError) {
    throw followingError
  }

  return {
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
  }
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

  if (error) {
    throw error
  }

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

  if (error) {
    throw error
  }

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
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function markNotificationRead(userId, notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', notificationId)
    .is('read_at', null)
    .select('id,read_at')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) {
    throw error
  }
}

export async function getLatestTestResult(userId) {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  return data[0] ?? null
}

export async function fetchWorkoutHistory(userId) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('id,date,workout_type,duration_minutes,estimated_calories,note,photo_url,photo_urls,share_to_feed,created_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('created_at', { ascending: false })
    .order('date', { ascending: false })
    .limit(31)

  if (error) {
    throw error
  }

  const history = data ?? []

  if (!history.length) {
    return history
  }

  const historyIds = history.map((item) => item.id)
  const { data: xpRows, error: xpError } = await supabase
    .from('xp_events')
    .select('reference_id,xp_amount')
    .eq('user_id', userId)
    .eq('reference_type', 'workout_log')
    .in('reference_id', historyIds)

  if (xpError) {
    throw xpError
  }

  const xpMap = (xpRows ?? []).reduce((acc, item) => {
    acc[item.reference_id] = Number(item.xp_amount) || 0
    return acc
  }, {})

  return history.map((item) => ({
    ...item,
    xp_amount: xpMap[item.id] ?? 0,
  }))
}

export async function fetchWorkoutTemplates(userId) {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('id,name,workout_type,duration_minutes,note,updated_at,created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function saveWorkoutTemplate(userId, template) {
  const name = template.name?.trim()

  if (!name) {
    throw new Error('루틴 이름이 필요합니다.')
  }

  const payload = {
    user_id: userId,
    name,
    workout_type: template.workoutType?.trim() || '운동',
    duration_minutes: Number(template.durationMinutes) || 0,
    note: template.note?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('workout_templates')
    .upsert(payload, { onConflict: 'user_id,name' })
    .select('id,name,workout_type,duration_minutes,note,updated_at,created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteWorkoutTemplate(userId, templateId) {
  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function getWorkoutStats(userId) {
  const history = await fetchWorkoutHistory(userId)
  const dates = history.map((item) => item.date)
  const calories = history.map((item) => Number(item.estimated_calories) || 0)
  const dateSet = new Set(dates)
  const today = new Date()
  const todayKey = today.toLocaleDateString('sv-SE')
  let streak = 0
  const typeCountMap = history.reduce((acc, item) => {
    const key = item.workout_type || '기타'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const typeCounts = Object.entries(typeCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => ({ type, count }))

  for (let offset = 0; offset < dates.length; offset += 1) {
    const cursor = new Date(today)
    cursor.setDate(today.getDate() - offset)
    const key = cursor.toLocaleDateString('sv-SE')

    if (dateSet.has(key)) {
      streak += 1
    } else {
      break
    }
  }

  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 6)
  const weekKey = weekAgo.toLocaleDateString('sv-SE')
  const weeklyCount = dates.filter((date) => date >= weekKey).length
  const todayCount = dates.filter((date) => date === todayKey).length
  const weeklyCalories = history
    .filter((item) => item.date >= weekKey)
    .reduce((total, item) => total + (Number(item.estimated_calories) || 0), 0)
  const todayCalories = history
    .filter((item) => item.date === todayKey)
    .reduce((total, item) => total + (Number(item.estimated_calories) || 0), 0)
  const totalCalories = calories.reduce((total, value) => total + value, 0)

  return {
    streak,
    todayCount,
    todayCalories,
    weeklyCount,
    weeklyCalories,
    totalCalories,
    lastWorkoutDate: history[0]?.date ?? null,
    lastWorkoutType: history[0]?.workout_type ?? null,
    lastWorkoutDuration: history[0]?.duration_minutes ?? null,
    lastWorkoutCalories: history[0]?.estimated_calories ?? null,
    lastWorkoutNote: history[0]?.note ?? null,
    typeCounts,
  }
}

export async function hasWorkoutCompleted(userId, date) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('id,completed')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('completed', true)
    .limit(1)

  if (error) {
    throw error
  }

  return Boolean(data[0])
}

export async function saveTestResult(userId, score, level) {
  const previousResult = await getLatestTestResult(userId)

  const { data, error } = await supabase
    .from('test_results')
    .insert({ user_id: userId, score, level })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  await createFeedPost(
    userId,
    `사용자가 체력 테스트 결과 ${level} (${score}점)를 기록했어요.`,
    'test_result',
    { level, score },
  )

  if (previousResult) {
    const previousLevel = getLevelValue(previousResult.level)
    const nextLevel = getLevelValue(level)

    if (nextLevel > previousLevel) {
      await createFeedPost(
        userId,
        `Lv${previousLevel} -> Lv${nextLevel} 상승 🎉`,
        'level_up',
        { from: previousLevel, to: nextLevel },
      )
    }
  }

  return data
}

export async function completeWorkout(userId, date, details = {}) {
  const workoutType = details.workoutType?.trim() || '운동'
  const durationMinutes = Number(details.durationMinutes) || 0
  const estimatedCalories = calculateEstimatedCalories(workoutType, durationMinutes, details.weightKg)
  const note = details.note?.trim() || null
  const shareToFeed = details.shareToFeed !== false
  const photoUrls = await resolvePhotoItems(userId, details.photoItems ?? details.photoFiles ?? [])
  const photoUrl = photoUrls[0] ?? null

  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: userId,
      date,
      completed: true,
      workout_type: workoutType,
      duration_minutes: durationMinutes,
      estimated_calories: estimatedCalories,
      note,
      photo_url: photoUrl,
      photo_urls: photoUrls,
      share_to_feed: shareToFeed,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  const durationText = durationMinutes > 0 ? ` ${durationMinutes}분` : ''
  const noteText = note ? ` - ${note}` : ''

  if (shareToFeed) {
    await createFeedPost(
      userId,
      `${workoutType}${durationText} 운동 완료 💪${noteText}`,
      'workout_complete',
      { date, workoutType, durationMinutes, note, photoUrl, photoUrls },
    )
  }

  return data
}

export async function updateWorkoutLog(userId, workoutLogId, details = {}) {
  const workoutType = details.workoutType?.trim() || '운동'
  const durationMinutes = Number(details.durationMinutes) || 0
  const estimatedCalories = calculateEstimatedCalories(workoutType, durationMinutes, details.weightKg)
  const note = details.note?.trim() || null
  const photoUrls = Object.prototype.hasOwnProperty.call(details, 'photoItems')
    ? await resolvePhotoItems(userId, details.photoItems)
    : null
  const updatePayload = {
    workout_type: workoutType,
    duration_minutes: durationMinutes,
    estimated_calories: estimatedCalories,
    note,
  }

  if (photoUrls) {
    updatePayload.photo_urls = photoUrls
    updatePayload.photo_url = photoUrls[0] ?? null
  } else if (Object.prototype.hasOwnProperty.call(details, 'photoUrl')) {
    updatePayload.photo_url = details.photoUrl
  }

  const { data, error } = await supabase
    .from('workout_logs')
    .update(updatePayload)
    .eq('id', workoutLogId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

async function uploadImageToBucket(bucketId, userId, file, options = {}) {
  if (!(file instanceof File)) return null
  const preparedFile = await compressImageFile(file)
  const extension = preparedFile.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg'
  const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`

  const { error: uploadError } = await supabase.storage
    .from(bucketId)
    .upload(filePath, preparedFile, {
      cacheControl: options.cacheControl ?? '3600',
      upsert: false,
      contentType: preparedFile.type || `image/${safeExtension}`,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(bucketId).getPublicUrl(filePath)
  return data?.publicUrl ?? null
}

async function uploadWorkoutPhoto(userId, file) {
  return uploadImageToBucket('workout-photos', userId, file)
}

async function resolveProfileAvatar(userId, avatarFile) {
  if (avatarFile === null) return null
  if (!(avatarFile instanceof File)) return null
  return uploadImageToBucket('profile-avatars', userId, avatarFile, { cacheControl: '86400' })
}

async function _uploadWorkoutPhotos(userId, files) {
  const uploads = await Promise.all(
    (files ?? []).slice(0, 4).map((file) => uploadWorkoutPhoto(userId, file)),
  )

  return uploads.filter(Boolean)
}

async function resolvePhotoItems(userId, items) {
  if (!Array.isArray(items) || !items.length) return []

  const orderedUrls = []

  for (const item of items.slice(0, 4)) {
    if (item?.kind === 'existing' && item.url) {
      orderedUrls.push(item.url)
      continue
    }

    const file = item instanceof File ? item : item?.file
    if (file instanceof File) {
      const uploadedUrl = await uploadWorkoutPhoto(userId, file)
      if (uploadedUrl) orderedUrls.push(uploadedUrl)
    }
  }

  return orderedUrls
}

async function compressImageFile(file) {
  if (!(file instanceof File)) return file
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  if (typeof document === 'undefined') return file

  const imageUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = imageUrl
    })

    const maxDimension = 1280
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')

    if (!context) return file

    context.drawImage(image, 0, 0, width, height)
    const candidateQualities = [0.78, 0.68, 0.58]
    let blob = null

    for (const quality of candidateQualities) {
      // Try progressively smaller JPEGs until we meaningfully reduce transfer size.
      const nextBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality)
      })

      if (!nextBlob) continue
      blob = nextBlob

      if (nextBlob.size <= 350 * 1024 || nextBlob.size <= file.size * 0.72) {
        break
      }
    }

    if (!blob || blob.size >= file.size) return file

    const compressedName = file.name.replace(/\.[^.]+$/, '') || 'workout-photo'
    return new File([blob], `${compressedName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export async function deleteWorkoutLog(userId, workoutLogId) {
  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', workoutLogId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function createFeedPost(userId, content, type = 'general', metadata = {}) {
  const { error } = await supabase.from('feed_posts').insert({
    user_id: userId,
    content,
    type,
    metadata,
  })

  if (error) {
    throw error
  }
}

export async function toggleLike(userId, postId, isLiked) {
  if (isLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase.from('likes').insert({
    user_id: userId,
    post_id: postId,
  })

  if (error) {
    throw error
  }
}

export async function addComment(userId, postId, content) {
  const { error } = await supabase.from('comments').insert({
    user_id: userId,
    post_id: postId,
    content,
  })

  if (error) {
    throw error
  }
}

export async function fetchFeedWithRelations(currentUserId, blockedUserIds = []) {
  const { data: posts, error: postError } = await supabase
    .from('feed_posts')
    .select('id,user_id,content,type,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (postError) {
    throw postError
  }

  const visiblePosts = (posts ?? []).filter((post) => !blockedUserIds.includes(post.user_id))

  if (!visiblePosts.length) {
    return []
  }

  const postIds = visiblePosts.map((post) => post.id)
  const userIds = [...new Set(visiblePosts.map((post) => post.user_id).filter(Boolean))]

  const [
    { data: likes, error: likeError },
    { data: comments, error: commentError },
    { data: profiles, error: profileError },
    { data: results, error: resultError },
  ] = await Promise.all([
    supabase.from('likes').select('post_id,user_id').in('post_id', postIds),
    supabase
      .from('comments')
      .select('id,post_id,user_id,content,created_at')
      .in('post_id', postIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('users')
      .select('id,display_name,avatar_emoji,avatar_url')
      .in('id', userIds),
    supabase
      .from('test_results')
      .select('user_id,level,score,created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
  ])

  if (likeError) {
    throw likeError
  }

  if (commentError) {
    throw commentError
  }

  if (profileError) {
    throw profileError
  }

  if (resultError) {
    throw resultError
  }

  const likeMap = likes.reduce((acc, like) => {
    if (!acc[like.post_id]) {
      acc[like.post_id] = { count: 0, likedByMe: false }
    }

    acc[like.post_id].count += 1

    if (like.user_id === currentUserId) {
      acc[like.post_id].likedByMe = true
    }

    return acc
  }, {})

  const commentMap = comments.reduce((acc, comment) => {
    if (!acc[comment.post_id]) {
      acc[comment.post_id] = []
    }

    acc[comment.post_id].push(comment)
    return acc
  }, {})

  const profileMap = (profiles ?? []).reduce((acc, profile) => {
    acc[profile.id] = profile
    return acc
  }, {})

  const latestResultMap = (results ?? []).reduce((acc, result) => {
    if (!acc[result.user_id]) {
      acc[result.user_id] = result
    }

    return acc
  }, {})

  return visiblePosts.map((post) => ({
    ...post,
    authorDisplayName: profileMap[post.user_id]?.display_name ?? null,
    authorAvatarEmoji: profileMap[post.user_id]?.avatar_emoji ?? null,
    authorAvatarUrl: profileMap[post.user_id]?.avatar_url ?? null,
    authorLevel: latestResultMap[post.user_id]?.level ?? null,
    authorScore: latestResultMap[post.user_id]?.score ?? null,
    likeCount: likeMap[post.id]?.count ?? 0,
    likedByMe: likeMap[post.id]?.likedByMe ?? false,
    comments: commentMap[post.id] ?? [],
  }))
}

export async function fetchLeaderboard(limit = 10) {
  const { data, error } = await supabase.rpc('get_public_leaderboard', {
    limit_count: limit,
  })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchPublicProfile(userId) {
  if (!userId) return null

  const { data, error } = await supabase.rpc('get_public_profile', {
    profile_user_id: userId,
  })

  if (error) {
    throw error
  }

  return data?.[0] ?? null
}

export async function searchPublicUsers(query, limit = 12) {
  const trimmedQuery = query?.trim()

  if (!trimmedQuery || trimmedQuery.length < 2) {
    return []
  }

  const safeLimit = Math.min(20, Math.max(1, Number(limit) || 12))

  const { data, error } = await supabase.rpc('search_public_users', {
    search_query: trimmedQuery,
    limit_count: safeLimit,
  })

  if (error) {
    throw error
  }

  return data ?? []
}
