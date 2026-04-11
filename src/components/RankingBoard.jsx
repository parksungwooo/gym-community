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
      className={`follow-chip rounded-full px-4 py-2 text-sm font-black transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${isFollowing ? 'active bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
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
  const [timeframe, setTimeframe] = useState('week')
  const visibleRows = useMemo(() => (expanded ? rows : rows.slice(0, 3)), [expanded, rows])
  const topScore = rows[0]?.weekly_points ?? rows[0]?.total_xp ?? 0

  return (
    <section className="card community-block-card ranking-surface compact community-ranking-redesign product-glass-card rounded-3xl animate-pop">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{t('랭킹', 'Ranking')}</span>
          <h2>{t('이번 주', 'This week')}</h2>
        </div>
        <span className="community-mini-pill accent">{t(`1위 ${topScore}P`, `Top ${topScore} pts`)}</span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 rounded-3xl bg-slate-950/5 p-1 dark:bg-white/10">
        {[
          ['week', t('주간', 'Weekly')],
          ['month', t('월간', 'Monthly')],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`rounded-2xl px-3 py-2 text-sm font-black transition-all ${timeframe === key ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10'}`}
            onClick={() => setTimeframe(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="subtext compact">
        {t(
          '포인트와 운동량 기준이에요.',
          timeframe === 'week' ? 'Based on weekly activity points.' : 'Monthly view blends total XP with recent weekly points.',
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
          <strong>{t('랭킹이 아직 비어 있어요.', 'Ranking is still empty.')}</strong>
          <p>
            {t(
              '기록이 쌓이면 여기 보여요.',
              'Logs will show here.',
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
              className={`ranking-card compact community-ranking-card rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 ${getRankTone(index)} ${
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
                        `${item.weekly_points ?? 0}P · ${item.weekly_count ?? 0}회`,
                        `${item.weekly_points ?? 0} pts · ${item.weekly_count ?? 0} logs`,
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
            ? t('상위 3명', 'Top 3')
            : t(`전체 ${rows.length}`, `All ${rows.length}`)}
        </button>
      )}
    </section>
  )
}
