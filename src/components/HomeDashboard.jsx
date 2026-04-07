import { useState } from 'react'
import { formatDateTimeByLanguage, getWorkoutTypeLabel, useI18n } from '../i18n.js'
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
    if (post?.type === 'challenge_complete') return isEnglish ? 'Challenge complete' : '챌린지 완료'
    if (post?.type === 'level_up') return isEnglish ? 'Level up' : '레벨 업'
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
            })
          }
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
  const activityLevelValue = activitySummary?.levelValue ?? 1
  const goalProgress = Math.max(0, Math.min(challenge?.progress ?? 0, 100))

  const heroTitle = todayDone
    ? t('오늘 기록은 이미 있어요', 'Today already has a saved workout.')
    : t('오늘은 한 번만 기록해도 충분해요', 'Today only needs one workout log.')

  const heroDescription = nickname
    ? todayDone
      ? t(
          `${nickname}님은 오늘 기록을 이미 남겼어요. 이제 이번 주 페이스만 유지하면 충분해요.`,
          `${nickname}, today is already in the green. Keeping the weekly rhythm is enough now.`,
        )
      : t(
          `${nickname}님, 길게 하지 않아도 괜찮아요. 운동 종류와 시간만 남겨도 오늘 기록은 충분해요.`,
          `${nickname}, today does not need to be long. Type and time are enough to keep your rhythm going.`,
        )
    : t(
        '운동 종류와 시간만 적어도 오늘 기록은 시작할 수 있어요.',
        'Workout type and time are enough to start today’s rhythm.',
      )

  const recentWorkoutTitle = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : t('아직 기록 없음', 'No workout yet')

  const recentWorkoutMeta = stats.lastWorkoutType
    ? [
        stats.lastWorkoutDuration ? t(`${stats.lastWorkoutDuration}분`, `${stats.lastWorkoutDuration} min`) : null,
        stats.lastWorkoutCalories ? formatCalories(stats.lastWorkoutCalories, isEnglish) : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : t('첫 운동을 남기면 가장 최근 운동이 여기에 보여요.', 'Your latest workout will appear here after the first save.')

  const showReminderInline = reminder?.enabled && !todayDone
  const reminderTitle = reminder?.due
    ? t('지금이 오늘 운동 리마인더 시간이에요', 'It is time for today’s workout reminder.')
    : t(
        `오늘 리마인더는 ${reminder?.reminderTimeLabel}에 울리도록 설정돼 있어요.`,
        `Today’s reminder is set for ${reminder?.reminderTimeLabel}.`,
      )

  const reminderBody = reminder?.due
    ? t(
        '지금 한 번만 기록해도 연속 기록과 주간 목표를 같이 지킬 수 있어요.',
        'One workout now is enough to keep both your streak and weekly rhythm alive.',
      )
    : t(
        '복잡하게 생각하지 않도록 다시 돌아올 시간을 미리 잡아두었어요.',
        'A light nudge is queued up so you can come back without overthinking it.',
      )

  const feedTabs = [
    {
      key: 'following',
      label: t('팔로잉', 'Following'),
      items: feedPreview.following ?? [],
    },
    {
      key: 'recommended',
      label: t('추천', 'Recommended'),
      items: feedPreview.recommended ?? [],
    },
    {
      key: 'popular',
      label: t('인기', 'Popular'),
      items: feedPreview.popular ?? [],
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
      ? t('지금 반응이 오는 운동 이야기', 'Stories trending now')
      : t('오늘 둘러볼 새 운동 이야기', 'Fresh workout stories for today')

  return (
    <section className="home-dashboard-app streamlined-home home-dashboard-redesign home-dashboard-clean">
      <section className="card home-focus-card home-growth-hero">
        <div className="home-growth-hero-main">
          <div className="home-focus-copy">
            <span className="app-section-kicker">{t('오늘 액션', 'Today')}</span>
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
                ? t('열고 있어요', 'Opening...')
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
              <button type="button" className="ghost-btn home-focus-secondary" onClick={onOpenTest}>
                {t('레벨 테스트 먼저 하기', 'Take the level test first')}
              </button>
            ) : null}
          </div>

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
              eyebrow={t('연속 기록', 'Streak')}
              value={t(`${stats.streak}일`, `${stats.streak} days`)}
              detail={t('꾸준함 유지 중', 'Rhythm in motion')}
            />
            <MetricPill
              eyebrow={t('오늘 XP', 'Today XP')}
              value={`${activitySummary?.todayXp ?? 0} XP`}
              detail={t(`활동 Lv ${activityLevelValue}`, `Activity Lv ${activityLevelValue}`)}
              tone="cool"
            />
          </div>
        </aside>
      </section>

      <section className="card record-module-card compact activity-card home-summary-panel">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{t('이번 주 체크', 'Weekly check')}</span>
            <h2 className="app-section-title small">{t('지금 중요한 것만 보기', 'Only the essentials right now')}</h2>
          </div>
          <span className="community-mini-pill">{`${challenge.current}/${challenge.goal}`}</span>
        </div>

        <div className="home-level-track">
          <div>
            <strong>{challenge.title}</strong>
            <p>
              {todayDone
                ? t('오늘 기록은 끝났어요. 이제 이번 주 페이스만 유지하면 돼요.', 'Today is logged. Now keep the weekly rhythm going.')
                : t('오늘 한 번만 기록해도 이번 주 페이스를 다시 찾을 수 있어요.', 'One saved workout is enough to keep this week moving.')}
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
            detail={todayDone ? t('오늘 운동 저장 완료', 'Workout saved today') : t('오늘 한 번이면 충분해요', 'One workout is enough')}
          />
          <InsightStat
            label={t('연속 기록', 'Streak')}
            value={t(`${stats.streak}일`, `${stats.streak} days`)}
            detail={t('꾸준히 이어가는 게 가장 중요해요', 'Keep the rhythm unbroken')}
          />
          <InsightStat
            label={t('최근 운동', 'Latest workout')}
            value={recentWorkoutTitle}
            detail={recentWorkoutMeta}
          />
        </div>
      </section>

      <section className="card home-feed-preview-shell compact-home-feed">
        <div className="home-module-heading home-feed-preview-heading">
          <div>
            <span className="app-section-kicker">{t('지금 피드', 'Now in feed')}</span>
            <h3>{feedStoryTitle}</h3>
          </div>
          <button type="button" className="ghost-btn" onClick={onSeeCommunity}>
            {t('커뮤니티 보기', 'See community')}
          </button>
        </div>

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

        {activeFeedItems.length ? (
          <div className="home-feed-preview-grid home-feed-preview-grid-single">
            {activeFeedItems.slice(0, 1).map((post) => (
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
                '아직 보여줄 카드가 적어요. 운동을 기록하거나 몇 명을 팔로우하면 이 영역이 가장 먼저 채워져요.',
                'There are not enough stories yet. Log a workout or follow a few people and this section fills first.',
              )}
            </p>
            <div className="home-feed-empty-actions">
              <button type="button" className="primary-btn" onClick={onOpenWorkoutComposer}>
                {t('오늘 운동 기록하기', 'Log today’s workout')}
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
