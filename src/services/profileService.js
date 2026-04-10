import { supabase } from '../lib/supabaseClient'
import { resolveProfileAvatar } from './mediaService'
import { assertServiceSuccess } from './serviceErrors'

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

  assertServiceSuccess(error, 'users.upsert')
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id,display_name,avatar_emoji,avatar_url,weekly_goal,height_cm,target_weight_kg,bio,fitness_tags,default_share_to_feed,reminder_enabled,reminder_time,total_xp,weekly_points,activity_level,activity_level_label,streak_days,last_activity_date,is_admin,created_at')
    .eq('id', userId)
    .maybeSingle()

  assertServiceSuccess(error, 'users.get_profile')

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

  assertServiceSuccess(error, 'users.update_profile')

  return data
}

export async function fetchWeightLogs(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('weight_logs')
    .select('id,weight_kg,recorded_at,created_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(12)

  assertServiceSuccess(error, 'weight_logs.fetch')

  return data ?? []
}

export async function fetchRecentActivityEvents(userId, limit = 12) {
  if (!userId) {
    return []
  }

  const safeLimit = Math.min(40, Math.max(1, Number(limit) || 12))

  const { data, error } = await supabase
    .from('xp_events')
    .select('id,event_type,xp_amount,weekly_points,reference_type,reference_id,week_key,metadata,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  assertServiceSuccess(error, 'xp_events.fetch_recent')

  return data ?? []
}

export async function fetchAchievementBadges(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('user_badges')
    .select('id,badge_key,metadata,awarded_at')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false })

  assertServiceSuccess(error, 'user_badges.fetch')

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

  assertServiceSuccess(error, 'weight_logs.insert')

  return data
}
