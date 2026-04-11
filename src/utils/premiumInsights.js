import { getLevelValue } from './level.js'

const DAY_LABELS = {
  ko: ['월', '화', '수', '목', '금', '토', '일'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}

function t(isEnglish, ko, en) {
  return isEnglish ? en : ko
}

function clamp(value, min, max) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return min
  return Math.max(min, Math.min(parsed, max))
}

function getPrimaryWorkoutType(workoutHistory = [], profile = {}, isEnglish = false) {
  const typeCounts = workoutHistory.reduce((acc, item) => {
    const key = item.workout_type || item.workoutType || ''
    if (!key) return acc
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const tags = Array.isArray(profile?.fitness_tags) ? profile.fitness_tags : []

  if (topType) return topType
  if (tags.includes('웨이트') || tags.includes('근육 만들기') || tags.includes('벌크업')) return '웨이트'
  if (tags.includes('요가')) return '요가'
  if (tags.includes('러닝') || tags.includes('다이어트')) return '러닝'

  return isEnglish ? 'Strength' : '웨이트'
}

function getSecondaryWorkoutType(primaryType) {
  if (String(primaryType).includes('러닝') || String(primaryType).toLowerCase().includes('run')) return '웨이트'
  if (String(primaryType).includes('웨이트') || String(primaryType).toLowerCase().includes('strength')) return '러닝'
  return '스트레칭'
}

function getRecentMinutes(workoutHistory = [], days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  const sinceKey = since.toLocaleDateString('sv-SE')

  return workoutHistory
    .filter((item) => (item.date ?? '') >= sinceKey)
    .reduce((total, item) => total + (Number(item.duration_minutes ?? item.durationMinutes) || 0), 0)
}

function getWeeklyMinuteBuckets(workoutHistory = [], language = 'ko') {
  const labels = DAY_LABELS[language] ?? DAY_LABELS.ko
  const buckets = labels.map((label) => ({ label, minutes: 0 }))
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 6)

  workoutHistory.forEach((item) => {
    if (!item.date) return
    const date = new Date(`${item.date}T12:00:00`)
    if (date < start || date > today) return
    const dayIndex = (date.getDay() + 6) % 7
    buckets[dayIndex].minutes += Number(item.duration_minutes ?? item.durationMinutes) || 0
  })

  return buckets
}

function getCompletionRate(workoutStats = {}, weeklyGoal = 4) {
  const goal = Math.max(1, Number(weeklyGoal) || 4)
  return clamp(((Number(workoutStats.weeklyCount) || 0) / goal) * 100, 0, 100)
}

export function buildAiTrainingPlan({
  latestResult,
  workoutHistory = [],
  workoutStats = {},
  weeklyGoal = 4,
  profile = {},
  activitySummary = {},
  bodyMetrics = {},
  language = 'ko',
  isEnglish = false,
} = {}) {
  const levelValue = latestResult?.level ? getLevelValue(latestResult.level) : Number(activitySummary?.levelValue) || 1
  const primaryType = getPrimaryWorkoutType(workoutHistory, profile, isEnglish)
  const secondaryType = getSecondaryWorkoutType(primaryType)
  const goal = clamp(weeklyGoal, 3, 6)
  const recentMinutes = getRecentMinutes(workoutHistory, 7)
  const completionRate = getCompletionRate(workoutStats, weeklyGoal)
  const intensity = levelValue >= 5
    ? t(isEnglish, '강도 높게', 'High intensity')
    : levelValue >= 3
      ? t(isEnglish, '중간 강도', 'Moderate')
      : t(isEnglish, '가볍게 시작', 'Gentle start')
  const recoveryNeeded = Number(workoutStats.streak) >= 5 || recentMinutes >= goal * 45
  const overloadPercent = completionRate >= 80 ? 8 : completionRate >= 50 ? 5 : 0
  const baseDuration = clamp(18 + (levelValue * 4), 20, 45)
  const recoveryDuration = recoveryNeeded ? 20 : 25
  const weightGoal = bodyMetrics?.targetDeltaKg
  const goalCopy = weightGoal == null
    ? t(isEnglish, '꾸준한 운동 루틴 만들기', 'Build a consistent training rhythm')
    : weightGoal > 0
      ? t(isEnglish, '체중 목표까지 무리 없이 감량', 'Cut toward your weight goal without overreaching')
      : t(isEnglish, '현재 체중을 유지하면서 체력 상승', 'Maintain weight while improving fitness')

  const weekPlan = [
    {
      day: labelsFor(language, 0),
      focus: primaryType,
      duration: baseDuration,
      intensity,
      note: t(isEnglish, '이번 주 기준 볼륨을 잡는 날', 'Baseline volume day for the week'),
    },
    {
      day: labelsFor(language, 1),
      focus: t(isEnglish, '회복 + 코어', 'Recovery + core'),
      duration: recoveryDuration,
      intensity: t(isEnglish, '낮게', 'Low'),
      note: recoveryNeeded
        ? t(isEnglish, '연속 기록이 길어져 회복을 먼저 배치', 'Recovery placed early because your streak is building')
        : t(isEnglish, '다음 운동을 위해 피로를 낮추는 날', 'Lower fatigue for the next session'),
    },
    {
      day: labelsFor(language, 2),
      focus: secondaryType,
      duration: Math.max(20, baseDuration - 5),
      intensity: t(isEnglish, '중간', 'Moderate'),
      note: t(isEnglish, '주 운동과 반대 자극으로 균형 유지', 'Balance the main pattern with a different stimulus'),
    },
    {
      day: labelsFor(language, 3),
      focus: t(isEnglish, '휴식 또는 산책', 'Rest or walk'),
      duration: 15,
      intensity: t(isEnglish, '회복', 'Recovery'),
      note: t(isEnglish, '무리하지 않는 날이 다음 성장을 만듭니다', 'A low day protects the next hard day'),
    },
    {
      day: labelsFor(language, 4),
      focus: primaryType,
      duration: baseDuration + overloadPercent,
      intensity: overloadPercent > 0 ? t(isEnglish, '점진 증가', 'Progressive overload') : intensity,
      note: overloadPercent > 0
        ? t(isEnglish, `${overloadPercent}%만 올려 안전하게 성장`, `Increase only ${overloadPercent}% for safer progress`)
        : t(isEnglish, '이번 주는 적응을 먼저 만드는 주', 'This week prioritizes adaptation first'),
    },
    {
      day: labelsFor(language, 5),
      focus: t(isEnglish, '자유 운동', 'Flexible session'),
      duration: Math.max(20, baseDuration - 8),
      intensity: t(isEnglish, '편하게', 'Easy'),
      note: t(isEnglish, '피드에 공유하기 좋은 짧은 인증 운동', 'Short session that is easy to share'),
    },
    {
      day: labelsFor(language, 6),
      focus: t(isEnglish, '체크인', 'Check-in'),
      duration: 10,
      intensity: t(isEnglish, '가볍게', 'Light'),
      note: t(isEnglish, '체중, 피로감, 다음 주 목표를 정리', 'Review weight, fatigue, and next week goals'),
    },
  ].slice(0, goal + 1)

  return {
    title: t(isEnglish, 'AI 주간 운동 플랜', 'AI weekly training plan'),
    subtitle: goalCopy,
    confidence: clamp(55 + workoutHistory.length * 3 + (latestResult ? 15 : 0), 55, 94),
    primaryType,
    intensity,
    recoveryNeeded,
    overloadPercent,
    weeklyTarget: t(isEnglish, `주 ${goal}회`, `${goal} sessions/week`),
    recoverySignal: recoveryNeeded
      ? t(isEnglish, '회복 우선: 피로 누적 가능성이 있어요.', 'Recovery first: fatigue may be accumulating.')
      : t(isEnglish, '진행 가능: 다음 운동을 올려도 좋아요.', 'Ready to progress: the next session can move up.'),
    weekPlan,
    monthlyBlocks: [
      t(isEnglish, '1주차: 현재 볼륨 기준선 만들기', 'Week 1: set the current volume baseline'),
      t(isEnglish, '2주차: 완료율 80% 이상이면 5~8% 증가', 'Week 2: increase 5-8% if completion is above 80%'),
      t(isEnglish, '3주차: 가장 약한 운동 패턴 보강', 'Week 3: reinforce the weakest training pattern'),
      t(isEnglish, '4주차: 회복 주간과 레벨 재측정', 'Week 4: deload and retest level'),
    ],
  }
}

function labelsFor(language, index) {
  return (DAY_LABELS[language] ?? DAY_LABELS.ko)[index]
}

export function buildAdvancedAnalytics({
  latestResult,
  workoutHistory = [],
  workoutStats = {},
  weeklyGoal = 4,
  activitySummary = {},
  recentActivityEvents = [],
  language = 'ko',
  isEnglish = false,
} = {}) {
  const levelValue = latestResult?.level ? getLevelValue(latestResult.level) : Number(activitySummary?.levelValue) || 1
  const recentMinutes = getRecentMinutes(workoutHistory, 7)
  const previousMinutes = workoutHistory
    .filter((item) => {
      if (!item.date) return false
      const now = new Date()
      const from = new Date(now)
      const to = new Date(now)
      from.setDate(now.getDate() - 13)
      to.setDate(now.getDate() - 7)
      const key = item.date
      return key >= from.toLocaleDateString('sv-SE') && key <= to.toLocaleDateString('sv-SE')
    })
    .reduce((total, item) => total + (Number(item.duration_minutes ?? item.durationMinutes) || 0), 0)
  const volumeChange = previousMinutes > 0
    ? Math.round(((recentMinutes - previousMinutes) / previousMinutes) * 100)
    : recentMinutes > 0 ? 100 : 0
  const strengthMinutes = workoutHistory
    .filter((item) => String(item.workout_type ?? item.workoutType ?? '').includes('웨이트'))
    .reduce((total, item) => total + (Number(item.duration_minutes ?? item.durationMinutes) || 0), 0)
  const predictedOneRm = strengthMinutes > 0
    ? Math.round(42 + (levelValue * 7.5) + Math.min(strengthMinutes, 360) * 0.08)
    : null
  const completionRate = getCompletionRate(workoutStats, weeklyGoal)
  const recoveryScore = clamp(100 - (recentMinutes / Math.max(weeklyGoal, 1)) + (Number(workoutStats.streak) >= 5 ? -12 : 8), 42, 96)
  const consistencyScore = clamp((completionRate * 0.7) + Math.min(Number(workoutStats.streak) || 0, 14) * 2, 0, 100)
  const xpTrend = recentActivityEvents.slice(0, 7).reverse().map((event, index) => ({
    label: String(index + 1),
    value: Number(event.xp_amount) || 0,
  }))

  return {
    chartBuckets: getWeeklyMinuteBuckets(workoutHistory, language),
    xpTrend,
    cards: [
      {
        label: t(isEnglish, '운동 볼륨', 'Training volume'),
        value: t(isEnglish, `${recentMinutes}분`, `${recentMinutes} min`),
        detail: volumeChange >= 0
          ? t(isEnglish, `지난 주 대비 +${volumeChange}%`, `+${volumeChange}% vs previous week`)
          : t(isEnglish, `지난 주 대비 ${volumeChange}%`, `${volumeChange}% vs previous week`),
      },
      {
        label: t(isEnglish, '1RM 예측', '1RM estimate'),
        value: predictedOneRm ? `${predictedOneRm} kg` : t(isEnglish, '웨이트 기록 필요', 'Add strength logs'),
        detail: predictedOneRm
          ? t(isEnglish, '레벨 + 최근 웨이트 볼륨 기반 추정', 'Estimated from level and strength volume')
          : t(isEnglish, '웨이트 기록을 남기면 자동 계산돼요.', 'Log strength sessions to estimate this.'),
      },
      {
        label: t(isEnglish, '회복 점수', 'Recovery score'),
        value: `${Math.round(recoveryScore)}/100`,
        detail: recoveryScore >= 75
          ? t(isEnglish, '강도를 올려도 좋은 상태', 'Ready for a harder session')
          : t(isEnglish, '하루는 낮은 강도를 추천', 'A lighter day is recommended'),
      },
      {
        label: t(isEnglish, '꾸준함 점수', 'Consistency score'),
        value: `${Math.round(consistencyScore)}/100`,
        detail: t(isEnglish, `주간 목표 ${Math.round(completionRate)}%`, `${Math.round(completionRate)}% of weekly goal`),
      },
    ],
  }
}

export function buildPremiumSharePayload({
  profile = {},
  latestResult,
  workoutStats = {},
  activitySummary = {},
  bodyMetrics = {},
  language = 'ko',
  isEnglish = false,
} = {}) {
  const displayName = profile?.display_name || t(isEnglish, '나의 운동 기록', 'My fitness log')
  const levelText = latestResult?.level
    ? latestResult.level
    : t(isEnglish, '레벨 준비 중', 'Level pending')
  const weeklyCount = Number(workoutStats.weeklyCount) || 0
  const streak = Number(workoutStats.streak) || Number(activitySummary?.currentStreak) || 0
  const weight = bodyMetrics?.latestWeightKg ? `${bodyMetrics.latestWeightKg} kg` : ''

  return {
    eyebrow: t(isEnglish, 'GYM COMMUNITY PRO', 'GYM COMMUNITY PRO'),
    title: displayName,
    metric: t(isEnglish, `${weeklyCount}회 / ${streak}일 연속`, `${weeklyCount} logs / ${streak} day streak`),
    detail: [levelText, `${activitySummary?.totalXp ?? 0} XP`, weight].filter(Boolean).join(' · '),
    footer: t(isEnglish, '프리미엄 성장 카드', 'Premium progress card'),
    language,
  }
}
