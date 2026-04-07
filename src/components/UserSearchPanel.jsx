import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

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

export default function UserSearchPanel({
  query,
  onQueryChange,
  rows,
  loading,
  currentUserId,
  followingIds = [],
  actionLoading,
  onToggleFollow,
  onSelectUser,
}) {
  const { language, isEnglish } = useI18n()
  const trimmedQuery = query.trim()

  return (
    <section className="card community-block-card compact">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Search' : '검색'}</span>
          <h2 className="app-section-title small">{isEnglish ? 'Find People' : '사람 찾기'}</h2>
        </div>
        <span className="community-mini-pill">{trimmedQuery ? (isEnglish ? `${rows.length} results` : `${rows.length}명`) : (isEnglish ? 'Search by nickname' : '닉네임 검색')}</span>
      </div>

      <p className="subtext compact">
        {isEnglish
          ? 'Search by nickname and jump straight into a public profile.'
          : '닉네임으로 찾아서 바로 공개 프로필을 열 수 있어요.'}
      </p>

      <div className="user-search-input-row">
        <input
          className="workout-input settings-input compact"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={isEnglish ? 'Search nickname' : '닉네임 검색'}
        />
        {!!trimmedQuery && (
          <button type="button" className="ghost-btn" onClick={() => onQueryChange('')}>
            {isEnglish ? 'Clear' : '지우기'}
          </button>
        )}
      </div>

      {trimmedQuery.length > 0 && trimmedQuery.length < 2 && (
        <div className="empty-state-card cool user-search-empty">
          <span className="empty-state-badge">{isEnglish ? 'Tip' : '팁'}</span>
          <strong>{isEnglish ? 'Type at least 2 characters.' : '2글자 이상 입력해보세요.'}</strong>
        </div>
      )}

      {loading && trimmedQuery.length >= 2 && (
        <div className="skeleton-stack compact">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-row">
                <span className="skeleton-avatar" />
                <div className="skeleton-copy">
                  <span className="skeleton-line medium" />
                  <span className="skeleton-line long" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && trimmedQuery.length >= 2 && !rows.length && (
        <div className="empty-state-card cool user-search-empty">
          <span className="empty-state-badge">{isEnglish ? 'No Match' : '검색 결과 없음'}</span>
          <strong>{isEnglish ? 'No users matched that nickname.' : '해당 닉네임과 일치하는 사람이 없어요.'}</strong>
          <p>{isEnglish ? 'Try a shorter keyword or a different spelling.' : '더 짧은 키워드나 다른 철자로 다시 검색해보세요.'}</p>
        </div>
      )}

      {!!rows.length && (
        <div className="suggested-user-list compact">
          {rows.map((item) => {
            const isMe = item.user_id === currentUserId
            const isFollowing = followingIds.includes(item.user_id)

            return (
              <article key={item.user_id} className="suggested-user-card compact">
                <button type="button" className="suggested-user-select-btn" onClick={() => onSelectUser?.(item)}>
                  <div className="suggested-user-top">
                    <UserAvatar
                      className="suggested-user-avatar"
                      imageUrl={item.avatar_url}
                      fallback={item.avatar_emoji || 'RUN'}
                      alt={item.display_name || (isEnglish ? 'Search result' : '검색 결과')}
                    />
                    <div>
                      <strong className="suggested-user-name">{item.display_name}</strong>
                      <p className="suggested-user-meta">
                        {isEnglish
                          ? `${item.weekly_count} this week · ${item.total_workouts} total`
                          : `이번 주 ${item.weekly_count}회 · 누적 ${item.total_workouts}회`}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="suggested-user-tags">
                  <span className="suggested-user-chip">
                    {item.latest_level ? localizeLevelText(item.latest_level, language) : isEnglish ? 'No level yet' : '레벨 없음'}
                  </span>
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
      )}
    </section>
  )
}
