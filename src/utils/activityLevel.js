const ACTIVITY_LEVELS = [
  { value: 1, minXp: 0, label: { ko: '스타터', en: 'Starter' } },
  { value: 2, minXp: 60, label: { ko: '워밍업', en: 'Warm Up' } },
  { value: 3, minXp: 140, label: { ko: '모멘텀', en: 'Momentum' } },
  { value: 4, minXp: 260, label: { ko: '꾸준함', en: 'Consistent' } },
  { value: 5, minXp: 430, label: { ko: '챌린저', en: 'Challenger' } },
  { value: 6, minXp: 660, label: { ko: '스트롱 플로우', en: 'Strong Flow' } },
  { value: 7, minXp: 960, label: { ko: '애슬릿', en: 'Athlete' } },
  { value: 8, minXp: 1350, label: { ko: '엘리트', en: 'Elite' } },
  { value: 9, minXp: 1840, label: { ko: '아이언', en: 'Iron' } },
  { value: 10, minXp: 2450, label: { ko: '레전드', en: 'Legend' } },
]

const ACTIVITY_BADGE_LABELS = {
  first_workout: { ko: '첫 운동 기록', en: 'First Workout' },
  first_photo_proof: { ko: '첫 사진 인증', en: 'First Photo Proof' },
  streak_3: { ko: '3일 연속', en: '3-Day Streak' },
  streak_7: { ko: '7일 연속', en: '7-Day Streak' },
  streak_14: { ko: '14일 연속', en: '14-Day Streak' },
  goal_first_clear: { ko: '주간 목표 달성', en: 'Weekly Goal Clear' },
  first_test: { ko: '첫 체력 테스트', en: 'First Fitness Test' },
  weight_goal_25: { ko: '체중 목표 25%', en: '25% Weight Goal' },
  weight_goal_100: { ko: '체중 목표 달성', en: 'Weight Goal Complete' },
  workout_100: { ko: '운동 100회', en: '100 Workouts' },
}

const ACTIVITY_EVENT_META = {
  workout_complete: {
    label: { ko: '운동 완료', en: 'Workout Complete' },
    fallbackDescription: { ko: '운동 기록으로 XP를 얻었어요.', en: 'XP earned from a saved workout.' },
  },
  weight_log: {
    label: { ko: '몸무게 기록', en: 'Weight Log' },
    fallbackDescription: { ko: '몸무게 체크로 XP를 얻었어요.', en: 'XP earned from a weight check-in.' },
  },
  test_result: {
    label: { ko: '체력 테스트', en: 'Fitness Test' },
    fallbackDescription: { ko: '체력 테스트 기록으로 XP를 얻었어요.', en: 'XP earned from a saved fitness test.' },
  },
}

function getSafeXp(totalXp) {
  const numericValue = Number(totalXp)
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : 0
}

export function getActivityLevelByXp(totalXp) {
  const safeXp = getSafeXp(totalXp)
  let currentLevel = ACTIVITY_LEVELS[0]

  for (const level of ACTIVITY_LEVELS) {
    if (safeXp >= level.minXp) {
      currentLevel = level
    } else {
      break
    }
  }

  return currentLevel
}

export function getActivityLevelProgress(totalXp) {
  const safeXp = getSafeXp(totalXp)
  const currentLevel = getActivityLevelByXp(safeXp)
  const nextLevel = ACTIVITY_LEVELS.find((level) => level.value === currentLevel.value + 1) ?? null
  const currentMinXp = currentLevel.minXp
  const nextMinXp = nextLevel?.minXp ?? currentLevel.minXp
  const segmentRange = Math.max(nextMinXp - currentMinXp, 1)
  const segmentProgress = nextLevel
    ? Math.min(Math.max(safeXp - currentMinXp, 0), segmentRange)
    : segmentRange

  return {
    totalXp: safeXp,
    levelValue: currentLevel.value,
    levelLabel: currentLevel.label,
    nextLevelValue: nextLevel?.value ?? null,
    nextLevelLabel: nextLevel?.label ?? null,
    currentMinXp,
    nextMinXp: nextLevel?.minXp ?? null,
    remainingXp: nextLevel ? Math.max(nextLevel.minXp - safeXp, 0) : 0,
    progressPercent: nextLevel ? Math.round((segmentProgress / segmentRange) * 100) : 100,
  }
}

export function getActivityBadgeLabel(key, language = 'ko') {
  return ACTIVITY_BADGE_LABELS[key]?.[language] ?? key
}

export function getActivityEventMeta(event, language = 'ko') {
  const eventType = event?.event_type ?? 'workout_complete'
  const baseMeta = ACTIVITY_EVENT_META[eventType] ?? ACTIVITY_EVENT_META.workout_complete
  const metadata = event?.metadata ?? {}

  if (eventType === 'workout_complete') {
    const workoutType = metadata.workoutType || metadata.workout_type || (language === 'en' ? 'Workout' : '운동')
    const durationMinutes = Number(metadata.durationMinutes ?? metadata.duration_minutes)
    const parts = [workoutType]

    if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
      parts.push(language === 'en' ? `${durationMinutes} min` : `${durationMinutes}분`)
    }

    return {
      label: baseMeta.label[language],
      description: parts.join(' · '),
    }
  }

  if (eventType === 'weight_log') {
    const weightKg = Number(metadata.weightKg ?? metadata.weight_kg)
    return {
      label: baseMeta.label[language],
      description: Number.isFinite(weightKg) && weightKg > 0
        ? (language === 'en' ? `${weightKg} kg logged` : `${weightKg}kg 기록`)
        : baseMeta.fallbackDescription[language],
    }
  }

  if (eventType === 'test_result') {
    const score = Number(metadata.score)
    const level = metadata.level
    const summary = []

    if (Number.isFinite(score)) {
      summary.push(language === 'en' ? `${score} pts` : `${score}점`)
    }

    if (typeof level === 'string' && level.trim()) {
      summary.push(level)
    }

    return {
      label: baseMeta.label[language],
      description: summary.length ? summary.join(' · ') : baseMeta.fallbackDescription[language],
    }
  }

  return {
    label: baseMeta.label[language],
    description: baseMeta.fallbackDescription[language],
  }
}

export { ACTIVITY_LEVELS }
