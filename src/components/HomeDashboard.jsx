import { formatDateTimeByLanguage, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import OptimizedImage from './OptimizedImage'
import UserAvatar from './UserAvatar'
import { localizeLevelText } from '../utils/level'

function MetricPill({ eyebrow, value, detail }) {
  return (
    <article className="home-metric-pill">
      <span>{eyebrow}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}

function formatCalories(value, isEnglish) {
  if (!value) return isEnglish ? 'No data yet' : '아직 데이터 없음'
  return isEnglish ? `~${value} kcal` : `약 ${value}kcal`
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
    return isEnglish ? 'Community update' : '커뮤니티 업데이트'
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
        : `${workoutType} 기록을 남겼어요. ${post.metadata.note}`
    }

    return isEnglish ? `${workoutType} session saved.` : `${workoutType} 기록을 남겼어요.`
  }

  if (post?.type === 'challenge_complete') return isEnglish ? 'Weekly challenge cleared.' : '주간 챌린지를 달성했어요.'
  if (post?.type === 'level_up') return isEnglish ? 'Level-up update shared.' : '레벨업 소식을 공유했어요.'

  return isEnglish ? 'Shared a fresh progress update.' : '새로운 진행 상황을 공유했어요.'
}

function HomeFeedPreviewCard({ post, sourceLabel, onSelectUser, onSeeCommunity }) {
  const { language, isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const authorName = post.authorDisplayName || (isEnglish ? 'Guest' : '게스트')
  const authorLevel = post.authorLevel
    ? localizeLevelText(post.authorLevel, language)
    : t('레벨 준비 중', 'Level pending')
  const photoUrl = getHomeFeedPhotoUrl(post)
  const storyMeta = getHomeFeedMeta(post, language, isEnglish)
  const content = getHomeFeedCopy(post, language, isEnglish)

  return (
    <article className="home-feed-preview-card featured">
      <div className="home-feed-preview-top">
        <button
          type="button"
          className="home-feed-preview-author"
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
            className="home-feed-preview-avatar"
            imageUrl={post.authorAvatarUrl}
            fallback={post.authorAvatarEmoji || 'RUN'}
            alt={post.authorDisplayName || (isEnglish ? 'Author avatar' : '작성자 아바타')}
          />
          <div className="home-feed-preview-author-copy">
            <strong>{authorName}</strong>
            <span>{authorLevel}</span>
          </div>
        </button>

        <div className="home-feed-preview-top-meta">
          <span className="home-feed-preview-source">{sourceLabel}</span>
          <span className="home-feed-preview-time">
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
        <div className="home-feed-preview-media">
          <OptimizedImage
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

      <div className="home-feed-preview-copy">
        <span className="home-feed-preview-meta">{storyMeta}</span>
        <p>{content}</p>
      </div>

      <div className="home-feed-preview-footer">
        <div className="home-feed-preview-stats">
          <span>{t(`좋아요 ${post.likeCount ?? 0}`, `${post.likeCount ?? 0} likes`)}</span>
          <span>{t(`댓글 ${post.comments?.length ?? 0}`, `${post.comments?.length ?? 0} comments`)}</span>
        </div>
        <button type="button" className="ghost-btn home-feed-preview-open" onClick={onSeeCommunity}>
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
  const activityLevelValue = activitySummary?.levelValue ?? 1
  const goalCurrent = challenge?.current ?? 0
  const goalTarget = challenge?.goal ?? 0
  const goalProgress = Math.max(0, Math.min(challenge?.progress ?? 0, 100))

  const heroTitle = todayDone
    ? t('오늘 기록 완료', 'Saved for today')
    : t('오늘 한 번이면 돼요', 'One log is enough today')

  const heroBadgeLabel = todayDone
    ? t('오늘 완료', 'Saved today')
    : goalCurrent > 0
      ? t(`이번 주 ${goalCurrent}/${goalTarget}`, `Week ${goalCurrent}/${goalTarget}`)
      : t('첫 기록 만들기', 'Start the first log')

  const heroDescription = nickname
    ? todayDone
      ? t(
          `${nickname}님, 오늘 기록은 이미 끝났어요.`,
          `${nickname}, today is already done.`,
        )
      : t(
          `${nickname}님, 짧게 남겨도 충분해요.`,
          `${nickname}, a short log is enough.`,
        )
    : t(
        '종류와 시간만 적어도 충분해요.',
        'Type and time are enough.',
      )

  const recentWorkoutTitle = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : t('아직 기록 없음', 'No workout yet')

  const recentWorkoutMeta = stats.lastWorkoutType
    ? [
        stats.lastWorkoutDuration ? t(`${stats.lastWorkoutDuration}분`, `${stats.lastWorkoutDuration} min`) : null,
        stats.lastWorkoutCalories ? formatCalories(stats.lastWorkoutCalories, isEnglish) : null,
      ].filter(Boolean).join(' · ')
    : t('첫 기록이 여기에 보여요.', 'Your first log shows here.')

  const recentWorkoutFootnote = stats.lastWorkoutType
    ? t(
        `최근 운동 ${recentWorkoutTitle}${recentWorkoutMeta ? ` · ${recentWorkoutMeta}` : ''}`,
        `Latest ${recentWorkoutTitle}${recentWorkoutMeta ? ` · ${recentWorkoutMeta}` : ''}`,
      )
    : t('최근 운동은 기록을 남기면 여기서 보여요.', 'Recent workouts show up here after you log.')

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
    ? t('지금 기록할 시간이에요.', 'Time to log today.')
    : t(
        `리마인더 ${reminder?.reminderTimeLabel}`,
        `Reminder ${reminder?.reminderTimeLabel}`,
      )

  const reminderBody = reminder?.due
    ? t(
        '한 번만 남기면 흐름이 이어져요.',
        'One quick save keeps the streak alive.',
      )
    : t(
        '돌아올 시간을 잡아뒀어요.',
        'A return time is already set.',
      )

  const featuredFeedSection =
    (feedPreview.following?.length ? { label: t('팔로잉', 'Following'), items: feedPreview.following } : null)
    ?? (feedPreview.recommended?.length ? { label: t('추천', 'Recommended'), items: feedPreview.recommended } : null)
    ?? (feedPreview.popular?.length ? { label: t('인기', 'Popular'), items: feedPreview.popular } : null)
    ?? { label: t('피드', 'Feed'), items: [] }

  const featuredPost = featuredFeedSection.items[0] ?? null
  const emptyFeedSecondaryAction = !currentLevel
    ? { label: t('레벨 테스트', 'Level test'), onClick: onOpenTest }
    : { label: t('커뮤니티 보기', 'Open community'), onClick: onSeeCommunity }

  return (
    <section className="home-dashboard-app streamlined-home home-dashboard-redesign home-dashboard-clean">
      <section className="card home-focus-card home-growth-hero home-growth-hero-strong">
        <div className="home-growth-hero-main">
          <div className="home-focus-copy">
            <span className="app-section-kicker">{t('오늘의 액션', 'Today')}</span>
            <div className="home-focus-topline">
              <span className={`home-focus-badge ${todayDone ? 'done' : 'fresh'}`}>{heroBadgeLabel}</span>
            </div>
            {homeInsight ? (
              <div className={`home-focus-insight ${homeInsight.tone || 'default'}`}>
                <span>{homeInsight.label}</span>
                <strong>{homeInsight.title}</strong>
                <small>{homeInsight.body}</small>
              </div>
            ) : null}
            <h2>{heroTitle}</h2>
            <p>{heroDescription}</p>
          </div>

          <div className="home-focus-actions">
            <button
              type="button"
              className="primary-btn home-focus-btn home-focus-btn-strong"
              onClick={onOpenWorkoutComposer}
              disabled={workoutLoading}
              data-testid="home-log-workout"
            >
              {workoutLoading
                ? t('여는 중...', 'Opening...')
                : todayDone
                  ? t('추가 기록', 'Add log')
                  : t('운동 기록', 'Log workout')}
            </button>

            {topRoutine ? (
              <button
                type="button"
                className="ghost-btn home-focus-secondary"
                onClick={() => onStartRoutine?.(topRoutine)}
              >
                {t(`루틴 · ${topRoutine.name}`, `Routine · ${topRoutine.name}`)}
              </button>
            ) : !currentLevel ? (
              <button type="button" className="ghost-btn home-focus-secondary" onClick={onOpenTest}>
                {t('레벨 테스트', 'Level test')}
              </button>
            ) : null}
          </div>

          <div className="home-focus-summary-strip">
            {heroMetrics.map((item) => (
              <MetricPill
                key={item.eyebrow}
                eyebrow={item.eyebrow}
                value={item.value}
                detail={item.detail}
              />
            ))}
          </div>

          <p className="home-focus-footnote">{recentWorkoutFootnote}</p>

          {showReminderInline && (
            <div className={`home-focus-inline-banner ${reminder?.due ? 'due' : ''}`}>
              <div className="home-focus-inline-copy">
                <strong>{reminderTitle}</strong>
                <span>{reminderBody}</span>
              </div>
              {reminderPermission !== 'granted' && reminderPermission !== 'unsupported' && (
                <button type="button" className="ghost-btn" onClick={onRequestReminderPermission}>
                  {t('알림 켜기', 'Enable alert')}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="card home-feed-preview-shell compact-home-feed minimal-home-feed">
        <div className="home-module-heading home-feed-preview-heading">
          <div>
            <span className="app-section-kicker">{t('지금 피드', 'Now in feed')}</span>
            <h3>{t('지금 볼 한 장', 'One story to see')}</h3>
          </div>
          <button type="button" className="ghost-btn" onClick={onSeeCommunity}>
            {t('커뮤니티', 'Community')}
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
          <div className="empty-state-card cool home-feed-empty">
            <span className="empty-state-badge">{t('피드', 'Feed')}</span>
            <strong>{t('아직 피드가 조용해요.', 'Feed is quiet for now.')}</strong>
            <p>
              {t(
                '운동 한 번 기록하거나 커뮤니티를 열어보면 여기부터 채워져요.',
                'One log or a quick visit to community starts this area.',
              )}
            </p>
            <div className="state-action-row home-feed-empty-actions">
              <button type="button" className="primary-btn" onClick={onOpenWorkoutComposer}>
                {t('운동 기록', 'Log workout')}
              </button>
              <button type="button" className="ghost-btn" onClick={emptyFeedSecondaryAction.onClick}>
                {emptyFeedSecondaryAction.label}
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
