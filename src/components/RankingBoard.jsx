import { useMemo, useState } from 'react'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function getRankTone(index) {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return 'default'
}

export default function RankingBoard({ rows, loading, selectedUserId, onSelectUser }) {
  const { language, isEnglish } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const visibleRows = useMemo(() => (expanded ? rows : rows.slice(0, 3)), [expanded, rows])

  return (
    <section className="card community-block-card ranking-surface compact">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Board' : '보드'}</span>
          <h2>{isEnglish ? 'Weekly Ranking' : '주간 랭킹'}</h2>
        </div>
        <span className="community-mini-pill accent">{isEnglish ? 'Top movers' : '상위 기록'}</span>
      </div>
      <p className="subtext compact">
        {isEnglish
          ? 'Start with the top users, then expand when you want the full board.'
          : '먼저 상위 유저만 보고, 필요할 때 전체 랭킹을 펼쳐보세요.'}
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
          <span className="empty-state-badge">{isEnglish ? 'Ranking' : '랭킹 준비 중'}</span>
          <strong>{isEnglish ? 'The weekly board is still empty.' : '주간 랭킹이 아직 비어 있어요.'}</strong>
          <p>
            {isEnglish
              ? 'Once more people log workouts this week, the ranking board will start to fill in.'
              : '이번 주 운동 기록이 조금 더 쌓이면 상위 기록 보드가 자연스럽게 채워질 거예요.'}
          </p>
        </div>
      )}

      <div className="ranking-list">
        {visibleRows.map((item, index) => (
          <button
            key={item.user_id}
            type="button"
            className={`ranking-card compact ${getRankTone(index)} ${selectedUserId === item.user_id ? 'active' : ''}`}
            onClick={() => onSelectUser?.(item)}
          >
            <div className="ranking-left">
              <div className="ranking-rank">#{index + 1}</div>
              <div className="ranking-avatar">{item.avatar_emoji || 'RUN'}</div>
              <div>
                <strong className="ranking-name">{item.display_name}</strong>
                <p className="ranking-meta">
                  {isEnglish
                    ? `${item.weekly_count} this week · ${item.total_workouts} total`
                    : `이번 주 ${item.weekly_count}회 · 누적 ${item.total_workouts}회`}
                </p>
              </div>
            </div>
            <div className="ranking-score">
              <strong>{item.latest_score ? (isEnglish ? `${item.latest_score} pts` : `${item.latest_score}점`) : isEnglish ? 'No score' : '점수 없음'}</strong>
              <span>{item.latest_level ? localizeLevelText(item.latest_level, language) : isEnglish ? 'No level yet' : '레벨 미측정'}</span>
            </div>
          </button>
        ))}
      </div>

      {!loading && rows.length > 3 && (
        <button type="button" className="ghost-btn compact-toggle-btn" onClick={() => setExpanded((prev) => !prev)}>
          {expanded
            ? isEnglish
              ? 'Show Top 3'
              : '상위 3명만 보기'
            : isEnglish
              ? `See Full Ranking (${rows.length})`
              : `전체 랭킹 보기 (${rows.length}명)`}
        </button>
      )}
    </section>
  )
}

