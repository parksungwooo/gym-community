import { formatDateTimeByLanguage, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { getTodayWorkoutRecommendation } from '../features/workout/recommendations'
import { localizeLevelText } from '../utils/level'
import OptimizedImage from './OptimizedImage'
import TodayWorkoutRecommendationCard from './TodayWorkoutRecommendationCard'
import UserAvatar from './UserAvatar'

const QUICK_WORKOUT_PRESETS = [
  { key: 'walk', name: { ko: '빠른 걷기', en: 'Fast walk' }, workoutType: '걷기', durationMinutes: 15, iconType: 'walk' },
  { key: 'run', name: { ko: '러닝', en: 'Run' }, workoutType: '러닝', durationMinutes: 25, iconType: 'run' },
  { key: 'strength', name: { ko: '웨이트', en: 'Strength' }, workoutType: '웨이트', durationMinutes: 35, iconType: 'strength' },
  { key: 'mobility', name: { ko: '스트레칭', en: 'Mobility' }, workoutType: '스트레칭', durationMinutes: 12, iconType: 'mobility' },
]

function getDisplayText(value, language = 'ko', fallback = '') {
  if (value && typeof value === 'object') {
    return value[language] ?? value.ko ?? value.en ?? fallback
  }

  return value ?? fallback
}

function clampPercent(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(parsed, 100))
}

function MetricPill({ label, value, detail }) {
  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <span className="block text-xs font-black uppercase text-gray-700 dark:text-gray-200">{label}</span>
      <strong className="mt-2 block text-2xl font-black leading-tight text-gray-950 dark:text-white">{value}</strong>
      {detail ? <span className="mt-1 block text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{detail}</span> : null}
    </article>
  )
}

function QuickWorkoutIcon({ type }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  }

  if (type === 'strength') {
    return (
      <svg {...commonProps}>
        <path d="M4 10v4" />
        <path d="M8 8v8" />
        <path d="M16 8v8" />
        <path d="M20 10v4" />
        <path d="M8 12h8" />
      </svg>
    )
  }

  if (type === 'mobility') {
    return (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M6 9c2 2 4 3 6 3s4-1 6-3" />
        <path d="M7 19c1.6-2.5 3.2-3.8 5-3.8s3.4 1.3 5 3.8" />
      </svg>
    )
  }

  if (type === 'run') {
    return (
      <svg {...commonProps}>
        <path d="M13 4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="m7 21 3-6" />
        <path d="m14 21-2-5-3-2 2-5 3 2 3 1" />
        <path d="m5 11 4-2" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M7 19c1.5-3 3.2-4.5 5-4.5S15.5 16 17 19" />
      <path d="M8 7h8" />
      <path d="M9 7c-.8 2-1.2 4-1.2 6" />
      <path d="M15 7c.8 2 1.2 4 1.2 6" />
    </svg>
  )
}

function QuickWorkoutCard({ item, language, isEnglish, onStart }) {
  const title = getDisplayText(item.name, language, item.workoutType)
  const duration = Number(item.duration_minutes ?? item.durationMinutes) || 20

  return (
    <button
      type="button"
      className="grid min-h-32 gap-3 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-white/10 dark:bg-neutral-900"
      onClick={() => onStart?.({
        ...item,
        name: title,
        workoutType: item.workout_type ?? item.workoutType,
        durationMinutes: duration,
      })}
      aria-label={isEnglish ? `Start ${title} for ${duration} minutes` : `${title} ${duration}분 시작`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-700/20 dark:text-emerald-200 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
        <QuickWorkoutIcon type={item.iconType ?? item.key} />
      </span>
      <span className="text-base font-black leading-6 text-gray-950 dark:text-white">{title}</span>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{isEnglish ? `${duration} min` : `${duration}분`}</span>
    </button>
  )
}

function getHomeFeedPhotoUrl(post) {
  if (Array.isArray(post?.metadata?.photoUrls) && post.metadata.photoUrls.length > 0) {
    return post.metadata.photoUrls[0]
  }

  return post?.metadata?.photoUrl ?? null
}

function getHomeFeedMeta(post, language, isEnglish) {
  if (post?.type === 'challenge_complete') return isEnglish ? 'Challenge complete' : '챌린지 완료'
  if (post?.type === 'level_up') return isEnglish ? 'Level up' : '레벨업'
  if (post?.type !== 'workout_complete') return isEnglish ? 'Community update' : '커뮤니티 업데이트'

  const workoutType = getWorkoutTypeLabel(post?.metadata?.workoutType, language)
  const duration = Number(post?.metadata?.durationMinutes)
  const parts = [workoutType]

  if (Number.isFinite(duration) && duration > 0) {
    parts.push(isEnglish ? `${duration} min` : `${duration}분`)
  }

  return parts.join(' • ')
}

function getHomeFeedCopy(post, language, isEnglish) {
  if (post?.content?.trim()) return post.content

  if (post?.type === 'workout_complete') {
    return isEnglish
      ? `${getWorkoutTypeLabel(post?.metadata?.workoutType, language)} session saved.`
      : `${getWorkoutTypeLabel(post?.metadata?.workoutType, language)} 운동을 완료했어요.`
  }

  if (post?.type === 'challenge_complete') return isEnglish ? 'Weekly challenge cleared.' : '주간 챌린지를 달성했어요.'
  if (post?.type === 'level_up') return isEnglish ? 'Shared a level-up moment.' : '레벨업 순간을 공유했어요.'

  return isEnglish ? 'Shared a fresh progress update.' : '새로운 성장 기록을 공유했어요.'
}

function HomeFeedPreviewCard({ post, sourceLabel, onSelectUser, onSeeCommunity }) {
  const { language, isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const authorName = post.authorDisplayName || t('게스트', 'Guest')
  const authorLevel = post.authorLevel
    ? localizeLevelText(post.authorLevel, language)
    : t('레벨 미측정', 'Level pending')
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
            alt={post.authorDisplayName || t('작성자 아바타', 'Author avatar')}
          />
          <div className="min-w-0">
            <strong className="block truncate text-base font-black text-gray-950 dark:text-white">{authorName}</strong>
            <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">
              {authorLevel}
            </span>
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
            alt={t('운동 인증 사진 미리보기', 'Workout proof preview')}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 720px) 92vw, 420px"
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">{storyMeta}</span>
        <p className="m-0 text-base font-semibold leading-7 text-gray-800 dark:text-gray-100">{content}</p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
        <div className="flex flex-wrap gap-2 text-xs font-black text-gray-700 dark:text-gray-200">
          <span>{t(`좋아요 ${post.likeCount ?? 0}`, `${post.likeCount ?? 0} likes`)}</span>
          <span>{t(`댓글 ${post.comments?.length ?? 0}`, `${post.comments?.length ?? 0} comments`)}</span>
        </div>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
          onClick={onSeeCommunity}
        >
          {t('열기', 'Open')}
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
  workoutHistory = [],
  workoutLoading,
  celebration,
  isPro = false,
  onOpenWorkoutComposer,
  onCompleteRecommendedWorkout,
  onStartRoutine,
  onOpenTest,
  onSeeCommunity,
  onSelectFeedPreviewUser,
  onRequestReminderPermission,
  onOpenPaywall,
}) {
  const { isEnglish, language } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const weeklyGoal = challenge?.goal ?? profile?.weekly_goal ?? 4
  const weeklyCount = challenge?.current ?? stats.weeklyCount ?? 0
  const goalProgress = clampPercent(challenge?.progress ?? ((weeklyCount / Math.max(weeklyGoal, 1)) * 100))
  const activityLevelValue = Number(activitySummary?.levelValue) || 1
  const activityLevelProgress = clampPercent(activitySummary?.progressPercent ?? 0)
  const currentLevelLabel = currentLevel
    ? localizeLevelText(currentLevel, language)
    : t('레벨 미측정', 'Level pending')
  const todayRecommendation = getTodayWorkoutRecommendation({
    currentLevel,
    activitySummary,
    stats,
    todayDone,
    workoutHistory,
    weeklyGoal,
    isPremium: isPro,
    language,
    isEnglish,
  })
  const topRoutine = routineTemplates[0] ?? null
  const topRoutineName = getDisplayText(topRoutine?.name, language, t('저장 루틴', 'Saved routine'))
  const quickWorkouts = [
    {
      key: 'recommended-today',
      name: todayRecommendation.title,
      workoutType: todayRecommendation.workoutType,
      durationMinutes: todayRecommendation.durationMinutes,
      iconType: todayRecommendation.workoutType === '웨이트' ? 'strength' : todayRecommendation.workoutType === '러닝' ? 'run' : 'walk',
      note: '',
    },
    ...routineTemplates.slice(0, 2).map((routine, index) => {
      const routineName = getDisplayText(routine.name, language, t('저장 루틴', 'Saved routine'))

      return {
        ...routine,
        key: `routine-${routine.id ?? routineName ?? index}`,
        name: routineName,
        durationMinutes: routine.duration_minutes ?? routine.durationMinutes ?? 20,
        workoutType: routine.workout_type ?? routine.workoutType ?? '운동',
        iconType: 'strength',
      }
    }),
    ...QUICK_WORKOUT_PRESETS,
  ].slice(0, 4)
  const featuredFeedSection =
    (feedPreview.following?.length ? { label: t('팔로잉', 'Following'), items: feedPreview.following } : null)
    ?? (feedPreview.recommended?.length ? { label: t('추천', 'Recommended'), items: feedPreview.recommended } : null)
    ?? (feedPreview.popular?.length ? { label: t('인기', 'Popular'), items: feedPreview.popular } : null)
    ?? { label: t('피드', 'Feed'), items: [] }
  const featuredPost = featuredFeedSection.items[0] ?? null
  const emptyFeedAction = !currentLevel
    ? { label: t('레벨 테스트 하기', 'Take level test'), onClick: onOpenTest }
    : { label: t('커뮤니티 보기', 'Open community'), onClick: onSeeCommunity }
  const reminderDue = reminder?.enabled && !todayDone

  const completeRecommendation = (recommendation) => {
    onCompleteRecommendedWorkout?.({
      workoutType: recommendation.workoutType,
      durationMinutes: recommendation.durationMinutes,
      note: recommendation.note,
      shareToFeed: profile?.default_share_to_feed !== false,
      source: 'today_recommendation',
    })
  }

  const customizeRecommendation = (recommendation) => {
    onStartRoutine?.({
      name: recommendation.title,
      workoutType: recommendation.workoutType,
      durationMinutes: recommendation.durationMinutes,
      note: '',
    })
  }

  return (
    <section className="grid gap-6">
      <TodayWorkoutRecommendationCard
        recommendation={todayRecommendation}
        completed={todayDone}
        celebration={celebration}
        isPro={isPro}
        loading={workoutLoading}
        profile={profile}
        activitySummary={activitySummary}
        weeklyCount={weeklyCount}
        weeklyGoal={weeklyGoal}
        onComplete={completeRecommendation}
        onCustomize={customizeRecommendation}
        onOpenPaywall={onOpenPaywall}
        onSeeCommunity={onSeeCommunity}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricPill
          label={t('이번 주 목표', 'Weekly goal')}
          value={`${weeklyCount}/${weeklyGoal}`}
          detail={`${goalProgress}% ${t('완료', 'complete')}`}
        />
        <MetricPill
          label={t('스트릭', 'Streak')}
          value={t(`${activitySummary?.currentStreak ?? stats.streak ?? 0}일`, `${activitySummary?.currentStreak ?? stats.streak ?? 0} days`)}
          detail={t(`오늘 XP ${activitySummary?.todayXp ?? 0}`, `Today XP ${activitySummary?.todayXp ?? 0}`)}
        />
        <MetricPill
          label={t('피트니스 레벨', 'Fitness level')}
          value={`Lv.${activityLevelValue}`}
          detail={currentLevelLabel}
        />
      </section>

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('오늘의 흐름', 'Today flow')}</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {todayDone ? t('완료 후에도 다음 행동이 보여요', 'Next action stays clear after completion') : t('추천 운동으로 바로 시작하세요', 'Start from the recommendation')}
            </h2>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onOpenWorkoutComposer}
            data-testid="home-log-workout"
          >
            {t('직접 기록', 'Custom')}
          </button>
        </div>

        {homeInsight ? (
          <div className="grid gap-1 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{homeInsight.label}</span>
            <strong className="text-base font-black text-gray-950 dark:text-white">{homeInsight.title}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{homeInsight.body}</p>
          </div>
        ) : null}

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-base font-black text-gray-950 dark:text-white">{t('빠른 시작', 'Quick start')}</strong>
            {topRoutine ? (
              <button
                type="button"
                className="min-h-11 rounded-lg bg-emerald-50 px-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-700/20 dark:text-emerald-200"
                onClick={() => onStartRoutine?.({ ...topRoutine, name: topRoutineName })}
              >
                {topRoutineName}
              </button>
            ) : !currentLevel ? (
              <button
                type="button"
                className="min-h-11 rounded-lg bg-emerald-50 px-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-700/20 dark:text-emerald-200"
                onClick={onOpenTest}
              >
                {t('레벨 테스트', 'Level test')}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickWorkouts.map((item) => (
              <QuickWorkoutCard
                key={item.key}
                item={item}
                language={language}
                isEnglish={isEnglish}
                onStart={onStartRoutine}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <div className="grid gap-1">
              <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{t('레벨 진행', 'Level progress')}</span>
              <strong className="text-xl font-black text-gray-950 dark:text-white">{`${activityLevelProgress}%`}</strong>
            </div>
            <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">
              {activitySummary?.remainingXp
                ? t(`${activitySummary.remainingXp} XP 남음`, `${activitySummary.remainingXp} XP left`)
                : t('성장 중', 'Growing')}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${activityLevelProgress}%` }} />
          </div>
        </div>

        {reminderDue ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/15">
            <div className="grid gap-1">
              <strong className="text-sm font-black text-gray-950 dark:text-white">
                {reminder?.due ? t('지금 한 번 기록할 시간이에요', 'Time to log today') : t(`리마인더 ${reminder?.reminderTimeLabel}`, `Reminder ${reminder?.reminderTimeLabel}`)}
              </strong>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {reminder?.due ? t('짧게라도 저장하면 스트릭이 이어져요.', 'A quick save keeps the streak alive.') : t('정한 시간에 다시 알려드릴게요.', 'Your reminder is already set.')}
              </span>
            </div>
            {reminderPermission !== 'granted' && reminderPermission !== 'unsupported' ? (
              <button
                type="button"
                className="min-h-11 rounded-lg bg-white px-3 text-sm font-black text-gray-800 shadow-sm transition hover:text-gray-950 dark:bg-neutral-900 dark:text-gray-100 dark:hover:text-white"
                onClick={onRequestReminderPermission}
              >
                {t('알림 켜기', 'Enable')}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('커뮤니티', 'Community')}</span>
            <h3 className="m-0 mt-1 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('오늘 볼 만한 기록', 'A story worth opening')}</h3>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onSeeCommunity}
          >
            {t('피드 보기', 'Open feed')}
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
          <div className="grid gap-3 rounded-3xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
            <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{t('피드', 'Feed')}</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white">{t('아직 조용해요', 'Feed is quiet for now')}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {t('오늘 운동을 완료하면 바로 공유할 수 있는 기록이 생겨요.', 'Complete today workout and you will have something worth sharing.')}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
                onClick={() => completeRecommendation(todayRecommendation)}
                disabled={workoutLoading}
              >
                {t('오늘 운동 완료', 'Complete today workout')}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
                onClick={emptyFeedAction.onClick}
              >
                {emptyFeedAction.label}
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
