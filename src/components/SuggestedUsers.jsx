import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function buildReason(item, currentLevel, language) {
  if (currentLevel && item.latest_level === currentLevel) {
    return language === 'en' ? `Same ${localizeLevelText(currentLevel, language)} group` : `같은 ${localizeLevelText(currentLevel, language)} 유저`
  }

  if (item.weekly_count >= 4) {
    return language === 'en' ? 'Active this week' : '이번 주 활발한 유저'
  }

  if (item.total_workouts >= 10) {
    return language === 'en' ? 'Consistent recorder' : '꾸준히 기록 중인 유저'
  }

  return language === 'en' ? 'Suggested for you' : '커뮤니티 추천 유저'
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

  return (
    <section className="card community-block-card compact">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'People' : '사람'}</span>
          <h2 className="app-section-title small">{isEnglish ? 'Suggested Users' : '추천 유저'}</h2>
        </div>
        <span className="community-mini-pill">{isEnglish ? `${rows.length} picks` : `${rows.length}명 추천`}</span>
      </div>

      <p className="subtext compact">
        {isEnglish
          ? 'Start with people close to your level or workout rhythm.'
          : '내 레벨과 리듬에 가까운 사람부터 가볍게 둘러보세요.'}
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
          <span className="empty-state-badge">{isEnglish ? 'Soon' : '곧 채워져요'}</span>
          <strong>{isEnglish ? 'Suggested people will appear here.' : '추천 유저가 여기에 나타날 거예요.'}</strong>
          <p>
            {isEnglish
              ? 'As workout records build up, we will start matching you with people close to your level.'
              : '운동 기록이 조금 더 쌓이면 내 레벨과 리듬에 가까운 사람들을 추천해드릴게요.'}
          </p>
        </div>
      )}

      <div className="suggested-user-list compact">
        {rows.map((item) => {
          const isMe = item.user_id === currentUserId
          const isFollowing = followingIds.includes(item.user_id)

          return (
            <article
              key={item.user_id}
              className={`suggested-user-card compact ${selectedUserId === item.user_id ? 'active' : ''}`}
            >
              <button type="button" className="suggested-user-select-btn" onClick={() => onSelectUser?.(item)}>
                <div className="suggested-user-top">
                  <div className="suggested-user-avatar">{item.avatar_emoji || 'RUN'}</div>
                  <div>
                    <strong className="suggested-user-name">{item.display_name}</strong>
                    <p className="suggested-user-meta">
                      {buildReason(item, currentLevel, language)} · {isEnglish ? `${item.weekly_count} this week` : `이번 주 ${item.weekly_count}회`}
                    </p>
                  </div>
                </div>
              </button>

              <div className="suggested-user-tags">
                <span className="suggested-user-chip">{item.latest_level ? localizeLevelText(item.latest_level, language) : isEnglish ? 'No level yet' : '레벨 미측정'}</span>
                <span className="suggested-user-chip subtle">{isEnglish ? `${item.total_workouts} total` : `누적 ${item.total_workouts}회`}</span>
                <span className="suggested-user-chip subtle">
                  {item.latest_score ? (isEnglish ? `${item.latest_score} pts` : `${item.latest_score}점`) : isEnglish ? 'No score' : '점수 없음'}
                </span>
              </div>

              {!isMe && (
                <FollowButton
                  isFollowing={isFollowing}
                  disabled={actionLoading}
                  isEnglish={isEnglish}
                  onClick={() => onToggleFollow?.(item.user_id, isFollowing)}
                />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
