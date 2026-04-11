import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n.js'
import { shareToKakao } from '../utils/kakaoShare'
import { PREMIUM_CONTEXT } from '../utils/premium'

function StatBadge({ label, value, tone = 'dark' }) {
  const toneClass = tone === 'emerald'
    ? 'border-emerald-300 bg-emerald-300 text-emerald-950'
    : 'border-white/15 bg-white/10 text-white'

  return (
    <span className={`inline-flex min-h-11 items-center rounded-2xl border px-3 text-xs font-black ${toneClass}`}>
      <span className={tone === 'emerald' ? 'mr-2 text-emerald-900' : 'mr-2 text-gray-100'}>{label}</span>
      {value}
    </span>
  )
}

function ExercisePill({ children }) {
  return (
    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-800 shadow-sm">
      {children}
    </span>
  )
}

function getLevelTitle(levelValue) {
  if (levelValue >= 10) return 'Legend Beast'
  if (levelValue >= 8) return 'Iron Beast'
  if (levelValue >= 6) return 'Power Builder'
  if (levelValue >= 4) return 'Streak Rider'
  return 'Starter Beast'
}

function SuccessModal({
  open,
  isEnglish,
  gainedXp,
  streak,
  levelValue,
  levelTitle,
  remainingXp,
  leveledUp,
  weeklyLabel,
  onClose,
  onShare,
  onOpenAnalytics,
  shareBusy,
  isPro,
}) {
  if (!open) return null

  const t = (ko, en) => (isEnglish ? en : ko)

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6">
      <section className="grid w-full max-w-md gap-5 rounded-3xl border border-emerald-200 bg-white p-5 text-gray-950 shadow-2xl dark:border-emerald-400/30 dark:bg-neutral-900 dark:text-white sm:p-6">
        <div className="grid gap-2 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-700 text-lg font-black leading-none text-white shadow-lg shadow-emerald-700/20 motion-safe:animate-bounce">
            Lv.{levelValue}
          </span>
          <h2 className="m-0 text-3xl font-black leading-tight text-gray-950 dark:text-white">
            {leveledUp
              ? t(`Lv.${levelValue} ${levelTitle} 달성!`, `Lv.${levelValue} ${levelTitle} reached!`)
              : t('오늘도 XP 쌓였어요', 'XP added today')}
          </h2>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {leveledUp
              ? t('방금 한 단계 올라섰어요. 이 맛에 계속합니다.', 'You just moved up. This is the loop.')
              : t(`다음 레벨까지 ${remainingXp} XP 남았어요.`, `${remainingXp} XP to the next level.`)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-700/20">
            <span className="block text-xs font-black text-emerald-800 dark:text-emerald-200">XP</span>
            <strong className="mt-1 block text-2xl font-black text-gray-950 dark:text-white">{`+${gainedXp}`}</strong>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 text-center dark:bg-white/10">
            <span className="block text-xs font-black text-gray-700 dark:text-gray-200">{t('스트릭', 'Streak')}</span>
            <strong className="mt-1 block text-2xl font-black text-gray-950 dark:text-white">
              {t(`${Math.max(streak, 1)}일`, `${Math.max(streak, 1)}d`)}
            </strong>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 text-center dark:bg-white/10">
            <span className="block text-xs font-black text-gray-700 dark:text-gray-200">{t('이번 주', 'Week')}</span>
            <strong className="mt-1 block text-2xl font-black text-gray-950 dark:text-white">{weeklyLabel}</strong>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
            onClick={onShare}
            disabled={shareBusy}
          >
            {shareBusy ? t('공유 준비 중', 'Preparing') : isPro ? t('Pro 카드 공유', 'Share Pro card') : t('카톡 공유', 'Share')}
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onOpenAnalytics}
          >
            {isPro ? t('분석 보기', 'View analytics') : t('Pro 분석 보기', 'Pro analytics')}
          </button>
        </div>

        <button
          type="button"
          className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
          onClick={onClose}
        >
          {t('닫기', 'Close')}
        </button>
      </section>
    </div>
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
  const [modalDismissed, setModalDismissed] = useState(false)
  const streak = Number(activitySummary?.currentStreak) || 0
  const celebrationXp = Math.max(0, Number(celebration?.gainedXp) || 0)
  const todayXp = Number(activitySummary?.todayXp) || 0
  const levelValue = Number(celebration?.levelValue) || Number(activitySummary?.levelValue) || recommendation.levelValue || 1
  const levelTitle = getLevelTitle(levelValue)
  const remainingXp = Math.max(0, Number(celebration?.remainingXp ?? activitySummary?.remainingXp) || 0)
  const leveledUp = Boolean(celebration?.leveledUp)
  const earnedXp = celebration ? (celebrationXp || recommendation.estimatedXp) : (todayXp > 0 ? todayXp : recommendation.estimatedXp)
  const weeklyLabel = useMemo(
    () => `${Math.min(Number(celebration?.nextWeeklyCount ?? weeklyCount) || 0, Number(weeklyGoal) || 4)}/${Number(weeklyGoal) || 4}`,
    [celebration?.nextWeeklyCount, weeklyCount, weeklyGoal],
  )

  useEffect(() => {
    setModalDismissed(false)
  }, [celebration])

  const sharePayload = {
    ...recommendation.sharePayload,
    title: completed ? t('오늘 완료', 'Workout complete') : t('오늘 추천', 'Today workout'),
    metric: recommendation.summary,
    detail: completed ? t('오늘도 해냈어요.', 'Daily loop complete.') : recommendation.personalization,
    planSummary: recommendation.goalLine,
    xp: `+${earnedXp} XP`,
    streak: t(`${Math.max(streak, 1)}일 스트릭`, `${Math.max(streak, 1)}-day streak`),
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
      className="relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-gray-950 p-5 text-white shadow-sm sm:p-6"
      aria-label={t('오늘의 운동 추천 카드', 'Today workout recommendation card')}
      data-testid="today-workout-card"
    >
      <SuccessModal
        open={Boolean(celebration) && !modalDismissed}
        isEnglish={isEnglish}
        gainedXp={earnedXp}
        streak={streak}
        levelValue={levelValue}
        levelTitle={levelTitle}
        remainingXp={remainingXp}
        leveledUp={leveledUp}
        weeklyLabel={weeklyLabel}
        onClose={() => setModalDismissed(true)}
        onShare={handleShare}
        onOpenAnalytics={() => onOpenPaywall?.(PREMIUM_CONTEXT.ANALYTICS)}
        shareBusy={shareBusy}
        isPro={isPro}
      />

      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400" aria-hidden="true" />
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-6">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-black uppercase text-emerald-950">
              {completed ? t('완료', 'Done') : recommendation.label}
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
                {t('Pro 코치 보기', 'Unlock Pro tuning')}
              </button>
            )}
          </div>

          <div className="grid gap-2">
            <h2 className="m-0 text-3xl font-black leading-tight text-white sm:text-4xl">
              {completed ? t('오늘 운동 완료', 'Today is complete') : recommendation.headline}
            </h2>
            <p className="m-0 text-xl font-black leading-7 text-emerald-100">
              {recommendation.summary}
            </p>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-100 sm:text-base">
              {completed ? t('좋아요. XP와 스트릭이 반영됐어요.', 'XP and streak are updated.') : recommendation.personalization}
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
            <StatBadge label="XP" value={`+${earnedXp}`} />
            <StatBadge label={t('이번 주', 'Week')} value={weeklyLabel} />
          </div>
        </div>

        {completed ? (
          <div className="grid gap-4 rounded-3xl border border-emerald-300/30 bg-emerald-300/10 p-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white p-4 text-center text-gray-950">
                <span className="block text-xs font-black uppercase text-emerald-800">XP</span>
                <strong className="mt-1 block text-2xl font-black">{`+${earnedXp}`}</strong>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center text-gray-950">
                <span className="block text-xs font-black uppercase text-emerald-800">{t('스트릭', 'Streak')}</span>
                <strong className="mt-1 block text-2xl font-black">{t(`${Math.max(streak, 1)}일`, `${Math.max(streak, 1)}d`)}</strong>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center text-gray-950">
                <span className="block text-xs font-black uppercase text-emerald-800">{t('이번 주', 'Week')}</span>
                <strong className="mt-1 block text-2xl font-black">{weeklyLabel}</strong>
              </div>
            </div>

            <div className="grid gap-1 rounded-2xl bg-gray-950/50 p-4">
              <span className="text-xs font-black uppercase text-emerald-200">Level moment</span>
              <strong className="text-lg font-black text-white">
                {leveledUp
                  ? t(`Lv.${levelValue} ${levelTitle} 달성!`, `Lv.${levelValue} ${levelTitle} reached!`)
                  : t(`Lv.${levelValue} 진행 중`, `Lv.${levelValue} in progress`)}
              </strong>
              <p className="m-0 text-sm font-semibold leading-6 text-gray-100">
                {leveledUp
                  ? t('지금 성장한 순간을 공유하기 딱 좋아요.', 'This is a perfect moment to share.')
                  : t(`다음 레벨까지 ${remainingXp} XP만 더 가요.`, `${remainingXp} XP to the next level.`)}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="min-h-12 rounded-lg bg-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-200 disabled:opacity-60"
                onClick={handleShare}
                disabled={shareBusy}
              >
                {shareBusy ? t('공유 준비 중', 'Preparing') : isPro ? t('Pro 카드 공유', 'Share Pro card') : t('카톡 공유', 'Share to Kakao')}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-lg bg-white px-4 text-sm font-black text-gray-950 shadow-sm transition hover:bg-emerald-50"
                onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.ANALYTICS)}
              >
                {isPro ? t('분석 보기', 'View analytics') : t('Pro 분석 보기', 'Pro analytics')}
              </button>
            </div>

            <button
              type="button"
              className="min-h-11 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15"
              onClick={() => setShowNextPreview((value) => !value)}
            >
              {t('다음 추천 살짝 보기', 'Preview next')}
            </button>

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
              {loading ? t('완료 중', 'Completing...') : t('오늘 운동 완료하기', 'Complete today workout')}
            </button>
            <button
              type="button"
              className="min-h-14 rounded-lg border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"
              onClick={() => onCustomize?.(recommendation)}
              disabled={loading}
            >
              {t('수정해서 기록', 'Edit details')}
            </button>
          </div>
        )}

        {!isPro && !completed ? (
          <p className="m-0 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold leading-6 text-gray-100">
            {t('Free는 바로 시작, Pro는 회복과 볼륨까지 맞춰줘요.', 'Free gives a clear start. Pro tunes recovery and volume.')}
          </p>
        ) : null}

        <button
          type="button"
          className="min-h-11 justify-self-start rounded-lg bg-white/10 px-4 text-sm font-black text-gray-100 transition hover:bg-white/15"
          onClick={onSeeCommunity}
        >
          {t('피드에서 힘 받기', 'See community momentum')}
        </button>
      </div>
    </section>
  )
}
