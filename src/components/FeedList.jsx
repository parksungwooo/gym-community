import { useState } from 'react'
import { formatDateTimeByLanguage, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { getLevelLabel, localizeLevelText } from '../utils/level'

const FILTERS = {
  ko: [
    { key: 'all', label: '전체' },
    { key: 'same_level', label: '내 레벨' },
    { key: 'workout_complete', label: '운동' },
    { key: 'level_up', label: '레벨업' },
    { key: 'profile_update', label: '프로필' },
    { key: 'challenge_complete', label: '챌린지' },
  ],
  en: [
    { key: 'all', label: 'All' },
    { key: 'same_level', label: 'My Level' },
    { key: 'workout_complete', label: 'Workout' },
    { key: 'level_up', label: 'Level Up' },
    { key: 'profile_update', label: 'Profile' },
    { key: 'challenge_complete', label: 'Challenge' },
  ],
}

function shortUser(userId, displayName, isEnglish) {
  if (displayName) return displayName
  if (!userId) return isEnglish ? 'Guest' : '게스트'
  return `${isEnglish ? 'Guest' : '게스트'}-${userId.slice(0, 6)}`
}

function getPostContent(post, language) {
  const isEnglish = language === 'en'

  switch (post.type) {
    case 'workout_complete': {
      const workoutType = getWorkoutTypeLabel(post.metadata?.workoutType, language)
      const durationText = post.metadata?.durationMinutes ? isEnglish ? ` ${post.metadata.durationMinutes} min` : ` ${post.metadata.durationMinutes}분` : ''
      const noteText = post.metadata?.note ? ` · ${post.metadata.note}` : ''
      return isEnglish ? `${workoutType}${durationText} completed 💪${noteText}` : `${workoutType}${durationText} 운동 완료 💪${noteText}`
    }
    case 'test_result':
      return isEnglish
        ? `Logged a fitness test result: ${localizeLevelText(post.metadata?.level, language)} (${post.metadata?.score ?? 0} pts).`
        : `체력 테스트 결과 ${localizeLevelText(post.metadata?.level, language)} (${post.metadata?.score ?? 0}점)를 기록했어요.`
    case 'level_up':
      return `${getLevelLabel(post.metadata?.from, language)} -> ${getLevelLabel(post.metadata?.to, language)} ${isEnglish ? 'level up' : '상승'} 🎉`
    case 'profile_update':
      return isEnglish ? 'Updated profile and weekly goal ✨' : '프로필과 주간 목표를 업데이트했어요 ✨'
    case 'challenge_complete':
      return isEnglish ? `Completed the weekly ${post.metadata?.goal ?? 0}-workout challenge 🏅` : `주간 ${post.metadata?.goal ?? 0}회 운동 챌린지를 달성했어요 🏅`
    default:
      return post.content
  }
}

function FeedCard({ post, onToggleLike, onSubmitComment }) {
  const { language, isEnglish } = useI18n()
  const [comment, setComment] = useState('')
  const [commentOpen, setCommentOpen] = useState(false)
  const typeLabelMap = {
    workout_complete: isEnglish ? 'Workout' : '운동',
    level_up: isEnglish ? 'Level Up' : '레벨업',
    profile_update: isEnglish ? 'Profile' : '프로필',
    challenge_complete: isEnglish ? 'Challenge' : '챌린지',
    test_result: isEnglish ? 'Test' : '테스트',
  }

  const submitComment = async (event) => {
    event.preventDefault()
    if (!comment.trim()) return
    await onSubmitComment(post.id, comment)
    setComment('')
    setCommentOpen(false)
  }

  return (
    <article className={`feed-card compact feed-card-${post.type}`}>
      <div className="feed-header">
        <div className="feed-author">
          <div className="feed-author-copy">
            <span className="feed-author-name">{shortUser(post.user_id, post.authorDisplayName, isEnglish)}</span>
            <div className="feed-badge-row">
              <span className="feed-type-chip">{typeLabelMap[post.type] ?? (isEnglish ? 'Update' : '업데이트')}</span>
            </div>
          </div>
          <div className="feed-meta-row">
            <span className="feed-level-chip">{post.authorLevel ? localizeLevelText(post.authorLevel, language) : isEnglish ? 'No level yet' : '레벨 미측정'}</span>
            <span>{formatDateTimeByLanguage(post.created_at, language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
      <p className="feed-content compact">{getPostContent(post, language)}</p>

      <div className="feed-stats-row compact">
        <span>{isEnglish ? `Likes ${post.likeCount}` : `좋아요 ${post.likeCount}`}</span>
        <span>{isEnglish ? `Comments ${post.comments.length}` : `댓글 ${post.comments.length}`}</span>
      </div>

      <div className="feed-actions compact">
        <button type="button" className={`like-btn ${post.likedByMe ? 'liked' : ''}`} onClick={() => onToggleLike(post.id, post.likedByMe)}>
          {post.likedByMe ? (isEnglish ? 'Liked' : '좋아요') : (isEnglish ? 'Like' : '좋아요')}
        </button>
        <button type="button" className="comment-toggle-btn" onClick={() => setCommentOpen((prev) => !prev)}>
          {commentOpen ? (isEnglish ? 'Close' : '닫기') : (isEnglish ? 'Comment' : '댓글')}
        </button>
      </div>

      {commentOpen && (
        <form className="comment-form compact" onSubmit={submitComment}>
          <input
            type="text"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={isEnglish ? 'Leave a short comment' : '짧은 댓글 남기기'}
            maxLength={120}
          />
          <button type="submit">{isEnglish ? 'Send' : '등록'}</button>
        </form>
      )}

      {!!post.comments.length && (
        <ul className="comment-list compact">
          {post.comments.map((item) => (
            <li key={item.id}>
              <strong>{shortUser(item.user_id, null, isEnglish)}</strong>
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default function FeedList({ posts, onToggleLike, onSubmitComment, loading, currentLevel, selectedUser, onClearSelectedUser }) {
  const { language, isEnglish } = useI18n()
  const [filter, setFilter] = useState('all')

  const visiblePosts = posts.filter((post) => {
    if (selectedUser?.user_id && post.user_id !== selectedUser.user_id) return false
    if (filter === 'all') return true
    if (filter === 'same_level') return Boolean(currentLevel) && post.authorLevel === currentLevel
    return post.type === filter
  })

  return (
    <section className="card community-feed-surface compact">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Feed' : '피드'}</span>
          <h2>{isEnglish ? 'Community Feed' : '커뮤니티 피드'}</h2>
        </div>
        <span className="community-mini-pill">{isEnglish ? `${visiblePosts.length} posts` : `${visiblePosts.length}개`}</span>
      </div>
      <p className="subtext compact">{isEnglish ? 'See today’s workout flow.' : '오늘 운동 흐름을 보세요.'}</p>

      {selectedUser?.user_id && (
        <div className="selected-user-banner compact">
          <div>
            <strong>{isEnglish ? `${selectedUser.display_name}'s posts` : `${selectedUser.display_name}님의 기록`}</strong>
          </div>
          <button type="button" className="ghost-chip" onClick={onClearSelectedUser}>
            {isEnglish ? 'Show All' : '전체로 보기'}
          </button>
        </div>
      )}

      <div className="feed-filter-row compact">
        {FILTERS[language].map((item) => (
          <button key={item.key} type="button" className={`feed-filter-chip ${filter === item.key ? 'active' : ''}`} onClick={() => setFilter(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="skeleton-stack">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-card feed">
              <div className="skeleton-row spread">
                <div className="skeleton-copy">
                  <span className="skeleton-line medium" />
                  <span className="skeleton-line short" />
                </div>
                <span className="skeleton-chip" />
              </div>
              <span className="skeleton-line long" />
              <span className="skeleton-line long" />
              <div className="skeleton-tag-row">
                <span className="skeleton-chip" />
                <span className="skeleton-chip" />
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !visiblePosts.length && (
        <div className="empty-state-card cool">
          <span className="empty-state-badge">{isEnglish ? 'Feed' : '피드 비어 있음'}</span>
          <strong>{isEnglish ? 'There is nothing in the feed yet.' : '아직 피드에 표시할 기록이 없어요.'}</strong>
          <p>
            {isEnglish
              ? 'Once workouts, level tests, or profile updates are saved, the community feed will begin to move.'
              : '운동 기록이나 레벨 테스트, 프로필 업데이트가 쌓이면 커뮤니티 피드가 자연스럽게 움직이기 시작해요.'}
          </p>
        </div>
      )}

      <div className="feed-list">
        {visiblePosts.map((post) => (
          <FeedCard key={post.id} post={post} onToggleLike={onToggleLike} onSubmitComment={onSubmitComment} />
        ))}
      </div>
    </section>
  )
}

