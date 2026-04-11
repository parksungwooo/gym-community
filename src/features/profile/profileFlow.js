import { getLevelValue } from '../../utils/level'

export const LAST_REMINDER_STORAGE_KEY = 'gym-community.last-reminder.v1'

export const INITIAL_STATS = {
  streak: 0,
  todayCount: 0,
  todayCalories: 0,
  weeklyCount: 0,
  weeklyCalories: 0,
  totalCalories: 0,
  lastWorkoutDate: null,
  lastWorkoutType: null,
  lastWorkoutDuration: null,
  lastWorkoutCalories: null,
  lastWorkoutNote: null,
  typeCounts: [],
}

export function createGuestProfile() {
  return {
    display_name: '',
    avatar_emoji: 'RUN',
    avatar_url: null,
    weekly_goal: 4,
    bio: '',
    fitness_tags: [],
    default_share_to_feed: true,
    reminder_enabled: false,
    reminder_time: '19:00',
    total_xp: 0,
    weekly_points: 0,
    activity_level: 1,
    activity_level_label: 'Starter',
    streak_days: 0,
    last_activity_date: null,
    height_cm: null,
    target_weight_kg: null,
    is_admin: false,
    is_pro: false,
    subscription_tier: 'free',
  }
}

export function formatReminderTimeLabel(timeValue, language) {
  if (!timeValue || !/^\d{2}:\d{2}$/.test(timeValue)) return language === 'en' ? '7:00 PM' : '오후 7:00'

  const [hourText, minuteText] = timeValue.split(':')
  const date = new Date()
  date.setHours(Number(hourText), Number(minuteText), 0, 0)

  return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getReminderStatus(profile, todayDone, language) {
  const enabled = profile?.reminder_enabled === true
  const reminderTime = profile?.reminder_time || '19:00'
  const now = new Date()
  const [hourText = '19', minuteText = '00'] = reminderTime.split(':')
  const scheduledAt = new Date(now)
  scheduledAt.setHours(Number(hourText), Number(minuteText), 0, 0)

  return {
    enabled,
    reminderTime,
    reminderTimeLabel: formatReminderTimeLabel(reminderTime, language),
    due: enabled && !todayDone && now >= scheduledAt,
    todayKey: now.toLocaleDateString('sv-SE'),
  }
}

export function buildBadges(stats, latestResult) {
  const badges = ['starter']

  if (stats.weeklyCount >= 3) badges.push('weekly3')
  if (stats.streak >= 3) badges.push('streak3')
  if (stats.streak >= 7) badges.push('streak7')
  if (latestResult && getLevelValue(latestResult.level) >= 4) badges.push('highFitness')

  return badges
}

export function buildChallenge(stats, profile, isEnglish) {
  const goal = profile?.weekly_goal || 4
  const current = Math.min(stats.weeklyCount, goal)

  return {
    title: isEnglish ? `${goal} Workouts This Week` : `주간 ${goal}회 운동 챌린지`,
    goal,
    current,
    progress: Math.min(Math.round((current / goal) * 100), 100),
  }
}

export function validateDisplayName(name, isEnglish) {
  const trimmed = name.trim()

  if (!trimmed) return isEnglish ? 'Please enter a nickname.' : '닉네임을 입력해 주세요.'
  if (trimmed.length < 2 || trimmed.length > 12) return isEnglish ? 'Nickname must be 2 to 12 characters.' : '닉네임은 2~12자로 입력해 주세요.'
  if (!/^[0-9A-Za-z가-힣]+$/.test(trimmed)) return isEnglish ? 'Nickname can use Korean, English letters, and numbers only.' : '닉네임은 한글, 영문, 숫자만 사용할 수 있어요.'

  return ''
}
