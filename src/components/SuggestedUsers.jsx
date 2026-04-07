import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function buildReason(item, currentLevel, language) {
  if (currentLevel && item.latest_level === currentLevel) {
    return language === 'en'
      ? `Same ${localizeLevelText(currentLevel, language)} circle`
      : `${localizeLevelText(currentLevel, language)} 그룹`
  }

  if ((item.weekly_points ?? 0) >= 60) {
    return language === 'en' ? 'Strong activity this week' : '이번 주 활동이 아주 좋아요'
  }

  if ((item.weekly_count ?? 0) >= 4) {
    return language === 'en' ? 'Keeping a weekly rhythm' : '이번 주 꾸준히 운동 중'
  }

  if ((item.total_workouts ?? 0) >= 10) {
    return language === 'en' ? 'Already building a habit' : '꾸준히 운동하는 사람'
  }

  return language === 'en' ? 'Recommended for your pace' : '지금 페이스와 잘 맞는 추천'
}

function FollowButton({ isFollowing, disabled, onClick, isEnglish }) {
  return (
    <button
      type="button"
      className={`follow-chip ${isFollowing ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {isFollowing ? (isEnglish ? 'Following' : '팔로잉') : (isEnglish ? 'Follow' : '팔로우')}
    </button>
  )
}

function Insight({ label, value }) {
  return (
    <article className="community-insight-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default function SuggestedUsers({
  rows,
  currentLevel,
  loading,
  selectedUserId,
  onSelectUser,
  currentUserId,
  followingIds = [],
  onToggleFollow,
  actionLoading,
}) {
  const { language, isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)

  return (
    <section className="card community-block-card compact community-people-surface">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{t('사람', 'People')}</span>
          <h2 className="app-section-title small">{t('함께 운동하기 좋은 사람', 'People to move with')}</h2>
        </div>
        <span className="community-mini-pill">{isEnglish ? `${rows.length} picks` : `${rows.length}명 추천`}</span>
      </div>

      <p className="subtext compact">
        {t(
          '지금 내 레벨과 운동 페이스가 비슷한 사람부터 가볍게 연결해보세요.',
          'Start with people who feel close to your current level and rhythm.',
        )}
      </p>

      {loading && (
        <div className="skeleton-stack compact">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-row">
                <span className="skeleton-avatar" />
                <div className="skeleton-copy">
                  <span className="skeleton-line medium" />
                  <span className="skeleton-line long" />
                </div>
              </div>
              <div className="skeleton-tag-row">
                <span className="skeleton-chip" />
                <span className="skeleton-chip wide" />
                <span className="skeleton-chip" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !rows.length && (
        <div className="empty-state-card">
          <span className="empty-state-badge">{t('곧 채워져요', 'Coming soon')}</span>
          <strong>{t('추천할 사람이 여기에 나타날 거예요.', 'Suggested people will appear here.')}</strong>
          <p>
            {t(
              '운동 기록이 조금만 더 쌓이면 비슷한 페이스의 사람을 골라서 보여드릴게요.',
              'Once a few more workout logs stack up, we will start matching people with a similar pace.',
            )}
          </p>
        </div>
      )}

      <div className="suggested-user-list compact community-spotlight-grid">
        {rows.map((item) => {
          const isMe = item.user_id === currentUserId
          const isFollowing = followingIds.includes(item.user_id)
          const levelLabel = item.latest_level
            ? localizeLevelText(item.latest_level, language)
            : t('레벨 준비 중', 'Level pending')

          return (
            <article
              key={item.user_id}
              className={`suggested-user-card compact community-spotlight-card ${
                selectedUserId === item.user_id ? 'active' : ''
              }`}
            >
              <div className="community-spotlight-top">
                <button
                  type="button"
                  className="suggested-user-select-btn community-spotlight-select"
                  onClick={() => onSelectUser?.(item)}
                >
                  <div className="suggested-user-top">
                    <UserAvatar
                      className="suggested-user-avatar"
                      imageUrl={item.avatar_url}
                      fallback={item.avatar_emoji || 'RUN'}
                      alt={item.display_name || (isEnglish ? 'Suggested user' : '추천 유저')}
                    />
                    <div className="community-spotlight-copy">
                      <strong className="suggested-user-name">{item.display_name}</strong>
                      <p className="suggested-user-meta">{buildReason(item, currentLevel, language)}</p>
                    </div>
                  </div>
                </button>

                {!isMe && (
                  <FollowButton
                    isFollowing={isFollowing}
                    disabled={actionLoading}
                    isEnglish={isEnglish}
                    onClick={() => onToggleFollow?.(item.user_id, isFollowing)}
                  />
                )}
              </div>

              <div className="community-score-strip">
                <span className="community-score-pill accent">{`Lv ${item.activity_level ?? 1}`}</span>
                <span className="community-score-pill warm">
                  {t(`${item.weekly_points ?? 0}P 이번 주`, `${item.weekly_points ?? 0} pts this week`)}
                </span>
                <span className="community-score-pill subtle">{levelLabel}</span>
              </div>

              <div className="community-insight-grid">
                <Insight
                  label={t('이번 주 운동', 'This week')}
                  value={t(`${item.weekly_count ?? 0}회`, `${item.weekly_count ?? 0}`)}
                />
                <Insight
                  label={t('누적 운동', 'All-time')}
                  value={t(`${item.total_workouts ?? 0}회`, `${item.total_workouts ?? 0}`)}
                />
                <Insight
                  label={t('총 XP', 'Total XP')}
                  value={`${item.total_xp ?? 0} XP`}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
