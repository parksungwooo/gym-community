import { formatDateTimeByLanguage, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { getTodayWorkoutRecommendation } from '../features/workout/recommendations'
import OptimizedImage from './OptimizedImage'
import UserAvatar from './UserAvatar'
import { localizeLevelText } from '../utils/level'

function MetricPill({ eyebrow, value, detail }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-950">
      <span className="block text-xs font-black uppercase text-gray-700 dark:text-gray-200">{eyebrow}</span>
      <strong className="mt-1 block text-2xl font-black text-gray-950 dark:text-white">{value}</strong>
      {detail ? <small className="mt-1 block text-xs font-bold text-gray-700 dark:text-gray-200">{detail}</small> : null}
    </article>
  )
}

const QUICK_WORKOUT_PRESETS = [
  { key: 'hiit', ko: 'HIIT', en: 'HIIT', workoutType: '운동', durationMinutes: 15, icon: 'HI', tone: 'blue' },
  { key: 'yoga', ko: '요가', en: 'Yoga', workoutType: '요가', durationMinutes: 20, icon: 'YO', tone: 'cyan' },
  { key: 'core', ko: '코어', en: 'Core', workoutType: '필라테스', durationMinutes: 12, icon: 'CO', tone: 'lime' },
  { key: 'strength', ko: '근력', en: 'Strength', workoutType: '웨이트', durationMinutes: 18, icon: 'ST', tone: 'steel' },
]

function clampPercent(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(parsed, 100))
}

function QuickWorkoutIcon({ type }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  }

  switch (type) {
    case 'hiit':
      return (
        <svg {...commonProps}>
          <path d="m13 2-7 11h5l-1 9 8-13h-5l1-7Z" />
        </svg>
      )
    case 'yoga':
      return (
        <svg {...commonProps}>
          <path d="M12 6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M12 8v5" />
          <path d="m7 11 5 2 5-2" />
          <path d="M5 20c2.6-3 4.7-4.5 7-4.5S16.4 17 19 20" />
        </svg>
      )
    case 'core':
      return (
        <svg {...commonProps}>
          <path d="M8 5h8" />
          <path d="M7 19h10" />
          <path d="M9 5c-.8 2.2-1.2 4.5-1.2 7s.4 4.8 1.2 7" />
          <path d="M15 5c.8 2.2 1.2 4.5 1.2 7s-.4 4.8-1.2 7" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
        </svg>
      )
    case 'strength':
      return (
        <svg {...commonProps}>
          <path d="M4 10v4" />
          <path d="M8 8v8" />
          <path d="M16 8v8" />
          <path d="M20 10v4" />
          <path d="M8 12h8" />
        </svg>
      )
    default:
      return (
        <svg {...commonProps}>
          <path d="M12 3v18" />
          <path d="M5 12h14" />
          <path d="m8 7 4-4 4 4" />
          <path d="m16 17-4 4-4-4" />
        </svg>
      )
  }
}

function QuickWorkoutCard({ item, isEnglish, onStart }) {
  const title = item.name || (isEnglish ? item.en : item.ko)
  const duration = item.duration_minutes ?? item.durationMinutes ?? 15

  return (
    <button
      type="button"
      className="grid min-h-28 gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 dark:border-white/10 dark:bg-neutral-950"
      onClick={() => onStart?.(item)}
      aria-label={
        isEnglish
          ? `Start ${title} workout for ${duration} minutes`
          : `${title} ${duration}분 운동 시작`
        }
    >
      <span className="text-sm font-black text-gray-950 dark:text-white">{title}</span>
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
        <QuickWorkoutIcon type={item.iconType ?? item.key} />
      </span>
      <span className="text-xs font-black text-gray-700 dark:text-gray-200">
        {isEnglish ? `${duration} min` : `${duration}분`}
      </span>
    </button>
  )
}

function formatCalories(value, isEnglish) {
  if (!value) return isEnglish ? 'No data yet' : '기록 없음'
  return isEnglish ? `~${value} kcal` : `${value}kcal`
}

function getHomeFeedPhotoUrl(post) {
  if (Array.isArray(post?.metadata?.photoUrls) && post.metadata.photoUrls.length > 0) {
    return post.metadata.photoUrls[0]
  }

  return post?.metadata?.photoUrl ?? null
}

function getHomeFeedMeta(post, language, isEnglish) {
  if (post?.type !== 'workout_complete') {
    if (post?.type === 'challenge_complete') return isEnglish ? 'Challenge complete' : '챌린지 완료'
    if (post?.type === 'level_up') return isEnglish ? 'Level up' : '레벨업'
    return isEnglish ? 'Community update' : '새 피드'
  }

  const workoutType = getWorkoutTypeLabel(post?.metadata?.workoutType, language)
  const parts = [workoutType]

  if (post?.metadata?.durationMinutes) {
    parts.push(isEnglish ? `${post.metadata.durationMinutes} min` : `${post.metadata.durationMinutes}분`)
  }

  return parts.filter(Boolean).join(' · ')
}

function getHomeFeedCopy(post, language, isEnglish) {
  if (post?.content?.trim()) return post.content

  if (post?.type === 'workout_complete') {
    const workoutType = getWorkoutTypeLabel(post?.metadata?.workoutType, language)
    if (post?.metadata?.note) {
      return isEnglish
        ? `${workoutType} session saved. ${post.metadata.note}`
        : `${workoutType} 완료. ${post.metadata.note}`
    }

    return isEnglish ? `${workoutType} session saved.` : `${workoutType} 완료.`
  }

  if (post?.type === 'challenge_complete') return isEnglish ? 'Weekly challenge cleared.' : '주간 챌린지를 달성했어요.'
  if (post?.type === 'level_up') return isEnglish ? 'Level-up update shared.' : '레벨업을 공유했어요.'

  return isEnglish ? 'Shared a fresh progress update.' : '새 기록을 공유했어요.'
}

function HomeFeedPreviewCard({ post, sourceLabel, onSelectUser, onSeeCommunity }) {
  const { language, isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const authorName = post.authorDisplayName || (isEnglish ? 'Guest' : '게스트')
  const authorLevel = post.authorLevel
    ? localizeLevelText(post.authorLevel, language)
    : t('레벨 미정', 'Level pending')
  const photoUrl = getHomeFeedPhotoUrl(post)
  const storyMeta = getHomeFeedMeta(post, language, isEnglish)
  const content = getHomeFeedCopy(post, language, isEnglish)

  return (
    <article className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() =>
            onSelectUser?.({
              user_id: post.user_id,
              display_name: post.authorDisplayName,
              avatar_emoji: post.authorAvatarEmoji,
              avatar_url: post.authorAvatarUrl,
              latest_level: post.authorLevel,
              latest_score: post.authorScore,
              activity_level: post.activity_level ?? null,
              activity_level_label: post.activity_level_label ?? null,
              total_xp: post.total_xp ?? 0,
              weekly_points: post.weekly_points ?? 0,
            })}
        >
          <UserAvatar
            className="h-12 w-12 rounded-2xl"
            imageUrl={post.authorAvatarUrl}
            fallback={post.authorAvatarEmoji || 'RUN'}
            alt={post.authorDisplayName || (isEnglish ? 'Author avatar' : '작성자 아바타')}
          />
          <div className="min-w-0">
            <strong className="block truncate text-base font-black text-gray-950 dark:text-white">{authorName}</strong>
            <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">{authorLevel}</span>
          </div>
        </button>

        <div className="grid justify-items-end gap-1 text-right">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-200">{sourceLabel}</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {formatDateTimeByLanguage(post.created_at, language, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {photoUrl ? (
        <div className="overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/10">
          <OptimizedImage
            className="aspect-[4/3] w-full object-cover"
            imageUrl={photoUrl}
            preset="feedThumbnail"
            alt={isEnglish ? 'Workout proof preview' : '운동 인증 사진 미리보기'}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 720px) 92vw, 420px"
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">{storyMeta}</span>
        <p className="m-0 text-base font-semibold leading-7 text-gray-700 dark:text-gray-200">{content}</p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
        <div className="flex flex-wrap gap-2 text-xs font-black text-gray-700 dark:text-gray-200">
          <span>{t(`좋아요 ${post.likeCount ?? 0}`, `${post.likeCount ?? 0} likes`)}</span>
          <span>{t(`댓글 ${post.comments?.length ?? 0}`, `${post.comments?.length ?? 0} comments`)}</span>
        </div>
        <button type="button" className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onSeeCommunity}>
          {t('더 보기', 'Open')}
        </button>
      </div>
    </article>
  )
}

export default function HomeDashboard({
  profile,
  todayDone,
  currentLevel,
  stats,
  challenge,
  activitySummary,
  homeInsight,
  reminder,
  reminderPermission,
  feedPreview = {},
  routineTemplates = [],
  workoutLoading,
  onOpenWorkoutComposer,
  onStartRoutine,
  onOpenTest,
  onSeeCommunity,
  onSelectFeedPreviewUser,
  onRequestReminderPermission,
}) {
  const { isEnglish, language } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)

  const nickname = profile?.display_name?.trim()
  const topRoutine = routineTemplates[0] ?? null
  const goalCurrent = challenge?.current ?? 0
  const goalTarget = challenge?.goal ?? 0
  const goalProgress = Math.max(0, Math.min(challenge?.progress ?? 0, 100))
  const todayCalories = Number(stats.todayCalories) || 0
  const dailyGoalCalories = Math.max(440, (goalTarget || 4) * 220)
  const dailyGoalProgress = clampPercent((todayCalories / dailyGoalCalories) * 100)
  const dailyGoalAngle = `${dailyGoalProgress * 3.6}deg`
  const activityLevelValue = Number(activitySummary?.levelValue) || 1
  const activityLevelProgress = clampPercent(activitySummary?.progressPercent ?? goalProgress)
  const currentLevelLabel = currentLevel
    ? localizeLevelText(currentLevel, language)
    : t('레벨 미정', 'Level pending')
  const todayRecommendation = getTodayWorkoutRecommendation({
    currentLevel,
    activitySummary,
    stats,
    todayDone,
    language,
    isEnglish,
  })
  const quickWorkouts = [
    {
      key: 'recommended-today',
      name: todayRecommendation.title,
      workoutType: todayRecommendation.workoutType,
      durationMinutes: todayRecommendation.durationMinutes,
      icon: 'RC',
      iconType: todayRecommendation.workoutType === '웨이트' ? 'strength' : todayRecommendation.workoutType === '요가' ? 'yoga' : 'hiit',
      tone: 'routine',
      note: todayRecommendation.body,
    },
    ...routineTemplates.slice(0, 2).map((routine, index) => ({
      ...routine,
      key: `routine-${routine.id ?? routine.name ?? index}`,
      name: routine.name,
      durationMinutes: routine.duration_minutes ?? routine.durationMinutes ?? 20,
      workoutType: routine.workout_type ?? routine.workoutType ?? '운동',
      icon: routine.name?.slice(0, 2).toUpperCase() || 'RT',
      tone: index === 0 ? 'routine' : 'steel',
    })),
    ...QUICK_WORKOUT_PRESETS,
  ].slice(0, 4)

  const heroTitle = todayDone
    ? t('오늘 완료', 'Saved for today')
    : t('오늘은 한 번만', 'One log is enough today')

  const heroBadgeLabel = todayDone
    ? t('오늘 완료', 'Saved today')
    : goalCurrent > 0
      ? t(`이번 주 ${goalCurrent}/${goalTarget}`, `Week ${goalCurrent}/${goalTarget}`)
      : t('첫 기록 시작', 'Start the first log')

  const heroDescription = nickname
    ? todayDone
      ? t(
          `${nickname}님, 오늘도 해냈어요.`,
          `${nickname}, today is already done.`,
        )
      : t(
          `${nickname}님, 짧게라도 남겨봐요.`,
          `${nickname}, a short log is enough.`,
        )
    : t(
        '종류와 시간만 남기면 돼요.',
        'Type and time are enough.',
      )

  const recentWorkoutTitle = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : t('기록 없음', 'No workout yet')

  const recentWorkoutMeta = stats.lastWorkoutType
    ? [
        stats.lastWorkoutDuration ? t(`${stats.lastWorkoutDuration}분`, `${stats.lastWorkoutDuration} min`) : null,
        stats.lastWorkoutCalories ? formatCalories(stats.lastWorkoutCalories, isEnglish) : null,
      ].filter(Boolean).join(' · ')
    : t('첫 기록이 여기 쌓여요.', 'Your first log shows here.')

  const recentWorkoutFootnote = stats.lastWorkoutType
    ? t(
        `최근 운동 ${recentWorkoutTitle}${recentWorkoutMeta ? ` · ${recentWorkoutMeta}` : ''}`,
        `Latest ${recentWorkoutTitle}${recentWorkoutMeta ? ` · ${recentWorkoutMeta}` : ''}`,
      )
    : t('기록하면 최근 운동이 여기 보여요.', 'Recent workouts show up here after you log.')

  const heroMetrics = [
    {
      eyebrow: t('주간 목표', 'Weekly goal'),
      value: `${goalCurrent}/${goalTarget}`,
      detail: `${goalProgress}%`,
    },
    {
      eyebrow: t('연속 기록', 'Streak'),
      value: t(`${stats.streak}일`, `${stats.streak} days`),
      detail: t(`오늘 XP ${activitySummary?.todayXp ?? 0}`, `Today XP ${activitySummary?.todayXp ?? 0}`),
    },
  ]

  const showReminderInline = reminder?.enabled && !todayDone
  const reminderTitle = reminder?.due
    ? t('지금 한 번 남겨요.', 'Time to log today.')
    : t(
        `리마인더 ${reminder?.reminderTimeLabel}`,
        `Reminder ${reminder?.reminderTimeLabel}`,
      )

  const reminderBody = reminder?.due
    ? t(
        '한 번이면 리듬이 이어져요.',
        'One quick save keeps the streak alive.',
      )
    : t(
        '운동할 시간을 기억해둘게요.',
        'A return time is already set.',
      )

  const featuredFeedSection =
    (feedPreview.following?.length ? { label: t('팔로잉', 'Following'), items: feedPreview.following } : null)
    ?? (feedPreview.recommended?.length ? { label: t('추천', 'Recommended'), items: feedPreview.recommended } : null)
    ?? (feedPreview.popular?.length ? { label: t('인기', 'Popular'), items: feedPreview.popular } : null)
    ?? { label: t('피드', 'Feed'), items: [] }

  const featuredPost = featuredFeedSection.items[0] ?? null
  const emptyFeedSecondaryAction = !currentLevel
    ? { label: t('레벨 확인', 'Level test'), onClick: onOpenTest }
    : { label: t('피드 보기', 'Open community'), onClick: onSeeCommunity }

  return (
    <section className="grid gap-6">
      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2" aria-label={t('오늘 요약', 'Today goal and level summary')}>
          <div
            className="grid min-h-52 place-items-center rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-neutral-950"
            style={{ '--goal-angle': dailyGoalAngle }}
          >
            <div
              className="grid h-40 w-40 place-items-center rounded-full p-3"
              style={{ background: `conic-gradient(#10b981 ${dailyGoalAngle}, #e5e7eb 0deg)` }}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-white p-4 text-center dark:bg-neutral-900">
                <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{t('오늘 목표', 'Daily Goal')}</span>
                <strong className="mt-1 text-xl font-black text-gray-950 dark:text-white">{`${Math.round(todayCalories)} / ${dailyGoalCalories}`}</strong>
                <small className="text-xs font-bold text-gray-700 dark:text-gray-200">{t('kcal', 'kcal')}</small>
                <em className="mt-1 not-italic text-xs font-black text-emerald-800 dark:text-emerald-200">{`${Math.round(dailyGoalProgress)}% ${isEnglish ? 'Completed' : '완료'}`}</em>
              </div>
            </div>
          </div>

          <div className="grid content-between gap-4 rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-neutral-950">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('피트니스 레벨', 'Fitness Level')}</span>
            <div className="grid gap-3">
              <strong className="text-3xl font-black leading-tight text-gray-950 dark:text-white">{`Lv.${activityLevelValue}`}</strong>
              <span className="text-base font-black text-gray-800 dark:text-gray-100">{currentLevelLabel}</span>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${activityLevelProgress}%` }} />
              </div>
            </div>
            <small className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {activitySummary?.remainingXp
                ? t(`다음 레벨까지 ${activitySummary.remainingXp}XP`, `${activitySummary.remainingXp} XP to next level`)
                : t('오늘도 성장 중', 'Growing today')}
            </small>
          </div>
        </div>

        <button
          type="button"
          className="grid gap-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-emerald-400/20 dark:bg-emerald-500/15"
          onClick={() => onStartRoutine?.({
            name: todayRecommendation.title,
            workoutType: todayRecommendation.workoutType,
            durationMinutes: todayRecommendation.durationMinutes,
            note: todayRecommendation.body,
          })}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm dark:bg-neutral-900 dark:text-emerald-200">{todayRecommendation.label}</span>
              <h3 className="mt-3 mb-1 text-2xl font-black leading-tight text-gray-950 dark:text-white">
                {todayRecommendation.title}
              </h3>
              <p className="m-0 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">
                {todayRecommendation.body}
              </p>
            </div>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-lg font-black text-white shadow-sm">
              +{todayRecommendation.estimatedXp}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-700 shadow-sm dark:bg-neutral-900 dark:text-gray-200">
              {isEnglish ? `${todayRecommendation.durationMinutes} min` : `${todayRecommendation.durationMinutes}분`}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-700 shadow-sm dark:bg-neutral-900 dark:text-gray-200">
              {todayRecommendation.intensityLabel}
            </span>
            <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">
              {isEnglish ? 'Start' : '바로 기록'}
            </span>
          </div>
        </button>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-base font-black text-gray-950 dark:text-white">{t('빠른 시작', 'Quick Workout')}</strong>
            <button type="button" className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onOpenWorkoutComposer}>
              {t('직접 입력', 'Custom')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickWorkouts.map((item) => (
              <QuickWorkoutCard
                key={item.key}
                item={item}
                isEnglish={isEnglish}
                onStart={(preset) => onStartRoutine?.(preset)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-3">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('오늘 할 일', 'Today')}</span>
            <div>
              <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${todayDone ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>{heroBadgeLabel}</span>
            </div>
            {homeInsight ? (
              <div className="grid gap-1 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
                <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{homeInsight.label}</span>
                <strong className="text-base font-black text-gray-950 dark:text-white">{homeInsight.title}</strong>
                <small className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{homeInsight.body}</small>
              </div>
            ) : null}
            <h2 className="m-0 text-3xl font-black leading-tight text-gray-950 dark:text-white">{heroTitle}</h2>
            <p className="m-0 text-base font-semibold leading-7 text-gray-800 dark:text-gray-100">{heroDescription}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              className="min-h-12 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onOpenWorkoutComposer}
              disabled={workoutLoading}
              data-testid="home-log-workout"
            >
              {workoutLoading
                ? t('여는 중...', 'Opening...')
                : todayDone
                  ? t('하나 더', 'Add log')
                  : t('기록하기', 'Log workout')}
            </button>

            {topRoutine ? (
              <button
                type="button"
                className="min-h-12 rounded-lg bg-gray-100 px-5 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
                onClick={() => onStartRoutine?.(topRoutine)}
              >
                {t(`루틴 · ${topRoutine.name}`, `Routine · ${topRoutine.name}`)}
              </button>
            ) : !currentLevel ? (
              <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-5 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onOpenTest}>
                {t('레벨 확인', 'Level test')}
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {heroMetrics.map((item) => (
              <MetricPill
                key={item.eyebrow}
                eyebrow={item.eyebrow}
                value={item.value}
                detail={item.detail}
              />
            ))}
          </div>

          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{recentWorkoutFootnote}</p>

          {showReminderInline && (
            <div className={`flex items-center justify-between gap-4 rounded-2xl p-4 ${reminder?.due ? 'bg-rose-50 dark:bg-rose-500/15' : 'bg-gray-50 dark:bg-white/10'}`}>
              <div className="grid gap-1">
                <strong className="text-sm font-black text-gray-950 dark:text-white">{reminderTitle}</strong>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{reminderBody}</span>
              </div>
              {reminderPermission !== 'granted' && reminderPermission !== 'unsupported' && (
                <button type="button" className="min-h-10 rounded-lg bg-white px-3 text-sm font-black text-gray-800 shadow-sm transition hover:text-gray-950 dark:bg-neutral-900 dark:text-gray-100 dark:hover:text-white" onClick={onRequestReminderPermission}>
                  {t('알림 켜기', 'Enable alert')}
                </button>
              )}
            </div>
          )}
        </div>

      </section>

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('피드', 'Now in feed')}</span>
            <h3 className="m-0 mt-1 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('오늘의 피드', 'One story to see')}</h3>
          </div>
          <button type="button" className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onSeeCommunity}>
            {t('피드 보기', 'Community')}
          </button>
        </div>

        {featuredPost ? (
          <HomeFeedPreviewCard
            post={featuredPost}
            sourceLabel={featuredFeedSection.label}
            onSelectUser={onSelectFeedPreviewUser}
            onSeeCommunity={onSeeCommunity}
          />
        ) : (
          <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
            <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">{t('피드', 'Feed')}</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white">{t('아직 조용해요', 'Feed is quiet for now.')}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {t(
                '첫 기록을 남기면 피드가 살아나요.',
                'One log or a quick visit to community starts this area.',
              )}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button type="button" className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800" onClick={onOpenWorkoutComposer}>
                {t('기록하기', 'Log workout')}
              </button>
              <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={emptyFeedSecondaryAction.onClick}>
                {emptyFeedSecondaryAction.label}
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
