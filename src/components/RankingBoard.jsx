import { useMemo, useState } from 'react'
import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function getRankTone(index) {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return 'default'
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

export default function RankingBoard({
  rows,
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
  const [expanded, setExpanded] = useState(false)
  const visibleRows = useMemo(() => (expanded ? rows : rows.slice(0, 3)), [expanded, rows])

  return (
    <section className="card community-block-card ranking-surface compact community-ranking-redesign">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{t('보드', 'Board')}</span>
          <h2>{t('주간 활동 랭킹', 'Weekly activity ranking')}</h2>
        </div>
        <span className="community-mini-pill accent">{t('이번 주 상위 활동 회원', 'Top movers')}</span>
      </div>

      <p className="subtext compact">
        {t(
          '이번 주 활동 포인트를 먼저 보고, 그다음 운동량과 체력 신호를 함께 반영한 보드예요.',
          'This board weighs weekly activity points first, then workout volume and fitness signals.',
        )}
      </p>

      {loading && (
        <div className="skeleton-stack">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-row">
                <span className="skeleton-rank" />
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

      {!loading && !rows.length && (
        <div className="empty-state-card warm">
          <span className="empty-state-badge">{t('랭킹 준비 중', 'Ranking loading up')}</span>
          <strong>{t('이번 주 보드가 아직 비어 있어요.', 'The weekly board is still empty.')}</strong>
          <p>
            {t(
              '기록과 포인트가 더 쌓이면 여기부터 커뮤니티 열기가 만들어질 거예요.',
              'As more logs and points stack up, the community energy will start here.',
            )}
          </p>
        </div>
      )}

      <div className="ranking-list">
        {visibleRows.map((item, index) => {
          const isMe = item.user_id === currentUserId
          const isFollowing = followingIds.includes(item.user_id)

          return (
            <article
              key={item.user_id}
              className={`ranking-card compact community-ranking-card ${getRankTone(index)} ${
                selectedUserId === item.user_id ? 'active' : ''
              }`}
            >
              <button type="button" className="ranking-select-btn" onClick={() => onSelectUser?.(item)}>
                <div className="ranking-left">
                  <div className="ranking-rank">#{index + 1}</div>
                  <UserAvatar
                    className="ranking-avatar"
                    imageUrl={item.avatar_url}
                    fallback={item.avatar_emoji || 'RUN'}
                    alt={item.display_name || (isEnglish ? 'Ranked user' : '랭킹 사용자')}
                  />
                  <div>
                    <strong className="ranking-name">{item.display_name}</strong>
                    <p className="ranking-meta">
                      {t(
                        `주간 ${item.weekly_points ?? 0}P · ${item.weekly_count ?? 0}회 운동`,
                        `${item.weekly_points ?? 0} pts · ${item.weekly_count ?? 0} workouts`,
                      )}
                    </p>
                  </div>
                </div>

                <div className="ranking-score">
                  <strong>{`Lv ${item.activity_level ?? 1}`}</strong>
                  <span>
                    {item.latest_level
                      ? localizeLevelText(item.latest_level, language)
                      : t(`총 ${item.total_xp ?? 0} XP`, `${item.total_xp ?? 0} XP total`)}
                  </span>
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
            </article>
          )
        })}
      </div>

      {!loading && rows.length > 3 && (
        <button
          type="button"
          className="ghost-btn compact-toggle-btn"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? t('상위 3명만 보기', 'Show top 3')
            : t(`전체 랭킹 보기 (${rows.length}명)`, `See full ranking (${rows.length})`)}
        </button>
      )}
    </section>
  )
}
