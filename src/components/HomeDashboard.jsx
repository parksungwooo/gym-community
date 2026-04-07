import { useState } from 'react'
import { formatDateTimeByLanguage, getBadgeLabel, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import OptimizedImage from './OptimizedImage'
import UserAvatar from './UserAvatar'
import { localizeLevelText } from '../utils/level'

function MetricPill({ eyebrow, value, detail, tone = 'default' }) {
  return (
    <article className={`home-metric-pill ${tone}`}>
      <span>{eyebrow}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}

function InsightStat({ label, value, detail }) {
  return (
    <article className="home-insight-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}

function ActivityBadgeStrip({ badges }) {
  if (!badges.length) return null

  return (
    <div className="home-badge-strip">
      {badges.map((badge) => (
        <span key={badge} className="home-badge-chip">
          {badge}
        </span>
      ))}
    </div>
  )
}

function formatCalories(value, isEnglish) {
  if (!value) return isEnglish ? 'No data yet' : '아직 데이터 없음'
  return isEnglish ? `~${value} kcal` : `약 ${value}kcal`
}

function getHomeFeedPhotoUrl(post) {
  if (Array.isArray(post?.metadata?.photoUrls) && post.metadata.photoUrls.length) {
    return post.metadata.photoUrls[0]
  }

  if (post?.metadata?.photoUrl) return post.metadata.photoUrl
  return null
}

function getHomeFeedMeta(post, language, isEnglish) {
  if (post?.type !== 'workout_complete') {
    if (post?.type === 'challenge_complete') {
      return isEnglish ? 'Challenge complete' : '챌린지 완료'
    }

    if (post?.type === 'level_up') {
      return isEnglish ? 'Level up' : '레벨 업'
    }

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

  if (post?.type === 'challenge_complete') {
    return isEnglish ? 'Weekly challenge cleared.' : '주간 챌린지를 달성했어요.'
  }

  if (post?.type === 'level_up') {
    return isEnglish ? 'Level up update shared.' : '레벨 업 소식을 공유했어요.'
  }

  return isEnglish ? 'Shared a fresh progress update.' : '새 운동 업데이트를 남겼어요.'
}

function HomeFeedPreviewCard({ post, onSelectUser, onSeeCommunity }) {
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
    <article className="home-feed-preview-card">
      <div className="home-feed-preview-top">
        <button
          type="button"
          className="home-feed-preview-author"
          onClick={() => onSelectUser?.({
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

        <span className="home-feed-preview-time">
          {formatDateTimeByLanguage(post.created_at, language, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
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
            sizes="(max-width: 720px) 92vw, 380px"
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
  achievementBadges = [],
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
  const [selectedFeedTab, setSelectedFeedTab] = useState(
    feedPreview.following?.length ? 'following' : feedPreview.recommended?.length ? 'recommended' : 'popular',
  )

  const nickname = profile?.display_name?.trim()
  const topRoutine = routineTemplates[0] ?? null
  const featuredBadges = achievementBadges.slice(0, 2).map((item) => getBadgeLabel(item.badge_key, language))
  const activityLevelValue = activitySummary?.levelValue ?? 1
  const activityProgress = Math.max(0, Math.min(activitySummary?.progressPercent ?? 0, 100))
  const goalProgress = Math.max(0, Math.min(challenge?.progress ?? 0, 100))

  const heroTitle = todayDone
    ? t('오늘 기록은 이미 있어요.', 'Today already has a saved workout.')
    : t('오늘 운동 한 번만 기록하면 돼요.', 'Today only needs one workout log.')

  const heroDescription = nickname
    ? todayDone
      ? t(
        `${nickname}님, 오늘은 이미 초록불이에요. 이제 이번 주 흐름만 이어가면 충분해요.`,
        `${nickname}, today is already in the green. Keeping the weekly rhythm is enough now.`,
      )
      : t(
        `${nickname}님, 오늘은 길게 하지 않아도 괜찮아요. 종류와 시간만 남겨도 흐름이 이어져요.`,
        `${nickname}, today does not need to be long. Type and time are enough to keep your rhythm going.`,
      )
    : t(
      '운동 종류와 시간만 적어도 오늘의 흐름을 시작할 수 있어요.',
      'Workout type and time are enough to start today’s rhythm.',
    )

  const currentLevelLabel = currentLevel
    ? localizeLevelText(currentLevel, language)
    : t('레벨 테스트 대기', 'Level test pending')

  const recentWorkoutTitle = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : t('아직 기록 없음', 'No workout yet')

  const recentWorkoutMeta = stats.lastWorkoutType
    ? [
      stats.lastWorkoutDuration ? t(`${stats.lastWorkoutDuration}분`, `${stats.lastWorkoutDuration} min`) : null,
      stats.lastWorkoutCalories ? formatCalories(stats.lastWorkoutCalories, isEnglish) : null,
    ].filter(Boolean).join(' · ')
    : t('첫 기록을 남기면 최근 운동이 여기 보일 거예요.', 'Your latest workout will appear here after the first save.')

  const showReminderCard = reminder?.enabled && !todayDone
  const reminderTitle = reminder?.due
    ? t('지금이 오늘 운동 리마인더 시간이에요.', 'It is time for today’s workout reminder.')
    : t(
      `오늘 리마인더는 ${reminder?.reminderTimeLabel}에 울리도록 잡혀 있어요.`,
      `Today’s reminder is set for ${reminder?.reminderTimeLabel}.`,
    )

  const reminderBody = reminder?.due
    ? t(
      '지금 한 번만 기록해도 연속 기록과 주간 흐름이 같이 살아나요.',
      'One workout now is enough to keep both your streak and weekly rhythm alive.',
    )
    : t(
      '너무 복잡하게 보지 않도록, 오늘 다시 돌아올 시간만 잡아뒀어요.',
      'A light nudge is queued up so you can come back without overthinking it.',
    )

  const feedTabs = [
    {
      key: 'following',
      label: t('팔로잉', 'Following'),
      items: feedPreview.following ?? [],
      description: t('팔로잉 중인 사람들의 최근 기록만 먼저 보여줘요.', 'A compact look at people you already follow.'),
    },
    {
      key: 'recommended',
      label: t('추천', 'Recommended'),
      items: feedPreview.recommended ?? [],
      description: t('새로운 사람들의 기록을 가볍게 섞어 보여줘요.', 'A light mix of fresh workout stories.'),
    },
    {
      key: 'popular',
      label: t('인기', 'Popular'),
      items: feedPreview.popular ?? [],
      description: t('반응이 빠르게 붙는 카드만 간단히 보여줘요.', 'A compact view of posts getting reactions.'),
    },
  ]

  const activeFeedSection = feedTabs.find((tab) => tab.key === selectedFeedTab && tab.items.length)
    ?? feedTabs.find((tab) => tab.items.length)
    ?? feedTabs[1]
  const activeFeedTab = activeFeedSection?.key ?? 'recommended'
  const activeFeedItems = activeFeedSection?.items ?? []
  const feedStoryTitle = activeFeedSection?.key === 'following'
    ? t('팔로잉 피드 미리보기', 'Following feed preview')
    : activeFeedSection?.key === 'popular'
      ? t('지금 뜨는 운동 스토리', 'Stories trending now')
      : t('오늘 들어온 새 운동 소식', 'Fresh workout stories for today')
  const feedDescription = activeFeedSection?.description ?? ''

  return (
    <section className="home-dashboard-app streamlined-home home-dashboard-redesign home-dashboard-clean">
      <section className="card home-focus-card home-growth-hero">
        <div className="home-growth-hero-main">
          <div className="home-focus-copy">
            <span className="app-section-kicker">{t('오늘의 액션', 'Today')}</span>
            <h2>{heroTitle}</h2>
            <p>{heroDescription}</p>
          </div>

          <div className="home-focus-actions">
            <button
              type="button"
              className="primary-btn home-focus-btn"
              onClick={onOpenWorkoutComposer}
              disabled={workoutLoading}
            >
              {workoutLoading
                ? t('열고 있어요..', 'Opening...')
                : todayDone
                  ? t('운동 하나 더 기록', 'Log one more workout')
                  : t('오늘 운동 기록하기', 'Log today’s workout')}
            </button>

            {topRoutine ? (
              <button
                type="button"
                className="ghost-btn home-focus-secondary"
                onClick={() => onStartRoutine?.(topRoutine)}
              >
                {t(`루틴 다시 시작 · ${topRoutine.name}`, `Restart routine · ${topRoutine.name}`)}
              </button>
            ) : !currentLevel ? (
              <button
                type="button"
                className="ghost-btn home-focus-secondary"
                onClick={onOpenTest}
              >
                {t('레벨 테스트 먼저 하기', 'Take the level test first')}
              </button>
            ) : null}
          </div>

          <ActivityBadgeStrip badges={featuredBadges} />
        </div>

        <aside className="home-growth-side">
          <div className="home-growth-side-head">
            <span>{t('오늘 보드', 'Daily board')}</span>
            <strong>{todayDone ? t('완료', 'Logged') : t('진행 중', 'In progress')}</strong>
          </div>
          <div className="home-growth-side-grid">
            <MetricPill
              eyebrow={t('주간 목표', 'Weekly goal')}
              value={`${challenge.current}/${challenge.goal}`}
              detail={`${goalProgress}%`}
              tone="cool"
            />
            <MetricPill
              eyebrow={t('오늘 XP', 'Today XP')}
              value={`${activitySummary?.todayXp ?? 0} XP`}
              detail={t('오늘 기록 기준', 'From today’s actions')}
              tone="cool"
            />
            <MetricPill
              eyebrow={t('연속 기록', 'Streak')}
              value={t(`${stats.streak}일`, `${stats.streak} days`)}
              detail={t('흐름 유지 중', 'Rhythm in motion')}
            />
            <MetricPill
              eyebrow={t('현재 레벨', 'Current level')}
              value={currentLevelLabel}
              detail={t(`활동 Lv ${activityLevelValue}`, `Activity Lv ${activityLevelValue}`)}
            />
          </div>
        </aside>
      </section>

      {showReminderCard && (
        <section className={`card home-reminder-card home-reminder-banner ${reminder?.due ? 'due' : ''}`}>
          <div className="home-reminder-copy">
            <span className="app-section-kicker">{t('리마인더', 'Reminder')}</span>
            <h3>{reminderTitle}</h3>
            <p className="subtext">{reminderBody}</p>
          </div>
          <div className="home-reminder-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={onOpenWorkoutComposer}
              disabled={workoutLoading}
            >
              {t('지금 기록하기', 'Log now')}
            </button>
            {reminderPermission !== 'granted' && reminderPermission !== 'unsupported' && (
              <button type="button" className="ghost-btn" onClick={onRequestReminderPermission}>
                {t('브라우저 알림 켜기', 'Enable browser alert')}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="home-growth-grid home-growth-grid-simple">
        <section className="card record-module-card compact activity-card home-growth-card home-growth-card-accent">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{t('핵심 요약', 'Core summary')}</span>
              <h2 className="app-section-title small">{t('지금 바로 봐야 할 것', 'What matters right now')}</h2>
            </div>
            <span className="community-mini-pill accent">{`${activitySummary?.todayXp ?? 0} XP`}</span>
          </div>

          <div className="home-level-track">
            <div>
              <strong>{challenge.title}</strong>
              <p>
                {todayDone
                  ? t('오늘 기록은 끝났어요. 이제 이번 주 흐름만 이어가면 돼요.', 'Today is logged. Now keep the weekly rhythm going.')
                  : t('오늘 한 번만 기록해도 주간 흐름이 바로 이어져요.', 'One saved workout is enough to keep this week moving.')}
              </p>
            </div>
            <span>{`${goalProgress}%`}</span>
          </div>

          <div className="goal-progress-bar">
            <div className="goal-progress-fill" style={{ width: `${goalProgress}%` }} />
          </div>

          <div className="home-insight-grid">
            <InsightStat
              label={t('오늘 XP', 'Today XP')}
              value={`${activitySummary?.todayXp ?? 0} XP`}
              detail={todayDone ? t('오늘 기록 완료', 'Workout saved today') : t('오늘 한 번이면 충분해요', 'One workout is enough')}
            />
            <InsightStat
              label={t('연속 기록', 'Streak')}
              value={t(`${stats.streak}일`, `${stats.streak} days`)}
              detail={t('흐름이 끊기지 않게 유지해보세요', 'Keep the rhythm unbroken')}
            />
            <InsightStat
              label={t('최근 운동', 'Latest workout')}
              value={recentWorkoutTitle}
              detail={recentWorkoutMeta}
            />
          </div>
        </section>

        <section className="card record-module-card compact home-growth-card">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{t('이번 주 리듬', 'Weekly rhythm')}</span>
              <h2 className="app-section-title small">{t('기록보다 흐름에 집중하기', 'Keep the weekly pace simple')}</h2>
            </div>
            <span className="community-mini-pill">{`${challenge.current}/${challenge.goal}`}</span>
          </div>

          <div className="home-level-track">
            <div>
              <strong>{t(`활동 Lv ${activityLevelValue}`, `Activity Lv ${activityLevelValue}`)}</strong>
              <p>
                {activitySummary?.nextLevelValue
                  ? t(
                    `다음 레벨까지 ${activitySummary.remainingXp ?? 0} XP`,
                    `${activitySummary.remainingXp ?? 0} XP to Lv ${activitySummary.nextLevelValue}`,
                  )
                  : t('최고 활동 레벨에 도달했어요.', 'You reached the highest activity level.')}
              </p>
            </div>
            <span>{`${activityProgress}%`}</span>
          </div>

          <div className="goal-progress-bar activity-progress-bar">
            <div
              className="goal-progress-fill activity-progress-fill"
              style={{ width: `${activityProgress}%` }}
            />
          </div>

          <div className="home-insight-grid">
            <InsightStat
              label={t('이번 주 운동', 'Workouts')}
              value={t(`${stats.weeklyCount}회`, `${stats.weeklyCount}`)}
              detail={t('주간 목표 기준', 'Against your weekly goal')}
            />
            <InsightStat
              label={t('주간 포인트', 'Weekly points')}
              value={String(activitySummary?.weeklyPoints ?? 0)}
              detail={t('커뮤니티 랭킹 기준', 'Used on the community board')}
            />
            <InsightStat
              label={t('대표 배지', 'Featured badge')}
              value={featuredBadges[0] ?? t('다음 배지 진행 중', 'Next badge in progress')}
              detail={t('자세한 성장 기록은 기록 탭에서 볼 수 있어요', 'See deeper growth stats in Records')}
            />
          </div>
        </section>
      </section>

      <section className="card home-feed-preview-shell">
        <div className="home-module-heading home-feed-preview-heading">
          <div>
            <span className="app-section-kicker">{t('지금 피드', 'Now in feed')}</span>
            <h3>{feedStoryTitle}</h3>
          </div>
          <button type="button" className="ghost-btn" onClick={onSeeCommunity}>
            {t('커뮤니티 보기', 'See community')}
          </button>
        </div>

        <div className="home-feed-preview-toolbar compact">
          <div className="home-feed-preview-tabs" role="tablist" aria-label={t('홈 피드 필터', 'Home feed filter')}>
            {feedTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`home-feed-preview-tab ${activeFeedTab === tab.key ? 'active' : ''}`}
                onClick={() => setSelectedFeedTab(tab.key)}
                disabled={!tab.items.length}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <p className="subtext compact home-feed-preview-note">{feedDescription}</p>

        {activeFeedItems.length ? (
          <div className="home-feed-preview-grid home-feed-preview-grid-simple">
            {activeFeedItems.slice(0, 2).map((post) => (
              <HomeFeedPreviewCard
                key={post.id}
                post={post}
                onSelectUser={onSelectFeedPreviewUser}
                onSeeCommunity={onSeeCommunity}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state-card cool home-feed-empty">
            <span className="empty-state-badge">{t('피드', 'Feed')}</span>
            <strong>{t('새 기록이 쌓이면 홈 피드가 바로 살아나요.', 'Home feed wakes up as soon as new updates land.')}</strong>
            <p>
              {t(
                '아직 보여줄 카드가 적어요. 운동을 기록하거나 사람들을 팔로우하면 여기부터 채워져요.',
                'There are not enough stories yet. Log a workout or follow a few people and this section fills first.',
              )}
            </p>
            <div className="home-feed-empty-actions">
              <button type="button" className="primary-btn" onClick={onOpenWorkoutComposer}>
                {t('오늘 운동 기록하기', 'Log today’s workout')}
              </button>
              <button type="button" className="ghost-btn" onClick={onSeeCommunity}>
                {t('커뮤니티 둘러보기', 'Browse community')}
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
