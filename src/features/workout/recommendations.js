const LEVEL_RECOMMENDATIONS = [
  {
    maxLevel: 1,
    workoutType: '걷기',
    durationMinutes: 15,
    intensity: { ko: '가볍게', en: 'Light' },
    title: { ko: '회복 걷기 15분', en: '15-min recovery walk' },
    reason: { ko: '처음엔 리듬을 만드는 것이 가장 중요해요.', en: 'The first win is building a repeatable rhythm.' },
  },
  {
    maxLevel: 2,
    workoutType: '러닝',
    durationMinutes: 20,
    intensity: { ko: '편안한 호흡', en: 'Easy pace' },
    title: { ko: '이지 러닝 20분', en: '20-min easy run' },
    reason: { ko: '레벨을 올리기 좋은 저부담 유산소예요.', en: 'A low-friction cardio block that keeps progress moving.' },
  },
  {
    maxLevel: 3,
    workoutType: '웨이트',
    durationMinutes: 25,
    intensity: { ko: '중간 강도', en: 'Moderate' },
    title: { ko: '전신 근력 25분', en: '25-min full-body strength' },
    reason: { ko: '근력과 XP를 동시에 챙기기 좋은 구간이에요.', en: 'A balanced strength block for XP and consistency.' },
  },
  {
    maxLevel: 5,
    workoutType: 'HIIT',
    durationMinutes: 18,
    intensity: { ko: '짧고 강하게', en: 'Short and sharp' },
    title: { ko: 'HIIT 18분', en: '18-min HIIT' },
    reason: { ko: '집중도 높은 세션으로 주간 목표를 빠르게 당겨요.', en: 'A focused session that moves the weekly goal fast.' },
  },
  {
    maxLevel: 10,
    workoutType: '러닝',
    durationMinutes: 35,
    intensity: { ko: '페이스 유지', en: 'Steady pace' },
    title: { ko: '템포 러닝 35분', en: '35-min tempo run' },
    reason: { ko: '상위 레벨은 꾸준한 볼륨이 성장 곡선을 만들어요.', en: 'Higher levels grow best from steady volume.' },
  },
]

function getLevelNumber(currentLevel, activitySummary) {
  const fromText = Number(String(currentLevel ?? '').match(/Lv(\d+)/)?.[1])
  if (Number.isFinite(fromText) && fromText > 0) return fromText

  const fromActivity = Number(activitySummary?.levelValue)
  return Number.isFinite(fromActivity) && fromActivity > 0 ? fromActivity : 1
}

export function getTodayWorkoutRecommendation({
  currentLevel,
  activitySummary,
  stats,
  todayDone,
  isEnglish,
} = {}) {
  const levelValue = getLevelNumber(currentLevel, activitySummary)
  const recommendation = LEVEL_RECOMMENDATIONS.find((item) => levelValue <= item.maxLevel) ?? LEVEL_RECOMMENDATIONS.at(-1)
  const weeklyCount = Number(stats?.weeklyCount) || 0
  const streak = Number(stats?.streak) || Number(activitySummary?.currentStreak) || 0

  const context = todayDone
    ? {
        label: { ko: '보너스 세션', en: 'Bonus session' },
        body: { ko: '이미 기록했으니 짧게만 더해도 충분해요.', en: 'You already logged today, so keep this optional and short.' },
      }
    : weeklyCount === 0
      ? {
          label: { ko: '이번 주 첫 기록', en: 'First log this week' },
          body: { ko: '오늘은 시작 장벽이 낮은 세션이 좋아요.', en: 'Today works best with a low-barrier session.' },
        }
      : streak >= 3
        ? {
            label: { ko: '스트릭 유지', en: 'Protect the streak' },
            body: { ko: `${streak}일 흐름을 이어갈 수 있는 추천이에요.`, en: `A good fit to protect your ${streak}-day streak.` },
          }
        : {
            label: { ko: '오늘의 추천', en: 'Today recommendation' },
            body: { ko: recommendation.reason.ko, en: recommendation.reason.en },
          }

  return {
    ...recommendation,
    label: context.label[isEnglish ? 'en' : 'ko'],
    title: recommendation.title[isEnglish ? 'en' : 'ko'],
    intensityLabel: recommendation.intensity[isEnglish ? 'en' : 'ko'],
    body: context.body[isEnglish ? 'en' : 'ko'],
    estimatedXp: Math.max(12, Math.round(recommendation.durationMinutes * 0.8)),
  }
}
