import { useMemo, useState } from 'react'
import { useI18n } from '../i18n.js'
import { shareToKakao } from '../utils/kakaoShare'
import { PREMIUM_CONTEXT } from '../utils/premium'

function StatBadge({ label, value, tone = 'dark' }) {
  const toneClass = tone === 'emerald'
    ? 'border-emerald-300/40 bg-emerald-300 text-emerald-950'
    : 'border-white/15 bg-white/10 text-white'

  return (
    <span className={`inline-flex min-h-11 items-center rounded-2xl border px-3 text-xs font-black ${toneClass}`}>
      <span className="mr-2 text-gray-100">{label}</span>
      {value}
    </span>
  )
}

function ExercisePill({ children }) {
  return (
    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-800 shadow-sm dark:bg-white/10 dark:text-gray-100">
      {children}
    </span>
  )
}

export default function TodayWorkoutRecommendationCard({
  recommendation,
  completed = false,
  celebration = null,
  isPro = false,
  loading = false,
  profile,
  activitySummary,
  weeklyCount = 0,
  weeklyGoal = 4,
  onComplete,
  onCustomize,
  onOpenPaywall,
  onSeeCommunity,
}) {
  const { isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const [shareBusy, setShareBusy] = useState(false)
  const [showNextPreview, setShowNextPreview] = useState(false)
  const streak = Number(activitySummary?.currentStreak) || 0
  const todayXp = Number(activitySummary?.todayXp) || Number(celebration?.gainedXp) || 0
  const levelValue = Number(activitySummary?.levelValue) || recommendation.levelValue || 1
  const weeklyLabel = useMemo(
    () => `${Math.min(Number(weeklyCount) || 0, Number(weeklyGoal) || 4)}/${Number(weeklyGoal) || 4}`,
    [weeklyCount, weeklyGoal],
  )

  const sharePayload = {
    ...recommendation.sharePayload,
    title: completed
      ? t('오늘 운동 완료', 'Workout complete today')
      : t('오늘의 추천 운동', 'Today workout recommendation'),
    metric: recommendation.summary,
    detail: completed
      ? t('오늘도 성장 루프를 채웠어요.', 'The daily growth loop is complete.')
      : recommendation.personalization,
    planSummary: recommendation.goalLine,
    xp: todayXp > 0 ? `${todayXp} XP` : `+${recommendation.estimatedXp} XP`,
    streak: t(`${streak}일 스트릭`, `${streak}-day streak`),
    level: `Lv.${levelValue}`,
    name: profile?.display_name || 'Gym Community',
    accent: isPro ? '#34d399' : '#10b981',
  }

  const handleShare = async () => {
    setShareBusy(true)

    try {
      await shareToKakao({
        isPremium: isPro,
        isEnglish,
        contentType: completed ? 'today_workout_complete' : 'today_workout_recommendation',
        filename: 'gym-community-today-workout.png',
        payload: sharePayload,
      })
    } finally {
      setShareBusy(false)
    }
  }

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-gray-950 p-5 text-white shadow-sm sm:p-6 ${
        celebration ? 'motion-safe:animate-[pulse_1.8s_ease-in-out_1]' : ''
      }`}
      aria-label={t('오늘의 운동 추천 카드', 'Today workout recommendation card')}
      data-testid="today-workout-card"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400" aria-hidden="true" />
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-6">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-black uppercase text-emerald-950">
              {completed ? t('완료됨', 'Done') : recommendation.label}
            </span>
            {isPro ? (
              <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase text-emerald-100">
                Pro Coach
              </span>
            ) : (
              <button
                type="button"
                className="min-h-9 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-black text-gray-100 transition hover:bg-white/15"
                onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.AI_PLAN)}
              >
                {t('Pro 정밀 추천 보기', 'Unlock Pro tuning')}
              </button>
            )}
          </div>

          <div className="grid gap-2">
            <h2 className="m-0 text-3xl font-black leading-tight text-white sm:text-4xl">
              {completed ? t('축하해요! 오늘도 성장했어요', 'Nice work. You grew today.') : recommendation.headline}
            </h2>
            <p className="m-0 text-lg font-black leading-7 text-emerald-100">
              {recommendation.summary}
            </p>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-100 sm:text-base">
              {completed
                ? t('XP, 스트릭, 주간 목표가 바로 반영됐어요. 이제 자랑하거나 다음 루프를 미리 볼 차례예요.', 'XP, streak, and weekly progress are updated. Now share it or preview the next move.')
                : recommendation.personalization}
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {recommendation.exercises?.map((item) => (
              <ExercisePill key={item}>{item}</ExercisePill>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <StatBadge label={t('목표', 'Goal')} value={recommendation.goalLine} tone="emerald" />
            <StatBadge label="XP" value={todayXp > 0 ? `+${todayXp}` : `+${recommendation.estimatedXp}`} />
            <StatBadge label={t('주간', 'Week')} value={weeklyLabel} />
          </div>
        </div>

        {completed ? (
          <div className="grid gap-4 rounded-3xl border border-emerald-300/30 bg-emerald-300/10 p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 text-gray-950">
                <span className="block text-xs font-black uppercase text-emerald-800">XP</span>
                <strong className="mt-1 block text-2xl font-black">{todayXp > 0 ? `+${todayXp}` : `+${recommendation.estimatedXp}`}</strong>
              </div>
              <div className="rounded-2xl bg-white p-4 text-gray-950">
                <span className="block text-xs font-black uppercase text-emerald-800">{t('스트릭', 'Streak')}</span>
                <strong className="mt-1 block text-2xl font-black">{t(`${Math.max(streak, 1)}일`, `${Math.max(streak, 1)}d`)}</strong>
              </div>
              <div className="rounded-2xl bg-white p-4 text-gray-950">
                <span className="block text-xs font-black uppercase text-emerald-800">{t('레벨', 'Level')}</span>
                <strong className="mt-1 block text-2xl font-black">{`Lv.${levelValue}`}</strong>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                className="min-h-12 rounded-lg bg-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleShare}
                disabled={shareBusy}
              >
                {shareBusy ? t('공유 준비 중', 'Preparing share') : isPro ? t('Pro 카드 공유', 'Share Pro card') : t('카카오 공유', 'Share to Kakao')}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-lg bg-white px-4 text-sm font-black text-gray-950 shadow-sm transition hover:bg-emerald-50"
                onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.ANALYTICS)}
              >
                {isPro ? t('Pro 분석 보기', 'View Pro analytics') : t('Pro 분석 열기', 'Unlock Pro analytics')}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15"
                onClick={() => setShowNextPreview((value) => !value)}
              >
                {t('다음 추천 미리보기', 'Preview next')}
              </button>
            </div>

            {showNextPreview ? (
              <p className="m-0 rounded-2xl bg-gray-950/50 p-4 text-sm font-semibold leading-6 text-gray-100">
                {recommendation.nextPreview}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              className="min-h-14 rounded-lg bg-emerald-300 px-5 text-base font-black text-emerald-950 shadow-sm transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onComplete?.(recommendation)}
              disabled={loading}
              data-testid="home-complete-recommendation"
            >
              {loading ? t('완료 처리 중', 'Completing...') : t('오늘 운동 완료하기', 'Complete today workout')}
            </button>
            <button
              type="button"
              className="min-h-14 rounded-lg border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
              onClick={() => onCustomize?.(recommendation)}
              disabled={loading}
            >
              {t('세부 기록 수정', 'Edit details')}
            </button>
          </div>
        )}

        {!isPro && (
          <div className="relative rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="m-0 text-sm font-semibold leading-6 text-gray-100">
              {t(
                'Free는 기본 추천을 바로 시작할 수 있어요. Pro는 회복 상태, 최근 볼륨, 다음 주 목표까지 반영해서 강도를 자동 조정합니다.',
                'Free gives you a clear starter plan. Pro tunes intensity with recovery, recent volume, and next-week goals.',
              )}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-white/10 px-4 text-sm font-black text-gray-100 transition hover:bg-white/15"
            onClick={onSeeCommunity}
          >
            {t('커뮤니티 동기부여 보기', 'See community momentum')}
          </button>
          {!isPro && completed ? (
            <button
              type="button"
              className="min-h-11 rounded-lg bg-emerald-300 px-4 text-sm font-black text-emerald-950 transition hover:bg-emerald-200"
              onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.SHARE_CARDS)}
            >
              {t('Pro 이미지 카드 만들기', 'Create Pro image card')}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
