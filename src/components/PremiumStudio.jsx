import { useMemo, useState } from 'react'
import { useI18n } from '../i18n.js'
import { PREMIUM_CONTEXT } from '../utils/premium'
import {
  buildAdvancedAnalytics,
  buildAiTrainingPlan,
  buildPremiumSharePayload,
} from '../utils/premiumInsights'
import { shareOrDownloadCard } from '../utils/shareCard'

function FeatureGateCard({ eyebrow, title, body, actionLabel, onClick }) {
  return (
    <article className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
      <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{eyebrow}</span>
      <strong className="text-lg font-black leading-6 text-gray-950 dark:text-white">{title}</strong>
      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{body}</p>
      <button
        type="button"
        className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
        onClick={onClick}
      >
        {actionLabel}
      </button>
    </article>
  )
}

function StatCard({ label, value, detail }) {
  return (
    <article className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
      <span className="block text-xs font-black uppercase text-gray-700 dark:text-gray-200">{label}</span>
      <strong className="mt-1 block text-2xl font-black leading-tight text-gray-950 dark:text-white">{value}</strong>
      <span className="mt-1 block text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{detail}</span>
    </article>
  )
}

function MiniBarChart({ items, unit = '' }) {
  const maxValue = Math.max(...items.map((item) => Number(item.minutes ?? item.value) || 0), 1)

  return (
    <div className="grid grid-cols-7 items-end gap-2 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
      {items.map((item) => {
        const value = Number(item.minutes ?? item.value) || 0
        const height = Math.max((value / maxValue) * 100, value > 0 ? 16 : 8)

        return (
          <div key={item.label} className="grid gap-2 text-center">
            <div className="flex h-28 items-end rounded-xl bg-white p-1 dark:bg-neutral-950">
              <span className="w-full rounded-lg bg-emerald-700" style={{ height: `${height}%` }} />
            </div>
            <strong className="text-xs font-black text-gray-950 dark:text-white">{value}{unit}</strong>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function PlanDayCard({ item, durationLabel }) {
  return (
    <article className="grid gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-black text-white">{item.day}</span>
        <span className="text-xs font-black text-gray-700 dark:text-gray-200">{durationLabel(item.duration)}</span>
      </div>
      <strong className="text-base font-black leading-6 text-gray-950 dark:text-white">{item.focus}</strong>
      <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">{item.intensity}</span>
      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{item.note}</p>
    </article>
  )
}

export default function PremiumStudio({
  isPro,
  onOpenPaywall,
  profile,
  latestResult,
  workoutStats,
  workoutHistory,
  weeklyGoal,
  activitySummary,
  bodyMetrics,
  recentActivityEvents,
}) {
  const { isEnglish, language } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const [shareBusy, setShareBusy] = useState(false)
  const plan = useMemo(
    () => buildAiTrainingPlan({
      latestResult,
      workoutHistory,
      workoutStats,
      weeklyGoal,
      profile,
      activitySummary,
      bodyMetrics,
      language,
      isEnglish,
    }),
    [activitySummary, bodyMetrics, isEnglish, language, latestResult, profile, weeklyGoal, workoutHistory, workoutStats],
  )
  const analytics = useMemo(
    () => buildAdvancedAnalytics({
      latestResult,
      workoutHistory,
      workoutStats,
      weeklyGoal,
      activitySummary,
      bodyMetrics,
      recentActivityEvents,
      language,
      isEnglish,
    }),
    [activitySummary, bodyMetrics, isEnglish, language, latestResult, recentActivityEvents, weeklyGoal, workoutHistory, workoutStats],
  )

  const openContext = (context) => {
    onOpenPaywall?.(context)
  }

  const handleSharePremiumCard = async () => {
    setShareBusy(true)
    try {
      await shareOrDownloadCard(
        buildPremiumSharePayload({
          profile,
          latestResult,
          workoutStats,
          activitySummary,
          bodyMetrics,
          language,
          isEnglish,
        }),
        'gym-community-pro-progress-card.svg',
      )
    } finally {
      setShareBusy(false)
    }
  }

  if (!isPro) {
    const lockedFeatures = [
      {
        context: PREMIUM_CONTEXT.AI_PLAN,
        eyebrow: t('AI 플랜', 'AI Plan'),
        title: t('이번 주 운동을 자동으로 짜드릴게요', 'Your week planned automatically'),
        body: t(
          '테스트 결과, 최근 기록, 목표를 분석해서 강도와 회복까지 반영한 플랜을 만듭니다.',
          'Uses your test result, recent logs, and goals to balance overload and recovery.',
        ),
      },
      {
        context: PREMIUM_CONTEXT.ANALYTICS,
        eyebrow: t('고급 분석', 'Advanced Analytics'),
        title: t('숫자가 아니라 방향을 보여줘요', 'See direction, not just numbers'),
        body: t(
          '볼륨 변화, 1RM 예측, 회복 점수, XP 추이를 한 화면에서 읽을 수 있어요.',
          'Read volume change, 1RM estimate, recovery score, and XP trend in one place.',
        ),
      },
      {
        context: PREMIUM_CONTEXT.SHARE_CARDS,
        eyebrow: t('공유 카드', 'Share Cards'),
        title: t('자랑하고 싶은 기록 카드', 'Progress cards worth sharing'),
        body: t(
          '인스타/카톡에 올리기 좋은 프리미엄 성장 카드를 자동으로 생성합니다.',
          'Create premium progress cards for Instagram, KakaoTalk, or your group chat.',
        ),
      },
      {
        context: PREMIUM_CONTEXT.PRO_COMMUNITY,
        eyebrow: t('Pro 클럽', 'Pro Club'),
        title: t('Pro 배지와 전용 챌린지', 'Pro badge and private challenges'),
        body: t(
          '전용 리더보드, 비공개 소모임, 광고 없는 피드로 더 진한 커뮤니티를 만듭니다.',
          'Unlock Pro leaderboards, private circles, and an ad-free feed.',
        ),
      },
    ]

    return (
      <section className="grid gap-5 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/20 dark:bg-neutral-900 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="grid gap-2">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">Pro Studio</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {t('운동 기록을 개인 코치로 바꾸세요', 'Turn your logs into a personal coach')}
            </h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">
              {t(
                '무료는 기록하기에 충분합니다. Pro는 다음 운동, 회복, 성장 방향까지 대신 정리해줍니다.',
                'Free is enough to log. Pro tells you what to do next, when to recover, and how you are improving.',
              )}
            </p>
          </div>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
            onClick={() => openContext(PREMIUM_CONTEXT.AI_PLAN)}
          >
            {t('Pro로 AI 플랜 열기', 'Unlock AI plan')}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {lockedFeatures.map((item) => (
            <FeatureGateCard
              key={item.context}
              eyebrow={item.eyebrow}
              title={item.title}
              body={item.body}
              actionLabel={t('자세히 보기', 'See benefits')}
              onClick={() => openContext(item.context)}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="grid gap-6" data-testid="premium-studio">
      <section className="grid gap-5 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/20 dark:bg-neutral-900 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="grid gap-2">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">Pro Studio</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{plan.title}</h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">{plan.subtitle}</p>
          </div>
          <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">
            {t(`분석 신뢰도 ${plan.confidence}%`, `${plan.confidence}% confidence`)}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label={t('주간 목표', 'Weekly target')} value={plan.weeklyTarget} detail={plan.primaryType} />
          <StatCard label={t('강도', 'Intensity')} value={plan.intensity} detail={plan.recoverySignal} />
          <StatCard
            label={t('점진 과부하', 'Progressive overload')}
            value={plan.overloadPercent ? `+${plan.overloadPercent}%` : t('유지', 'Hold')}
            detail={plan.overloadPercent ? t('다음 핵심 운동에만 적용', 'Apply only to the next key session') : t('먼저 완료율을 올려요', 'Raise completion first')}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plan.weekPlan.map((item) => (
            <PlanDayCard
              key={`${item.day}-${item.focus}`}
              item={item}
              durationLabel={(duration) => t(`${duration}분`, `${duration} min`)}
            />
          ))}
        </div>

        <div className="grid gap-2 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
          <strong className="text-base font-black text-gray-950 dark:text-white">{t('월간 플랜', 'Monthly plan')}</strong>
          <div className="grid gap-2">
            {plan.monthlyBlocks.map((item, index) => (
              <span key={item} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-gray-800 shadow-sm dark:bg-neutral-950 dark:text-gray-100">
                {index + 1}. {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="grid gap-1">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('고급 분석', 'Advanced Analytics')}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {t('볼륨, 회복, XP를 한 번에 읽기', 'Read volume, recovery, and XP together')}
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {analytics.cards.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} detail={item.detail} />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <strong className="text-base font-black text-gray-950 dark:text-white">{t('이번 주 운동 시간', 'Training minutes this week')}</strong>
            <MiniBarChart items={analytics.chartBuckets} />
          </div>
          <div className="grid gap-2">
            <strong className="text-base font-black text-gray-950 dark:text-white">{t('최근 XP 흐름', 'Recent XP trend')}</strong>
            <MiniBarChart items={analytics.xpTrend.length ? analytics.xpTrend : [{ label: '1', value: 0 }, { label: '2', value: 0 }, { label: '3', value: 0 }, { label: '4', value: 0 }, { label: '5', value: 0 }, { label: '6', value: 0 }, { label: '7', value: 0 }]} unit="XP" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="grid gap-2">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('프리미엄 공유', 'Premium sharing')}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {t('카톡/인스타에 바로 올릴 성장 카드', 'A progress card ready for KakaoTalk or Instagram')}
          </h2>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {t(
              '레벨, XP, 스트릭, 체중 변화를 한 장의 고급 카드로 정리합니다.',
              'Packages level, XP, streak, and weight into a polished progress card.',
            )}
          </p>
        </div>
        <button
          type="button"
          className="min-h-12 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          onClick={handleSharePremiumCard}
          disabled={shareBusy}
        >
          {shareBusy ? t('생성 중', 'Creating...') : t('프리미엄 카드 생성', 'Create Pro card')}
        </button>
      </section>

      <section className="grid gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:grid-cols-3 sm:p-6">
        <StatCard label={t('광고', 'Ads')} value={t('완전 제거', 'Removed')} detail={t('피드와 기록 화면을 깨끗하게 유지', 'Keeps feed and records clean')} />
        <StatCard label={t('기록 제한', 'Log limit')} value={t('무제한', 'Unlimited')} detail={t('오래 쌓아도 히스토리 제한 없음', 'No history cap as logs grow')} />
        <StatCard label={t('Pro 배지', 'Pro badge')} value="PRO" detail={t('프로필과 리더보드에서 신뢰도 상승', 'Raises trust on profile and boards')} />
      </section>
    </section>
  )
}
