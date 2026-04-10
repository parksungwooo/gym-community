import { supabase } from '../lib/supabaseClient'
import { assertServiceSuccess } from './serviceErrors'

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

  assertServiceSuccess(error, 'follows.insert')

  return data
}

export async function unfollowUser(userId, targetUserId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', userId)
    .eq('following_id', targetUserId)

  assertServiceSuccess(error, 'follows.delete')
}

export async function fetchFollowingIds(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  assertServiceSuccess(error, 'follows.fetch_following_ids')

  return (data ?? []).map((item) => item.following_id)
}

export async function fetchBlockedIds(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId)

  assertServiceSuccess(error, 'blocks.fetch_blocked_ids')

  return (data ?? []).map((item) => item.blocked_id)
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

  assertServiceSuccess(error, 'blocks.insert')

  return data
}

export async function unblockUser(userId, targetUserId) {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', userId)
    .eq('blocked_id', targetUserId)

  assertServiceSuccess(error, 'blocks.delete')
}

export async function fetchFollowStats(userId) {
  if (!userId) {
    return {
      followerCount: 0,
      followingCount: 0,
    }
  }

  const [{ count: followerCount, error: followerError }, { count: followingCount, error: followingError }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])

  assertServiceSuccess(followerError, 'follows.count_followers')
  assertServiceSuccess(followingError, 'follows.count_following')

  return {
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
  }
}

export async function fetchPublicProfile(userId) {
  if (!userId) return null

  const { data, error } = await supabase.rpc('get_public_profile', {
    profile_user_id: userId,
  })

  assertServiceSuccess(error, 'rpc.get_public_profile')

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

  assertServiceSuccess(error, 'rpc.search_public_users')

  return data ?? []
}
