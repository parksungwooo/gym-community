const LEVEL_RECOMMENDATIONS = [
  {
    maxLevel: 1,
    workoutType: '걷기',
    durationMinutes: 15,
    intensity: { ko: '가볍게', en: 'Light' },
    title: { ko: '가벼운 걷기 15분', en: '15-min easy walk' },
    reason: { ko: '몸을 깨우는 정도면 충분해요.', en: 'A small start is enough to build rhythm.' },
  },
  {
    maxLevel: 2,
    workoutType: '러닝',
    durationMinutes: 20,
    intensity: { ko: '편하게', en: 'Easy pace' },
    title: { ko: '편한 러닝 20분', en: '20-min easy run' },
    reason: { ko: '숨이 조금 차는 정도로 리듬을 만들어요.', en: 'A low-friction cardio block that keeps progress moving.' },
  },
  {
    maxLevel: 3,
    workoutType: '웨이트',
    durationMinutes: 25,
    intensity: { ko: '탄탄하게', en: 'Moderate' },
    title: { ko: '전신 근력 25분', en: '25-min full-body strength' },
    reason: { ko: '큰 근육부터 깨우면 XP도 잘 쌓여요.', en: 'A balanced strength block for XP and consistency.' },
  },
  {
    maxLevel: 5,
    workoutType: 'HIIT',
    durationMinutes: 18,
    intensity: { ko: '짧고 강하게', en: 'Short and sharp' },
    title: { ko: 'HIIT 18분', en: '18-min HIIT' },
    reason: { ko: '짧게 몰입해서 주간 목표를 빠르게 밀어봐요.', en: 'A focused session that moves the weekly goal fast.' },
  },
  {
    maxLevel: 10,
    workoutType: '러닝',
    durationMinutes: 35,
    intensity: { ko: '꾸준하게', en: 'Steady pace' },
    title: { ko: '템포 러닝 35분', en: '35-min tempo run' },
    reason: { ko: '상위 레벨은 꾸준한 볼륨이 성장을 만듭니다.', en: 'Higher levels grow best from steady volume.' },
  },
]

function getLevelNumber(currentLevel, activitySummary) {
  const direct = Number(currentLevel?.level)
  if (Number.isFinite(direct) && direct > 0) return direct

  const fromActivity = Number(activitySummary?.level)
  if (Number.isFinite(fromActivity) && fromActivity > 0) return fromActivity

  return 1
}

function getLocalizedText(value, language = 'ko') {
  if (!value || typeof value !== 'object') return value ?? ''
  return value[language] ?? value.ko ?? value.en ?? ''
}

export function getTodayWorkoutRecommendation({
  currentLevel,
  stats = {},
  activitySummary = {},
  todayDone = false,
  language = 'ko',
  isEnglish = false,
} = {}) {
  const resolvedLanguage = language === 'en' || isEnglish ? 'en' : 'ko'
  const levelValue = getLevelNumber(currentLevel, activitySummary)
  const recommendation = LEVEL_RECOMMENDATIONS.find((item) => levelValue <= item.maxLevel) ?? LEVEL_RECOMMENDATIONS.at(-1)
  const weeklyCount = Number(stats?.weeklyCount) || 0
  const streak = Number(stats?.streak) || Number(activitySummary?.currentStreak) || 0

  const context = todayDone
    ? {
        label: { ko: '보너스 운동', en: 'Bonus session' },
        body: { ko: '이미 기록했어요. 더 하고 싶다면 짧게만 가도 충분해요.', en: 'You already logged today, so keep this optional and short.' },
      }
    : weeklyCount === 0
      ? {
          label: { ko: '이번 주 첫 기록', en: 'First log this week' },
          body: { ko: '시작이 쉬운 운동으로 리듬부터 만들어요.', en: 'Today works best with a low-barrier session.' },
        }
      : streak >= 3
        ? {
            label: { ko: '연속 기록 지키기', en: 'Protect the streak' },
            body: { ko: `${streak}일 흐름, 오늘도 가볍게 이어가요.`, en: `A good fit to protect your ${streak}-day streak.` },
          }
        : {
            label: { ko: '오늘 추천', en: 'Today recommendation' },
            body: { ko: recommendation.reason.ko, en: recommendation.reason.en },
          }

  return {
    ...recommendation,
    title: getLocalizedText(recommendation.title, resolvedLanguage),
    intensityLabel: getLocalizedText(recommendation.intensity, resolvedLanguage),
    label: getLocalizedText(context.label, resolvedLanguage),
    body: getLocalizedText(context.body, resolvedLanguage),
    levelValue,
    context,
    estimatedXp: Math.max(10, Math.round(recommendation.durationMinutes * (levelValue >= 4 ? 1.4 : 1.1))),
  }
}
