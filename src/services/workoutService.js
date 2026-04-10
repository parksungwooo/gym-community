import { supabase } from '../lib/supabaseClient'
import { getLevelValue } from '../utils/level'
import { createFeedPost } from './feedService'
import { resolvePhotoItems } from './mediaService'
import { assertServiceSuccess } from './serviceErrors'

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

export async function getLatestTestResult(userId) {
  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  assertServiceSuccess(error, 'test_results.fetch_latest')

  return data[0] ?? null
}

export async function fetchWorkoutHistory(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('workout_logs')
    .select('id,date,workout_type,duration_minutes,estimated_calories,note,photo_url,photo_urls,share_to_feed,created_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('created_at', { ascending: false })
    .order('date', { ascending: false })
    .limit(31)

  assertServiceSuccess(error, 'workout_logs.fetch_history')

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

  assertServiceSuccess(xpError, 'xp_events.fetch_workout_xp')

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
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('workout_templates')
    .select('id,name,workout_type,duration_minutes,note,updated_at,created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(6)

  assertServiceSuccess(error, 'workout_templates.fetch')

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

  assertServiceSuccess(error, 'workout_templates.upsert')

  return data
}

export async function deleteWorkoutTemplate(userId, templateId) {
  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId)

  assertServiceSuccess(error, 'workout_templates.delete')
}

export function buildWorkoutStatsFromHistory(history = []) {
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

export async function getWorkoutStats(userId) {
  const history = await fetchWorkoutHistory(userId)
  return buildWorkoutStatsFromHistory(history)
}

export async function hasWorkoutCompleted(userId, date) {
  if (!userId || !date) {
    return false
  }

  const { data, error } = await supabase
    .from('workout_logs')
    .select('id,completed')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('completed', true)
    .limit(1)

  assertServiceSuccess(error, 'workout_logs.has_completed')

  return Boolean(data[0])
}

export async function saveTestResult(userId, score, level) {
  const previousResult = await getLatestTestResult(userId)

  const { data, error } = await supabase
    .from('test_results')
    .insert({ user_id: userId, score, level })
    .select('*')
    .single()

  assertServiceSuccess(error, 'test_results.insert')

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

  assertServiceSuccess(error, 'workout_logs.insert')

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

  assertServiceSuccess(error, 'workout_logs.update')

  return data
}

export async function deleteWorkoutLog(userId, workoutLogId) {
  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', workoutLogId)
    .eq('user_id', userId)

  assertServiceSuccess(error, 'workout_logs.delete')
}
