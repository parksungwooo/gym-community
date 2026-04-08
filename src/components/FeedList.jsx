import { useState } from 'react'
import UserAvatar from './UserAvatar'
import { formatDateTimeByLanguage, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import OptimizedImage from './OptimizedImage'
import { localizeLevelText } from '../utils/level'

const FILTERS = {
  ko: [
    { key: 'all', label: '전체' },
    { key: 'following', label: '팔로잉' },
    { key: 'same_level', label: '내 레벨' },
    { key: 'workout_complete', label: '운동' },
    { key: 'level_up', label: '레벨업' },
    { key: 'profile_update', label: '프로필' },
    { key: 'challenge_complete', label: '챌린지' },
  ],
  en: [
    { key: 'all', label: 'All' },
    { key: 'following', label: 'Following' },
    { key: 'same_level', label: 'My Level' },
    { key: 'workout_complete', label: 'Workout' },
    { key: 'level_up', label: 'Level Up' },
    { key: 'profile_update', label: 'Profile' },
    { key: 'challenge_complete', label: 'Challenge' },
  ],
}

function shortUser(userId, displayName, isEnglish) {
  if (displayName?.trim()) {
    if (displayName.includes('@')) {
      const localName = displayName.split('@')[0]?.trim()
      if (localName) return localName
    }
    return displayName.trim()
  }

  if (!userId) return isEnglish ? 'Guest' : '게스트'
  return `${isEnglish ? 'Guest' : '게스트'}-${userId.slice(0, 6)}`
}

function getTypeLabel(type, isEnglish) {
  const labels = {
    workout_complete: isEnglish ? 'Workout' : '운동',
    level_up: isEnglish ? 'Level Up' : '레벨업',
    profile_update: isEnglish ? 'Profile' : '프로필',
    challenge_complete: isEnglish ? 'Challenge' : '챌린지',
    test_result: isEnglish ? 'Test' : '테스트',
  }

  return labels[type] ?? (isEnglish ? 'Update' : '업데이트')
}

function getPostContent(post, language) {
  const isEnglish = language === 'en'
  const note = post.metadata?.note?.trim()

  switch (post.type) {
    case 'workout_complete': {
      if (note) return note
      return isEnglish ? 'Workout logged.' : '운동 기록 완료.'
    }
    case 'test_result':
      return isEnglish
        ? `${localizeLevelText(post.metadata?.level, language)} · ${post.metadata?.score ?? 0} pts`
        : `${localizeLevelText(post.metadata?.level, language)} · ${post.metadata?.score ?? 0}점`
    case 'level_up':
      return isEnglish
        ? `${localizeLevelText(post.metadata?.to, language)} reached`
        : `${localizeLevelText(post.metadata?.to, language)} 도달`
    case 'profile_update':
      return isEnglish ? 'Profile updated.' : '프로필 업데이트'
    case 'challenge_complete':
      return isEnglish
        ? `Goal done · ${post.metadata?.goal ?? 0}`
        : `주간 목표 완료 · ${post.metadata?.goal ?? 0}회`
    default:
      return post.content
  }
}

function getPostPhotoUrls(post) {
  if (Array.isArray(post.metadata?.photoUrls) && post.metadata.photoUrls.length) return post.metadata.photoUrls
  if (post.metadata?.photoUrl) return [post.metadata.photoUrl]
  return []
}

function getWorkoutStoryMeta(post, language, isEnglish) {
  if (post.type !== 'workout_complete') return null

  const workoutType = getWorkoutTypeLabel(post.metadata?.workoutType, language)
  const parts = [workoutType]

  if (post.metadata?.durationMinutes) {
    parts.push(isEnglish ? `${post.metadata.durationMinutes} min` : `${post.metadata.durationMinutes}분`)
  }

  return parts.join(' · ')
}

function FeedCard({
  post,
  onToggleLike,
  onSubmitComment,
  onOpenImage,
  onSelectUser,
  onReportPost,
  onBlockUser,
  currentUserId,
}) {
  const { language, isEnglish } = useI18n()
  const [comment, setComment] = useState('')
  const [commentOpen, setCommentOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const photoUrls = getPostPhotoUrls(post)
  const storyMeta = getWorkoutStoryMeta(post, language, isEnglish)
  const authorName = shortUser(post.user_id, post.authorDisplayName, isEnglish)
  const authorLevel = post.authorLevel
    ? localizeLevelText(post.authorLevel, language)
    : isEnglish ? 'Level pending' : '레벨 준비 중'

  const submitComment = async (event) => {
    event.preventDefault()
    if (!comment.trim()) return
    await onSubmitComment(post.id, comment)
    setComment('')
    setCommentOpen(false)
  }

  return (
    <article className={`feed-card compact feed-story-card feed-card-${post.type}`}>
      <div className="feed-story-header">
        <button
          type="button"
          className="feed-author-main feed-author-trigger feed-story-author"
          onClick={() =>
            onSelectUser?.({
              user_id: post.user_id,
              display_name: post.authorDisplayName,
              avatar_emoji: post.authorAvatarEmoji,
              avatar_url: post.authorAvatarUrl,
              latest_level: post.authorLevel,
              latest_score: post.authorScore,
            })
          }
        >
          <UserAvatar
            className="feed-author-avatar"
            imageUrl={post.authorAvatarUrl}
            fallback={post.authorAvatarEmoji || 'RUN'}
            alt={post.authorDisplayName || (isEnglish ? 'Author avatar' : '작성자 아바타')}
          />
          <div className="feed-author-copy">
            <span className="feed-author-name">{authorName}</span>
            <div className="feed-story-copy-meta">
              <span className="feed-level-chip">{authorLevel}</span>
              {post.authorScore ? (
                <span className="feed-score-chip">
                  {isEnglish ? `${post.authorScore} pts` : `체력 ${post.authorScore}점`}
                </span>
              ) : null}
            </div>
          </div>
        </button>

        <div className="feed-story-meta">
          <span className="feed-type-chip">{getTypeLabel(post.type, isEnglish)}</span>
          <span className="feed-story-time">
            {formatDateTimeByLanguage(post.created_at, language, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {storyMeta ? <div className="feed-story-highlight">{storyMeta}</div> : null}

      <p className="feed-content compact">{getPostContent(post, language)}</p>

      {!!photoUrls.length && (
        <div className={`feed-photo-grid feed-story-gallery ${photoUrls.length > 1 ? 'multi' : ''}`}>
          {photoUrls.map((url, index) => (
            <button
              key={`${post.id}-photo-${index}`}
              type="button"
              className="image-open-btn feed-story-image-button"
              onClick={() => onOpenImage(url)}
            >
              <div className="feed-photo-preview">
                <OptimizedImage
                  imageUrl={url}
                  preset="feedThumbnail"
                  alt={isEnglish ? 'Workout proof' : '운동 인증 사진'}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  sizes="(max-width: 640px) 44vw, 260px"
                />
              </div>
              <span className="feed-story-image-hint">
                {isEnglish ? 'Open' : '열기'}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="feed-story-footer">
        <div className="feed-actions compact">
          <button
            type="button"
            className={`like-btn ${post.likedByMe ? 'liked' : ''}`}
            onClick={() => onToggleLike(post.id, post.likedByMe)}
          >
            {isEnglish ? `Likes ${post.likeCount}` : `좋아요 ${post.likeCount}`}
          </button>
          <button
            type="button"
            className="comment-toggle-btn"
            onClick={() => {
              setCommentOpen((prev) => !prev)
              setMenuOpen(false)
            }}
          >
            {commentOpen
              ? (isEnglish ? `Hide ${post.comments.length}` : `접기 ${post.comments.length}`)
              : (isEnglish ? `Replies ${post.comments.length}` : `댓글 ${post.comments.length}`)}
          </button>
          {post.user_id !== currentUserId && (
            <div className="feed-more-wrap">
              <button
                type="button"
                className="ghost-chip feed-more-btn"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {isEnglish ? 'Menu' : '메뉴'}
              </button>
              {menuOpen && (
                <div className="feed-action-menu">
                  <button
                    type="button"
                    className="ghost-chip"
                    onClick={() => {
                      setMenuOpen(false)
                      onReportPost?.(post)
                    }}
                  >
                    {isEnglish ? 'Report' : '신고'}
                  </button>
                  <button
                    type="button"
                    className="ghost-chip danger-chip"
                    onClick={() => {
                      setMenuOpen(false)
                      onBlockUser?.(post.user_id, post.authorDisplayName)
                    }}
                  >
                    {isEnglish ? 'Block' : '차단'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {commentOpen && (
        <form className="comment-form compact" onSubmit={submitComment}>
          <input
            type="text"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={isEnglish ? 'Comment' : '댓글'}
            maxLength={120}
          />
          <button type="submit">{isEnglish ? 'Post' : '등록'}</button>
        </form>
      )}

      {!!post.comments.length && (
        <ul className="comment-list compact feed-comment-list">
          {post.comments.map((item) => (
            <li key={item.id} className="feed-comment-item">
              <strong>{shortUser(item.user_id, item.authorDisplayName, isEnglish)}</strong>
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default function FeedList({
  posts,
  onToggleLike,
  onSubmitComment,
  onReportPost,
  onBlockUser,
  loading,
  currentLevel,
  selectedUser,
  onClearSelectedUser,
  onSelectUser,
  followingIds = [],
  currentUserId,
}) {
  const { language, isEnglish } = useI18n()
  const [filter, setFilter] = useState('all')
  const [openImageUrl, setOpenImageUrl] = useState('')

  const visiblePosts = posts.filter((post) => {
    if (selectedUser?.user_id && post.user_id !== selectedUser.user_id) return false
    if (filter === 'all') return true
    if (filter === 'following') return post.user_id === currentUserId || followingIds.includes(post.user_id)
    if (filter === 'same_level') return Boolean(currentLevel) && post.authorLevel === currentLevel
    return post.type === filter
  })

  return (
    <section className="card community-feed-surface compact community-feed-redesign">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Feed' : '피드'}</span>
          <h2>{isEnglish ? 'Community' : '커뮤니티'}</h2>
        </div>
        <span className="community-mini-pill">{isEnglish ? `${visiblePosts.length} posts` : `${visiblePosts.length}개`}</span>
      </div>

      {selectedUser?.user_id && (
        <div className="selected-user-banner compact community-focus-banner">
          <strong>
            {isEnglish
              ? `${shortUser(selectedUser.user_id, selectedUser.display_name, isEnglish)}'s posts`
              : `${shortUser(selectedUser.user_id, selectedUser.display_name, isEnglish)}님의 게시물`}
          </strong>
          <button type="button" className="ghost-chip" onClick={onClearSelectedUser}>
            {isEnglish ? 'All' : '전체'}
          </button>
        </div>
      )}

      <div className="feed-filter-row compact">
        {FILTERS[language].map((item) => (
          <button
            key={item.key}
            type="button"
            className={`feed-filter-chip ${filter === item.key ? 'active' : ''}`}
            onClick={() => setFilter(item.key)}
          >
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
          <span className="empty-state-badge">
            {filter === 'following'
              ? (isEnglish ? 'Following' : '팔로잉')
              : (isEnglish ? 'Feed' : '피드')}
          </span>
          <strong>
            {filter === 'following'
              ? (isEnglish ? 'No following posts.' : '팔로우 글이 없어요.')
              : (isEnglish ? 'Feed is empty.' : '피드가 비어 있어요.')}
          </strong>
          <p>
            {filter === 'following'
              ? (isEnglish
                ? 'Follow more people.'
                : '더 팔로우해보세요.')
              : (isEnglish
                ? 'Posts will show up here.'
                : '글이 여기 쌓여요.')}
          </p>
        </div>
      )}

      <div className="feed-list">
        {visiblePosts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            onToggleLike={onToggleLike}
            onSubmitComment={onSubmitComment}
            onOpenImage={setOpenImageUrl}
            onSelectUser={onSelectUser}
            onReportPost={onReportPost}
            onBlockUser={onBlockUser}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {openImageUrl && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenImageUrl('')}
        >
          <div className="lightbox-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setOpenImageUrl('')}>
              {isEnglish ? 'Close' : '닫기'}
            </button>
            <img src={openImageUrl} alt={isEnglish ? 'Expanded workout image' : '확대한 운동 이미지'} />
          </div>
        </div>
      )}
    </section>
  )
}
