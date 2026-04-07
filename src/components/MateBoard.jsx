import { useMemo, useState } from 'react'
import UserAvatar from './UserAvatar'

const WORKOUT_OPTIONS = ['all', '러닝', '웨이트', '사이클', '스트레칭', '산책', '기타']

const TIME_SLOT_OPTIONS = [
  { value: 'weekday_morning', ko: '평일 아침', en: 'Weekday morning' },
  { value: 'weekday_evening', ko: '평일 저녁', en: 'Weekday evening' },
  { value: 'weekend_morning', ko: '주말 아침', en: 'Weekend morning' },
  { value: 'weekend_evening', ko: '주말 저녁', en: 'Weekend evening' },
  { value: 'flexible', ko: '시간 조율 가능', en: 'Flexible' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', ko: '초급', en: 'Beginner' },
  { value: 'steady', ko: '중급', en: 'Steady' },
  { value: 'intense', ko: '고강도', en: 'Intense' },
]

function formatTimeSlot(value, isEnglish) {
  const matched = TIME_SLOT_OPTIONS.find((item) => item.value === value)
  if (!matched) return value || (isEnglish ? 'Flexible' : '시간 조율 가능')
  return isEnglish ? matched.en : matched.ko
}

function formatDifficulty(value, isEnglish) {
  const matched = DIFFICULTY_OPTIONS.find((item) => item.value === value)
  if (!matched) return isEnglish ? 'Beginner' : '초급'
  return isEnglish ? matched.en : matched.ko
}

function formatMateDate(value, isEnglish) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  } catch {
    return value.slice(0, 10)
  }
}

function createInitialDraft() {
  return {
    title: '',
    workoutType: '러닝',
    locationLabel: '',
    timeSlot: 'weekday_evening',
    difficulty: 'beginner',
    capacity: 2,
    body: '',
  }
}

export default function MateBoard({
  isEnglish,
  posts = [],
  loading,
  actionLoading,
  currentUserId,
  onCreatePost,
  onToggleInterest,
  onToggleStatus,
  onSelectUser,
}) {
  const t = (ko, en) => (isEnglish ? en : ko)
  const [scope, setScope] = useState('open')
  const [workoutFilter, setWorkoutFilter] = useState('all')
  const [showComposer, setShowComposer] = useState(false)
  const [draft, setDraft] = useState(createInitialDraft)

  const filteredPosts = useMemo(() => {
    return posts.filter((item) => {
      const matchesScope = scope === 'all'
        || (scope === 'open' && item.status === 'open')
        || (scope === 'mine' && item.user_id === currentUserId)
        || (scope === 'closed' && item.status === 'closed')
      const matchesWorkout = workoutFilter === 'all' || item.workout_type === workoutFilter
      return matchesScope && matchesWorkout
    })
  }, [currentUserId, posts, scope, workoutFilter])

  const openCount = posts.filter((item) => item.status === 'open').length

  const handleDraftChange = (key, value) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = await onCreatePost?.(draft)
    if (result === false) return
    setDraft(createInitialDraft())
    setShowComposer(false)
  }

  return (
    <section className="card community-block-card compact mate-board-shell">
      <div className="app-section-heading compact mate-board-header">
        <div>
          <span className="app-section-kicker">{t('메이트', 'Mates')}</span>
          <h2 className="app-section-title small">{t('같이 운동할 사람을 찾아보세요', 'Find someone to work out with')}</h2>
        </div>
        <div className="mate-board-header-actions">
          <span className="community-mini-pill accent">
            {isEnglish ? `${openCount} open` : `모집 중 ${openCount}`}
          </span>
          <button
            type="button"
            className={`secondary-btn compact-toggle-btn ${showComposer ? 'active' : ''}`}
            onClick={() => setShowComposer((prev) => !prev)}
            disabled={actionLoading}
          >
            {showComposer ? t('닫기', 'Close') : t('모집글 작성', 'Post request')}
          </button>
        </div>
      </div>

      <p className="subtext compact">
        {t(
          '지역, 시간대, 운동 스타일만 간단히 적고 함께 운동할 사람을 찾아보세요.',
          'Share a place, time, and workout style to recruit a simple workout partner post.',
        )}
      </p>

      {showComposer && (
        <form className="mate-compose-card" onSubmit={handleSubmit}>
          <div className="mate-compose-grid">
            <input
              className="workout-input settings-input compact"
              value={draft.title}
              onChange={(event) => handleDraftChange('title', event.target.value)}
              placeholder={t('예: 망원 한강 저녁 러닝 같이 하실 분', 'ex: Evening river run in Mangwon')}
              maxLength={60}
              required
            />
            <input
              className="workout-input settings-input compact"
              value={draft.locationLabel}
              onChange={(event) => handleDraftChange('locationLabel', event.target.value)}
              placeholder={t('예: 망원동 / 합정역 근처', 'ex: Mangwon / near Hapjeong')}
              maxLength={40}
              required
            />
            <select
              className="workout-select compact"
              value={draft.workoutType}
              onChange={(event) => handleDraftChange('workoutType', event.target.value)}
            >
              {WORKOUT_OPTIONS.filter((item) => item !== 'all').map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              className="workout-select compact"
              value={draft.timeSlot}
              onChange={(event) => handleDraftChange('timeSlot', event.target.value)}
            >
              {TIME_SLOT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {isEnglish ? item.en : item.ko}
                </option>
              ))}
            </select>
            <select
              className="workout-select compact"
              value={draft.difficulty}
              onChange={(event) => handleDraftChange('difficulty', event.target.value)}
            >
              {DIFFICULTY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {isEnglish ? item.en : item.ko}
                </option>
              ))}
            </select>
            <input
              className="workout-input settings-input compact"
              type="number"
              min="1"
              max="20"
              value={draft.capacity}
              onChange={(event) => handleDraftChange('capacity', event.target.value)}
              placeholder={t('모집 인원', 'Spots')}
            />
          </div>

          <textarea
            className="workout-textarea settings-textarea compact"
            rows="3"
            maxLength={180}
            value={draft.body}
            onChange={(event) => handleDraftChange('body', event.target.value)}
            placeholder={t('한줄 분위기, 운동 강도, 준비물 등을 적어보세요.', 'Share the vibe, intensity, or anything to prepare.')}
          />

          <div className="mate-compose-actions">
            <button type="submit" className="primary-btn" disabled={actionLoading}>
              {t('메이트 모집 올리기', 'Post mate request')}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setDraft(createInitialDraft())
                setShowComposer(false)
              }}
              disabled={actionLoading}
            >
              {t('취소', 'Cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="mate-filter-row">
        <div className="mate-filter-group">
          {[
            { key: 'open', label: t('모집 중', 'Open') },
            { key: 'mine', label: t('내 글', 'Mine') },
            { key: 'closed', label: t('마감', 'Closed') },
            { key: 'all', label: t('전체', 'All') },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`feed-filter-chip compact ${scope === item.key ? 'active' : ''}`}
              onClick={() => setScope(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mate-filter-group workout">
          {WORKOUT_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`feed-filter-chip compact ${workoutFilter === item ? 'active' : ''}`}
              onClick={() => setWorkoutFilter(item)}
            >
              {item === 'all' ? t('운동 전체', 'All workouts') : item}
            </button>
          ))}
        </div>
      </div>

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
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !filteredPosts.length && (
        <div className="empty-state-card mate-empty-card">
          <span className="empty-state-badge">{t('첫 모집글', 'First post')}</span>
          <strong>{t('아직 조건에 맞는 모집글이 없어요.', 'No mate posts match this filter yet.')}</strong>
          <p>
            {t(
              '시간대와 장소를 간단히 적고 먼저 모집글을 올려보세요. 함께 운동할 사람을 더 쉽게 찾을 수 있어요.',
              'Share your time and area first. It makes it easier to find someone from the community.',
            )}
          </p>
        </div>
      )}

      <div className="mate-post-list">
        {filteredPosts.map((post) => {
          const isMine = post.user_id === currentUserId
          const isClosed = post.status === 'closed'
          const canShowInterest = !isMine && !isClosed

          return (
            <article key={post.id} className={`mate-post-card ${isClosed ? 'closed' : ''}`}>
              <div className="mate-post-header">
                <button
                  type="button"
                  className="mate-author-btn"
                  onClick={() => onSelectUser?.({
                    user_id: post.user_id,
                    display_name: post.display_name,
                    avatar_emoji: post.avatar_emoji,
                    avatar_url: post.avatar_url,
                  })}
                >
                  <UserAvatar
                    className="mate-author-avatar"
                    imageUrl={post.avatar_url}
                    fallback={post.avatar_emoji || 'RUN'}
                    alt={post.display_name || (isEnglish ? 'Mate author' : '메이트 작성자')}
                  />
                  <div className="mate-author-copy">
                    <strong>{post.display_name || (isEnglish ? 'Community member' : '커뮤니티 멤버')}</strong>
                    <span>{isEnglish ? post.activity_level_label : `Lv ${post.activity_level ?? 1}`}</span>
                  </div>
                </button>

                <div className="mate-post-statuses">
                  {isMine && <span className="community-mini-pill">{t('내 글', 'Mine')}</span>}
                  <span className={`mate-status-pill ${isClosed ? 'closed' : 'open'}`}>
                    {isClosed ? t('마감', 'Closed') : t('모집 중', 'Open')}
                  </span>
                </div>
              </div>

              <div className="mate-post-copy">
                <h3>{post.title}</h3>
                <p>{post.location_label}</p>
              </div>

              <div className="mate-pill-row">
                <span className="community-score-pill accent">{post.workout_type}</span>
                <span className="community-score-pill subtle">{formatTimeSlot(post.time_slot, isEnglish)}</span>
                <span className="community-score-pill subtle">{formatDifficulty(post.difficulty, isEnglish)}</span>
                <span className="community-score-pill warm">
                  {isEnglish ? `${post.capacity} spots` : `${post.capacity}명 모집`}
                </span>
              </div>

              {post.body && (
                <p className="mate-post-body">{post.body}</p>
              )}

              <div className="mate-post-footer">
                <div className="mate-post-meta">
                  <span>{formatMateDate(post.created_at, isEnglish)}</span>
                  <strong>{isEnglish ? `${post.interest_count} interested` : `관심 ${post.interest_count}`}</strong>
                </div>

                <div className="mate-post-actions">
                  {canShowInterest && (
                    <button
                      type="button"
                      className={`ghost-btn ${post.interested_by_me ? 'active' : ''}`}
                      disabled={actionLoading}
                      onClick={() => onToggleInterest?.(post.id, post.interested_by_me)}
                    >
                      {post.interested_by_me
                        ? t('관심 취소', 'Undo interest')
                        : t('관심 보내기', 'Send interest')}
                    </button>
                  )}

                  {isMine && !isClosed && (
                    <button
                      type="button"
                      className="ghost-btn"
                      disabled={actionLoading}
                      onClick={() => onToggleStatus?.(post.id, 'closed')}
                    >
                      {t('모집 마감', 'Close post')}
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
