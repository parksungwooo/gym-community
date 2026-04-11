const LEVEL_RECOMMENDATIONS = [
  {
    maxLevel: 1,
    workoutType: '걷기',
    mainExercise: '빠른 걷기',
    durationMinutes: 15,
    setsLabel: '호흡 열기 1회',
    intensity: { ko: '가볍게', en: 'Light' },
    focus: { ko: '습관 시작', en: 'Habit start' },
    title: { ko: '가벼운 걷기 15분', en: '15-min easy walk' },
    reason: { ko: '몸을 깨우는 정도만으로도 오늘 루프는 충분히 시작돼요.', en: 'A small start is enough to build rhythm.' },
    exercises: ['빠른 걷기 15분', '종아리 스트레칭 2분'],
  },
  {
    maxLevel: 2,
    workoutType: '러닝',
    mainExercise: '이지 러닝',
    durationMinutes: 20,
    setsLabel: '러닝 20분',
    intensity: { ko: '편하게', en: 'Easy pace' },
    focus: { ko: '심폐 리듬', en: 'Cardio rhythm' },
    title: { ko: '편한 러닝 20분', en: '20-min easy run' },
    reason: { ko: '숨이 살짝 차는 정도로 리듬을 만들기 좋아요.', en: 'A low-friction cardio block that keeps progress moving.' },
    exercises: ['이지 러닝 20분', '걷기 쿨다운 3분'],
  },
  {
    maxLevel: 3,
    workoutType: '웨이트',
    mainExercise: '전신 근력',
    durationMinutes: 25,
    setsLabel: '전신 3라운드',
    intensity: { ko: '중간 강도', en: 'Moderate' },
    focus: { ko: '전신 균형', en: 'Full-body balance' },
    title: { ko: '전신 근력 25분', en: '25-min full-body strength' },
    reason: { ko: '큰 근육을 골고루 깨우면 XP와 체감 성장이 같이 올라가요.', en: 'A balanced strength block for XP and consistency.' },
    exercises: ['스쿼트 3세트', '푸시업 3세트', '힙힌지 3세트'],
  },
  {
    maxLevel: 5,
    workoutType: '웨이트',
    mainExercise: '스쿼트',
    durationMinutes: 35,
    setsLabel: '스쿼트 4세트',
    intensity: { ko: '강하게', en: 'Strong' },
    focus: { ko: '하체 볼륨', en: 'Lower-body volume' },
    title: { ko: '하체 근력 35분', en: '35-min lower-body strength' },
    reason: { ko: '지난 기록보다 볼륨을 조금만 올려도 하체 성장 신호가 또렷해져요.', en: 'A controlled overload day for visible lower-body progress.' },
    exercises: ['스쿼트 4세트', '런지 3세트', '힙힌지 3세트'],
  },
  {
    maxLevel: 10,
    workoutType: '러닝',
    mainExercise: '템포 러닝',
    durationMinutes: 35,
    setsLabel: '템포 35분',
    intensity: { ko: '꾸준하게', en: 'Steady pace' },
    focus: { ko: '지구력 볼륨', en: 'Endurance volume' },
    title: { ko: '템포 러닝 35분', en: '35-min tempo run' },
    reason: { ko: '높은 레벨은 꾸준한 볼륨에서 가장 안정적으로 성장해요.', en: 'Higher levels grow best from steady volume.' },
    exercises: ['워밍업 5분', '템포 러닝 25분', '쿨다운 5분'],
  },
]

function getLocalizedText(value, language = 'ko') {
  if (!value || typeof value !== 'object') return value ?? ''
  return value[language] ?? value.ko ?? value.en ?? ''
}

function getLevelNumber(currentLevel, activitySummary) {
  if (typeof currentLevel === 'string') {
    const match = currentLevel.match(/Lv\.?\s*(\d+)|레벨\s*(\d+)/i)
    const parsed = Number(match?.[1] ?? match?.[2])
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  const direct = Number(currentLevel?.level ?? currentLevel?.value)
  if (Number.isFinite(direct) && direct > 0) return direct

  const fromActivity = Number(activitySummary?.levelValue ?? activitySummary?.level)
  if (Number.isFinite(fromActivity) && fromActivity > 0) return fromActivity

  return 1
}

function getWorkoutDate(item) {
  return item?.date ?? item?.loggedDate ?? item?.created_at?.slice(0, 10) ?? null
}

function getWorkoutType(item) {
  return item?.workout_type ?? item?.workoutType ?? ''
}

function getWorkoutDuration(item) {
  return Number(item?.duration_minutes ?? item?.durationMinutes) || 0
}

function getDaysSince(dateValue, today = new Date()) {
  if (!dateValue) return null

  const date = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null

  const todayDate = new Date(today)
  todayDate.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  return Math.round((todayDate.getTime() - date.getTime()) / 86400000)
}

function getRecentHistory(workoutHistory = []) {
  return Array.isArray(workoutHistory) ? workoutHistory.slice(0, 7) : []
}

function getDominantType(stats = {}, workoutHistory = []) {
  const statType = stats.typeCounts?.[0]?.type
  if (statType) return statType

  const counts = getRecentHistory(workoutHistory).reduce((acc, item) => {
    const type = getWorkoutType(item)
    if (type) acc[type] = (acc[type] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? ''
}

function chooseBaseRecommendation(levelValue, dominantType) {
  const base = LEVEL_RECOMMENDATIONS.find((item) => levelValue <= item.maxLevel) ?? LEVEL_RECOMMENDATIONS.at(-1)

  if (levelValue >= 4 && /웨이트|근력|하체|상체/i.test(dominantType)) {
    return LEVEL_RECOMMENDATIONS[3]
  }

  return base
}

function getWeeklyProgressLabel(weeklyCount, weeklyGoal, language) {
  const safeGoal = Math.max(Number(weeklyGoal) || 4, 1)
  const safeCount = Math.min(Number(weeklyCount) || 0, safeGoal)
  return language === 'en'
    ? `This week ${safeCount}/${safeGoal}`
    : `이번 주 ${safeCount}/${safeGoal}`
}

function buildRecoverySignal({ daysSinceLastWorkout, streak, todayDone, language }) {
  if (todayDone) {
    return language === 'en'
      ? 'Recovery-first bonus only'
      : '오늘은 보너스만 가볍게'
  }

  if (daysSinceLastWorkout === 0) {
    return language === 'en'
      ? 'Already trained today'
      : '오늘 운동 기록 있음'
  }

  if (daysSinceLastWorkout === 1) {
    return language === 'en'
      ? 'Recovered enough for a clean push'
      : '회복이 좋아서 깔끔하게 밀어도 좋아요'
  }

  if (daysSinceLastWorkout >= 3) {
    return language === 'en'
      ? 'Ease back in and rebuild rhythm'
      : '무리보다 리듬 회복이 먼저예요'
  }

  if (streak >= 3) {
    return language === 'en'
      ? `Protect the ${streak}-day streak`
      : `${streak}일 스트릭을 지키는 날`
  }

  return language === 'en'
    ? 'Good day to move the weekly goal'
    : '주간 목표를 밀어 올리기 좋은 날'
}

function buildContext({ recommendation, weeklyCount, streak, todayDone, language }) {
  if (todayDone) {
    return {
      label: language === 'en' ? 'Bonus session' : '보너스 운동',
      body: language === 'en'
        ? 'You already logged today, so keep this optional and short.'
        : '오늘 핵심 기록은 끝났어요. 더 한다면 회복을 해치지 않는 보너스로 가요.',
    }
  }

  if (weeklyCount === 0) {
    return {
      label: language === 'en' ? 'First log this week' : '이번 주 첫 기록',
      body: language === 'en'
        ? 'Today works best with a low-barrier session.'
        : '시작 장벽을 낮춘 운동으로 이번 주 리듬을 먼저 만들어요.',
    }
  }

  if (streak >= 3) {
    return {
      label: language === 'en' ? 'Protect the streak' : '스트릭 지키기',
      body: language === 'en'
        ? `A good fit to protect your ${streak}-day streak.`
        : `${streak}일 흐름을 끊지 않도록 짧고 확실하게 가져가요.`,
    }
  }

  return {
    label: language === 'en' ? 'Today recommendation' : '오늘 추천',
    body: getLocalizedText(recommendation.reason, language),
  }
}

function buildProgression({ baseDuration, lastDuration, isPremium, daysSinceLastWorkout, language }) {
  if (!isPremium) {
    return {
      durationMinutes: baseDuration,
      progressionLabel: language === 'en' ? 'Base plan' : '기본 추천',
      overloadPercent: 0,
    }
  }

  if (daysSinceLastWorkout >= 3) {
    return {
      durationMinutes: Math.max(15, Math.round(baseDuration * 0.9)),
      progressionLabel: language === 'en' ? 'Recovery-adjusted' : '회복 우선 조정',
      overloadPercent: -10,
    }
  }

  const targetDuration = lastDuration > 0
    ? Math.round(lastDuration * 1.05)
    : Math.round(baseDuration * 1.05)
  const durationMinutes = Math.max(baseDuration, Math.min(targetDuration, baseDuration + 8))

  return {
    durationMinutes,
    progressionLabel: language === 'en'
      ? 'Progressive overload +5%'
      : '지난 기록 대비 볼륨 +5%',
    overloadPercent: 5,
  }
}

export function getTodayWorkoutRecommendation({
  currentLevel,
  stats = {},
  activitySummary = {},
  todayDone = false,
  workoutHistory = [],
  weeklyGoal = 4,
  isPremium = false,
  language = 'ko',
  isEnglish = false,
  today = new Date(),
} = {}) {
  const resolvedLanguage = language === 'en' || isEnglish ? 'en' : 'ko'
  const levelValue = getLevelNumber(currentLevel, activitySummary)
  const recentHistory = getRecentHistory(workoutHistory)
  const latestWorkout = recentHistory[0] ?? null
  const dominantType = getDominantType(stats, recentHistory)
  const recommendation = chooseBaseRecommendation(levelValue, dominantType)
  const weeklyCount = Number(stats?.weeklyCount) || 0
  const streak = Number(stats?.streak) || Number(activitySummary?.currentStreak) || 0
  const daysSinceLastWorkout = getDaysSince(getWorkoutDate(latestWorkout) ?? stats.lastWorkoutDate, today)
  const lastDuration = getWorkoutDuration(latestWorkout) || Number(stats.lastWorkoutDuration) || 0
  const progression = buildProgression({
    baseDuration: recommendation.durationMinutes,
    lastDuration,
    isPremium,
    daysSinceLastWorkout,
    language: resolvedLanguage,
  })
  const context = buildContext({
    recommendation,
    weeklyCount,
    streak,
    todayDone,
    language: resolvedLanguage,
  })
  const recoverySignal = buildRecoverySignal({
    daysSinceLastWorkout,
    streak,
    todayDone,
    language: resolvedLanguage,
  })
  const durationMinutes = todayDone
    ? Math.max(10, Math.round(progression.durationMinutes * 0.65))
    : progression.durationMinutes
  const title = getLocalizedText(recommendation.title, resolvedLanguage)
  const goalLine = resolvedLanguage === 'en'
    ? `${recommendation.setsLabel} • +${Math.max(10, Math.round(durationMinutes * (levelValue >= 4 ? 1.4 : 1.1)))} XP • ${getWeeklyProgressLabel(weeklyCount, weeklyGoal, resolvedLanguage)}`
    : `${recommendation.setsLabel} • +${Math.max(10, Math.round(durationMinutes * (levelValue >= 4 ? 1.4 : 1.1)))} XP • ${getWeeklyProgressLabel(weeklyCount, weeklyGoal, resolvedLanguage)}`
  const personalizedLine = isPremium
    ? (resolvedLanguage === 'en'
        ? `${progression.progressionLabel}. ${recoverySignal}.`
        : `${progression.progressionLabel}로 잡았어요. ${recoverySignal}.`)
    : (resolvedLanguage === 'en'
        ? `${recoverySignal}. Pro unlocks recovery and overload tuning.`
        : `${recoverySignal}. Pro에서는 회복과 볼륨까지 자동으로 조정해요.`)
  const nextPreview = resolvedLanguage === 'en'
    ? `Next: ${recommendation.workoutType === '웨이트' ? 'mobility and core' : 'strength support'} based on how today feels.`
    : `다음 추천: 오늘 체감에 따라 ${recommendation.workoutType === '웨이트' ? '회복 스트레칭과 코어' : '근력 보강'}으로 이어갈게요.`

  return {
    ...recommendation,
    title,
    headline: todayDone
      ? (resolvedLanguage === 'en' ? 'Today is complete' : '오늘 운동 완료')
      : (resolvedLanguage === 'en' ? `Today: ${recommendation.focus.en}` : `오늘은 ${recommendation.focus.ko} Day`),
    summary: resolvedLanguage === 'en'
      ? `${recommendation.mainExercise} • ${durationMinutes} min expected`
      : `${recommendation.mainExercise} • ${durationMinutes}분 예상`,
    intensityLabel: getLocalizedText(recommendation.intensity, resolvedLanguage),
    focusLabel: getLocalizedText(recommendation.focus, resolvedLanguage),
    label: context.label,
    body: context.body,
    personalization: personalizedLine,
    goalLine,
    levelValue,
    context,
    recoverySignal,
    progressionLabel: progression.progressionLabel,
    overloadPercent: progression.overloadPercent,
    weeklyProgressLabel: getWeeklyProgressLabel(weeklyCount, weeklyGoal, resolvedLanguage),
    durationMinutes,
    estimatedXp: Math.max(10, Math.round(durationMinutes * (levelValue >= 4 ? 1.4 : 1.1))),
    exercises: recommendation.exercises,
    nextPreview,
    isPremiumRecommendation: Boolean(isPremium),
    note: [
      title,
      personalizedLine,
      goalLine,
    ].filter(Boolean).join('\n'),
    sharePayload: {
      title: resolvedLanguage === 'en' ? 'Today workout complete' : '오늘 운동 완료',
      metric: resolvedLanguage === 'en'
        ? `${recommendation.mainExercise} • ${durationMinutes} min`
        : `${recommendation.mainExercise} • ${durationMinutes}분`,
      detail: personalizedLine,
      planSummary: goalLine,
      level: `Lv.${levelValue}`,
      xp: `${Math.max(10, Math.round(durationMinutes * (levelValue >= 4 ? 1.4 : 1.1)))} XP`,
      streak: resolvedLanguage === 'en' ? `${streak} days` : `${streak}일 스트릭`,
      accent: '#10b981',
    },
  }
}
