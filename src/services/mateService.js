import { supabase } from '../lib/supabaseClient'
import { assertServiceSuccess } from './serviceErrors'

export async function fetchMatePosts(currentUserId, limit = 24) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 24))

  const { data, error } = await supabase.rpc('get_public_mate_posts', {
    viewer_user_id: currentUserId ?? null,
    limit_count: safeLimit,
  })

  assertServiceSuccess(error, 'rpc.get_public_mate_posts')

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

  assertServiceSuccess(error, 'mate_posts.insert')

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

    assertServiceSuccess(error, 'mate_post_interests.delete')

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

  assertServiceSuccess(error, 'mate_post_interests.insert')

  return data
}

export async function updateMatePostStatus(userId, postId, status = 'closed') {
  const { error } = await supabase
    .from('mate_posts')
    .update({ status })
    .eq('id', postId)
    .eq('user_id', userId)

  assertServiceSuccess(error, 'mate_posts.update_status')

  return { ok: true }
}
