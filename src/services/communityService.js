import { supabase } from '../lib/supabaseClient'
import { getLevelValue } from '../utils/level'

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
    .select('id,display_name,avatar_emoji,weekly_goal,height_cm,target_weight_kg,created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function updateUserProfile(userId, profile) {
  const payload = {
    display_name: profile.displayName?.trim() || null,
    avatar_emoji: profile.avatarEmoji?.trim() || null,
    weekly_goal: Number(profile.weeklyGoal) || 4,
    height_cm: Number(profile.heightCm) > 0 ? Number(profile.heightCm) : null,
    target_weight_kg: Number(profile.targetWeightKg) > 0 ? Number(profile.targetWeightKg) : null,
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('id,display_name,avatar_emoji,weekly_goal,height_cm,target_weight_kg,created_at')
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
    .select('id,date,workout_type,duration_minutes,note,created_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('created_at', { ascending: false })
    .order('date', { ascending: false })
    .limit(31)

  if (error) {
    throw error
  }

  return data
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

  return {
    streak,
    todayCount,
    weeklyCount,
    lastWorkoutDate: history[0]?.date ?? null,
    lastWorkoutType: history[0]?.workout_type ?? null,
    lastWorkoutDuration: history[0]?.duration_minutes ?? null,
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
  const note = details.note?.trim() || null

  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: userId,
      date,
      completed: true,
      workout_type: workoutType,
      duration_minutes: durationMinutes,
      note,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  const durationText = durationMinutes > 0 ? ` ${durationMinutes}분` : ''
  const noteText = note ? ` - ${note}` : ''

  await createFeedPost(
    userId,
    `${workoutType}${durationText} 운동 완료 💪${noteText}`,
    'workout_complete',
    { date, workoutType, durationMinutes, note },
  )

  return data
}

export async function updateWorkoutLog(userId, workoutLogId, details = {}) {
  const workoutType = details.workoutType?.trim() || '운동'
  const durationMinutes = Number(details.durationMinutes) || 0
  const note = details.note?.trim() || null

  const { data, error } = await supabase
    .from('workout_logs')
    .update({
      workout_type: workoutType,
      duration_minutes: durationMinutes,
      note,
    })
    .eq('id', workoutLogId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
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

export async function fetchFeedWithRelations(currentUserId) {
  const { data: posts, error: postError } = await supabase
    .from('feed_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (postError) {
    throw postError
  }

  if (!posts.length) {
    return []
  }

  const postIds = posts.map((post) => post.id)
  const userIds = [...new Set(posts.map((post) => post.user_id).filter(Boolean))]

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
      .select('id,display_name,avatar_emoji')
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

  return posts.map((post) => ({
    ...post,
    authorDisplayName: profileMap[post.user_id]?.display_name ?? null,
    authorAvatarEmoji: profileMap[post.user_id]?.avatar_emoji ?? null,
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
